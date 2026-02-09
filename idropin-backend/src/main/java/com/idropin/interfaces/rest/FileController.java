package com.idropin.interfaces.rest;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.idropin.application.service.FileService;
import com.idropin.common.vo.Result;
import com.idropin.domain.dto.FileQueryRequest;
import com.idropin.domain.dto.FileUpdateRequest;
import com.idropin.domain.entity.File;
import com.idropin.domain.entity.TaskSubmission;
import com.idropin.domain.entity.TaskMoreInfo;
import com.idropin.domain.vo.FileUploadResult;
import com.idropin.domain.vo.FileVO;
import com.idropin.infrastructure.persistence.mapper.TaskSubmissionMapper;
import com.idropin.infrastructure.persistence.mapper.TaskMoreInfoMapper;
import com.idropin.infrastructure.security.CustomUserDetails;
import com.idropin.infrastructure.storage.StorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URLEncoder;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 文件控制器
 *
 * @author Idrop.in Team
 */
@Slf4j
@RestController
@RequestMapping("/files")
@RequiredArgsConstructor
@Tag(name = "文件管理", description = "文件上传、下载、管理相关接口")
public class FileController {

    private final FileService fileService;
    private final StorageService storageService;
    private final TaskSubmissionMapper taskSubmissionMapper;
    private final com.idropin.infrastructure.persistence.mapper.FileSubmissionMapper fileSubmissionMapper;
    private final TaskMoreInfoMapper taskMoreInfoMapper;

    @PostMapping("/upload")
    @Operation(summary = "单文件上传")
    public Result<FileVO> uploadFile(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {
        String userId = getUserId(userDetails);
        File uploadedFile = fileService.uploadFile(file, userId);
        String url = storageService.getFileUrl(uploadedFile.getStoragePath());
        return Result.success(FileVO.fromEntity(uploadedFile, url));
    }

    @PostMapping("/upload/batch")
    @Operation(summary = "多文件上传")
    public Result<List<FileUploadResult>> uploadFiles(
            @RequestParam("files") List<MultipartFile> files,
            @AuthenticationPrincipal UserDetails userDetails) {
        String userId = getUserId(userDetails);
        List<FileUploadResult> results = fileService.uploadFiles(files, userId);
        return Result.success(results);
    }

    @GetMapping("/{id}/download")
    @Operation(summary = "文件下载")
    public void downloadFile(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest request,
            HttpServletResponse response) throws IOException {
        String userId = getUserId(userDetails);
        File file = fileService.getFile(id, userId);
        
        String originalName = file.getOriginalName();
        if (originalName == null || originalName.isEmpty()) {
            originalName = "download";
        }
        String encodedFilename = URLEncoder.encode(originalName, "UTF-8")
                .replace("+", "%20");
        response.setContentType(file.getMimeType());
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION, 
                "attachment; filename=\"" + encodedFilename + "\"; filename*=UTF-8''" + encodedFilename);
        response.setContentLengthLong(file.getFileSize());

        String rangeHeader = request.getHeader(HttpHeaders.RANGE);
        if (rangeHeader != null && rangeHeader.startsWith("bytes=")) {
            handleRangeRequest(file, rangeHeader, response);
        } else {
            try (InputStream inputStream = fileService.getFileStream(id, userId);
                 OutputStream outputStream = response.getOutputStream()) {
                byte[] buffer = new byte[8192];
                int bytesRead;
                while ((bytesRead = inputStream.read(buffer)) != -1) {
                    outputStream.write(buffer, 0, bytesRead);
                }
            }
        }
    }

    @GetMapping("/{id}/preview")
    @Operation(summary = "文件预览")
    public void previewFile(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletResponse response) throws IOException {
        String userId = getUserId(userDetails);
        File file = fileService.getFile(id, userId);

        if (!isPreviewable(file.getMimeType())) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "该文件类型不支持预览");
            return;
        }

        String encodedFilename = URLEncoder.encode(file.getOriginalName(), "UTF-8")
                .replace("+", "%20");
        response.setContentType(file.getMimeType());
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION,
                "inline; filename=\"" + encodedFilename + "\"");
        response.setContentLengthLong(file.getFileSize());

        try (InputStream inputStream = fileService.getFileStream(id, userId);
             OutputStream outputStream = response.getOutputStream()) {
            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, bytesRead);
            }
        }
    }

    @GetMapping
    @Operation(summary = "获取文件列表")
    public Result<IPage<FileVO>> getFiles(
            FileQueryRequest query,
            @AuthenticationPrincipal UserDetails userDetails) {
        String userId = getUserId(userDetails);
        IPage<File> page = fileService.getFiles(query, userId);
        
        IPage<FileVO> voPage = page.convert(file -> {
            String url = storageService.getFileUrl(file.getStoragePath());
            return FileVO.fromEntity(file, url);
        });
        
        return Result.success(voPage);
    }

    @GetMapping("/{id}")
    @Operation(summary = "获取文件详情")
    public Result<FileVO> getFile(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails userDetails) {
        String userId = getUserId(userDetails);
        File file = fileService.getFile(id, userId);
        String url = storageService.getFileUrl(file.getStoragePath());
        return Result.success(FileVO.fromEntity(file, url));
    }

    @PutMapping("/{id}")
    @Operation(summary = "更新文件信息")
    public Result<FileVO> updateFile(
            @PathVariable String id,
            @RequestBody FileUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String userId = getUserId(userDetails);
        File file = fileService.updateFile(id, request, userId);
        String url = storageService.getFileUrl(file.getStoragePath());
        return Result.success(FileVO.fromEntity(file, url));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除文件")
    public Result<Void> deleteFile(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails userDetails) {
        String userId = getUserId(userDetails);
        fileService.deleteFile(id, userId);
        return Result.success(null);
    }

    @DeleteMapping("/batch")
    @Operation(summary = "批量删除文件")
    public Result<Void> deleteFiles(
            @RequestBody List<String> ids,
            @AuthenticationPrincipal UserDetails userDetails) {
        String userId = getUserId(userDetails);
        fileService.deleteFiles(ids, userId);
        return Result.success(null);
    }

    @PostMapping("/{id}/trash")
    @Operation(summary = "移动文件到回收站")
    public Result<Void> moveToTrash(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails userDetails) {
        String userId = getUserId(userDetails);
        fileService.moveToTrash(id, userId);
        return Result.success(null);
    }

    @PostMapping("/batch/trash")
    @Operation(summary = "批量移动文件到回收站")
    public Result<Void> batchMoveToTrash(
            @RequestBody List<String> ids,
            @AuthenticationPrincipal UserDetails userDetails) {
        String userId = getUserId(userDetails);
        fileService.moveToTrash(ids, userId);
        return Result.success(null);
    }

    @PostMapping("/{id}/restore")
    @Operation(summary = "从回收站恢复文件")
    public Result<Void> restoreFromTrash(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails userDetails) {
        String userId = getUserId(userDetails);
        fileService.restoreFromTrash(id, userId);
        return Result.success(null);
    }

    @PostMapping("/batch/restore")
    @Operation(summary = "批量恢复文件")
    public Result<Void> batchRestoreFromTrash(
            @RequestBody List<String> ids,
            @AuthenticationPrincipal UserDetails userDetails) {
        String userId = getUserId(userDetails);
        fileService.restoreFromTrash(ids, userId);
        return Result.success(null);
    }

    @DeleteMapping("/{id}/permanent")
    @Operation(summary = "永久删除文件")
    public Result<Void> permanentDelete(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails userDetails) {
        String userId = getUserId(userDetails);
        fileService.permanentDelete(id, userId);
        return Result.success(null);
    }

    @DeleteMapping("/batch/permanent")
    @Operation(summary = "批量永久删除文件")
    public Result<Void> batchPermanentDelete(
            @RequestBody List<String> ids,
            @AuthenticationPrincipal UserDetails userDetails) {
        String userId = getUserId(userDetails);
        fileService.permanentDelete(ids, userId);
        return Result.success(null);
    }

    @DeleteMapping("/trash/empty")
    @Operation(summary = "清空回收站")
    public Result<Void> emptyTrash(@AuthenticationPrincipal UserDetails userDetails) {
        String userId = getUserId(userDetails);
        fileService.emptyTrash(userId);
        return Result.success(null);
    }

    @GetMapping("/trash")
    @Operation(summary = "获取回收站文件列表")
    public Result<IPage<FileVO>> getTrashFiles(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        String userId = getUserId(userDetails);
        IPage<File> filePage = fileService.getTrashFiles(page, size, userId);
        
        IPage<FileVO> voPage = filePage.convert(file -> {
            String url = storageService.getFileUrl(file.getStoragePath());
            return FileVO.fromEntity(file, url);
        });
        
        return Result.success(voPage);
    }

    @GetMapping("/trash/count")
    @Operation(summary = "获取回收站文件数量")
    public Result<Long> getTrashCount(@AuthenticationPrincipal UserDetails userDetails) {
        String userId = getUserId(userDetails);
        return Result.success(fileService.getTrashCount(userId));
    }

    /**
     * 公开文件下载接口（用于本地存储模式）
     */
    @GetMapping("/download/{*path}")
    @Operation(summary = "公开文件下载")
    public void publicDownload(
            @PathVariable String path,
            HttpServletResponse response) throws IOException {
        try (InputStream inputStream = storageService.downloadFile(path);
             OutputStream outputStream = response.getOutputStream()) {
            // 根据文件扩展名设置Content-Type
            String contentType = getContentType(path);
            response.setContentType(contentType);
            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, bytesRead);
            }
        } catch (Exception e) {
            response.sendError(HttpServletResponse.SC_NOT_FOUND, "文件不存在");
        }
    }

    /**
     * 获取上传凭证（兼容旧版API）
     */
    @GetMapping("/upload/token")
    @Operation(summary = "获取上传凭证")
    public Result<String> getUploadToken(@AuthenticationPrincipal UserDetails userDetails) {
        // 本地存储模式不需要凭证，返回一个简单的token
        String userId = getUserIdOrNull(userDetails);
        return Result.success("local-upload-token-" + (userId != null ? userId : "anonymous"));
    }

    /**
     * 添加文件记录（兼容旧版API，用于任务提交）
     */
    @PostMapping("/add")
    @Operation(summary = "添加文件记录")
    public Result<java.util.Map<String, Object>> addFile(
            @RequestBody java.util.Map<String, Object> options,
            @AuthenticationPrincipal UserDetails userDetails) {
        String userId = getUserIdOrNull(userDetails);
        String name = (String) options.get("name");
        String hash = (String) options.get("hash");
        Number size = (Number) options.get("size");
        String taskKey = (String) options.get("key");
        String info = options.get("info") != null ? options.get("info").toString() : null;
        String peopleName = (String) options.get("peopleName");
        
        log.info("Adding file record: name={}, hash={}, taskKey={}, userId={}, peopleName={}", name, hash, taskKey, userId, peopleName);
        
        // 创建提交记录
        TaskSubmission submission = new TaskSubmission();
        submission.setTaskKey(taskKey);
        submission.setFileName(name);
        submission.setFileHash(hash);
        submission.setFileSize(size != null ? size.longValue() : 0L);
        submission.setSubmitterName(peopleName);
        submission.setSubmitInfo(info);
        submission.setSubmitterId(userId);
        submission.setStatus(0); // 已提交
        
        taskSubmissionMapper.insert(submission);
        log.info("File submission record created: id={}", submission.getId());
        
        // 返回submission ID供前端撤回使用
        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("submissionId", submission.getId());
        result.put("fileName", name);
        
        return Result.success(result);
    }

    /**
     * 撤回文件（兼容旧版API）
     */
    @PostMapping("/withdraw")
    @Operation(summary = "撤回文件")
    public Result<Void> withdrawFile(
            @RequestBody java.util.Map<String, Object> options,
            @AuthenticationPrincipal UserDetails userDetails) {
        String userId = getUserIdOrNull(userDetails);
        String taskKey = (String) options.get("key");
        Object idObj = options.get("id");
        String filename = (String) options.get("filename");
        
        log.info("Withdrawing file: taskKey={}, id={}, filename={}, userId={}", taskKey, idObj, filename, userId);
        
        if (taskKey == null || taskKey.isEmpty()) {
            throw new com.idropin.common.exception.BusinessException("任务key不能为空");
        }
        
        // 先尝试从task_submission表删除（使用filename查询）
        if (filename != null && !filename.isEmpty()) {
            TaskSubmission submission = taskSubmissionMapper.findByTaskKeyAndFileName(taskKey, filename);
            if (submission != null) {
                // 软删除：设置status为1表示已撤回
                submission.setStatus(1);
                taskSubmissionMapper.updateById(submission);
                log.info("File submission withdrawn from task_submission: id={}", submission.getId());
                return Result.success(null);
            }
        }
        
        // 如果task_submission表没有找到，尝试使用ID查询（兼容旧逻辑）
        if (idObj != null) {
            try {
                // 尝试作为Long类型的ID查询task_submission
                Long submissionId = null;
                if (idObj instanceof Number) {
                    submissionId = ((Number) idObj).longValue();
                } else if (idObj instanceof String) {
                    try {
                        submissionId = Long.parseLong((String) idObj);
                    } catch (NumberFormatException e) {
                        // 不是数字，忽略
                    }
                }
                
                if (submissionId != null) {
                    TaskSubmission submission = taskSubmissionMapper.selectById(submissionId);
                    if (submission != null && submission.getTaskKey().equals(taskKey)) {
                        submission.setStatus(1);
                        taskSubmissionMapper.updateById(submission);
                        log.info("File submission withdrawn by ID from task_submission: id={}", submissionId);
                        return Result.success(null);
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to withdraw by ID: {}", e.getMessage());
            }
        }
        
        throw new com.idropin.common.exception.BusinessException("未找到可撤回的提交记录，可能已被撤回或不存在");
    }

    /**
     * 检查提交状态（兼容旧版API）
     */
    @PostMapping("/check-submit")
    @Operation(summary = "检查提交状态")
    public Result<java.util.Map<String, Object>> checkSubmitStatus(
            @RequestBody java.util.Map<String, Object> options,
            @AuthenticationPrincipal UserDetails userDetails) {
        String taskKey = (String) options.get("taskKey");
        Object info = options.get("info");
        String name = (String) options.get("name");
        
        log.info("Checking submit status: taskKey={}, name={}", taskKey, name);
        
        // 查询file_submission表（新的提交记录）- 使用自定义方法避免类型转换问题
        List<com.idropin.domain.entity.FileSubmission> fileSubmissions = fileSubmissionMapper.findByTaskIdAndSubmitterName(taskKey, name);
        
        // 如果新表没有记录，再查询task_submission表（旧的提交记录）
        boolean hasSubmission = !fileSubmissions.isEmpty();
        int count = fileSubmissions.size();
        LocalDateTime lastSubmitTime = null;
        
        if (!hasSubmission) {
            List<TaskSubmission> taskSubmissions = taskSubmissionMapper.findByTaskKeyAndSubmitterName(taskKey, name);
            hasSubmission = !taskSubmissions.isEmpty();
            count = taskSubmissions.size();
            if (!taskSubmissions.isEmpty()) {
                lastSubmitTime = taskSubmissions.get(0).getCreatedAt();
            }
        } else {
            lastSubmitTime = fileSubmissions.get(0).getSubmittedAt();
        }
        
        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("isSubmit", hasSubmission);
        if (hasSubmission) {
            result.put("count", count);
            result.put("lastSubmitTime", lastSubmitTime);
        }
        
        return Result.success(result);
    }

    private String getUserIdOrNull(UserDetails userDetails) {
        if (userDetails instanceof CustomUserDetails) {
            return ((CustomUserDetails) userDetails).getUserId();
        }
        return null;
    }

    private String getContentType(String path) {
        if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
        if (path.endsWith(".png")) return "image/png";
        if (path.endsWith(".gif")) return "image/gif";
        if (path.endsWith(".pdf")) return "application/pdf";
        if (path.endsWith(".txt")) return "text/plain";
        if (path.endsWith(".html")) return "text/html";
        if (path.endsWith(".mp4")) return "video/mp4";
        if (path.endsWith(".mp3")) return "audio/mpeg";
        return "application/octet-stream";
    }

    private String getUserId(UserDetails userDetails) {
        if (userDetails instanceof CustomUserDetails) {
            return ((CustomUserDetails) userDetails).getUserId();
        }
        throw new IllegalStateException("Invalid user details type");
    }

    private boolean isPreviewable(String mimeType) {
        if (mimeType == null) return false;
        return mimeType.startsWith("image/") ||
               mimeType.equals("application/pdf") ||
               mimeType.startsWith("text/") ||
               mimeType.startsWith("video/") ||
               mimeType.startsWith("audio/");
    }

    private void handleRangeRequest(File file, String rangeHeader, HttpServletResponse response) 
            throws IOException {
        String range = rangeHeader.substring("bytes=".length());
        String[] parts = range.split("-");
        
        long start = Long.parseLong(parts[0]);
        long end = parts.length > 1 && !parts[1].isEmpty() 
                ? Long.parseLong(parts[1]) 
                : file.getFileSize() - 1;
        long contentLength = end - start + 1;

        response.setStatus(HttpServletResponse.SC_PARTIAL_CONTENT);
        response.setHeader(HttpHeaders.CONTENT_RANGE, 
                String.format("bytes %d-%d/%d", start, end, file.getFileSize()));
        response.setContentLengthLong(contentLength);

        try (InputStream inputStream = storageService.downloadFile(file.getStoragePath());
             OutputStream outputStream = response.getOutputStream()) {
            inputStream.skip(start);
            byte[] buffer = new byte[8192];
            long remaining = contentLength;
            int read;
            while (remaining > 0 && (read = inputStream.read(buffer, 0, (int) Math.min(buffer.length, remaining))) != -1) {
                outputStream.write(buffer, 0, read);
                remaining -= read;
            }
        }
    }

    /**
     * 获取任务模板文件（公开接口）
     */
    @GetMapping("/template")
    @Operation(summary = "获取任务模板文件")
    public void getTemplate(
            @RequestParam String template,
            @RequestParam String key,
            HttpServletResponse response) throws IOException {
        
        try {
            // 查询任务的模板信息
            TaskMoreInfo moreInfo = taskMoreInfoMapper.selectByTaskId(key);
            
            if (moreInfo == null || moreInfo.getTemplate() == null || moreInfo.getTemplate().isEmpty()) {
                response.setContentType("text/plain; charset=UTF-8");
                response.getWriter().write("该任务暂未设置模板文件");
                return;
            }
            
            // 验证请求的template参数与数据库中的一致
            if (!template.equals(moreInfo.getTemplate())) {
                response.setContentType("text/plain; charset=UTF-8");
                response.getWriter().write("无权访问此模板");
                return;
            }
            
            // 设置响应头
            response.setContentType("text/plain; charset=UTF-8");
            
            // TODO: 实际的文件下载逻辑
            // 目前模板文件只是存储了文件名，需要实现实际的文件存储和下载
            // 当实现文件存储后，应该：
            // 1. 从存储服务获取文件流
            // 2. 设置正确的Content-Type
            // 3. 设置Content-Disposition为attachment
            // 4. 将文件流写入response
            
            response.getWriter().write("模板文件下载功能开发中\n\n");
            response.getWriter().write("提示：目前模板文件功能仅保存了文件名（" + template + "），\n");
            response.getWriter().write("完整的文件上传和下载功能将在后续版本中实现。");
        } catch (Exception e) {
            log.error("获取模板文件失败", e);
            response.setContentType("text/plain; charset=UTF-8");
            response.getWriter().write("获取模板文件失败：" + e.getMessage());
        }
    }
}