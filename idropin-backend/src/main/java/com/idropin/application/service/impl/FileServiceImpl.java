package com.idropin.application.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.idropin.application.service.FileService;
import com.idropin.common.exception.BusinessException;
import com.idropin.domain.dto.FileQueryRequest;
import com.idropin.domain.dto.FileUpdateRequest;
import com.idropin.domain.entity.File;
import com.idropin.domain.entity.FileCategory;
import com.idropin.domain.vo.FileUploadResult;
import com.idropin.domain.vo.FileVO;
import com.idropin.infrastructure.persistence.mapper.FileMapper;
import com.idropin.infrastructure.persistence.mapper.FileCategoryMapper;
import com.idropin.infrastructure.storage.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 文件服务实现类
 *
 * @author Idrop.in Team
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FileServiceImpl implements FileService {

    private final FileMapper fileMapper;
    private final StorageService storageService;
    private final FileCategoryMapper categoryMapper;

    @Value("${file.upload.max-size:104857600}")
    private long maxFileSize;

    @Value("${file.upload.allowed-types:}")
    private List<String> allowedTypes;

    private static final int MAX_BATCH_SIZE = 10;
    
    private static final Map<String, String> CATEGORY_NAME_MAP = new HashMap<>();
    static {
        CATEGORY_NAME_MAP.put("文档", "43d7428b-0468-4623-abe4-19f50e8db9a0");
        CATEGORY_NAME_MAP.put("图片", "72e62a74-a7e0-4737-8361-cd8384093cd0");
        CATEGORY_NAME_MAP.put("视频", "fb79c20d-d601-419b-8947-b1d1c55a6131");
        CATEGORY_NAME_MAP.put("音频", "d9e923c1-bc8e-4da1-b361-3f5628d67826");
        CATEGORY_NAME_MAP.put("压缩包", "133f9930-e9a6-4db7-bcd4-9c4daa6ce008");
        CATEGORY_NAME_MAP.put("其他", "de17a518-59ec-44ef-a6b6-495d99b0ba0c");
    }

    @Override
    @Transactional
    public File uploadFile(MultipartFile multipartFile, String userId) {
        return uploadFileWithCustomName(multipartFile, userId, multipartFile.getOriginalFilename());
    }

    @Override
    @Transactional
    public File uploadFileWithCustomName(MultipartFile multipartFile, String userId, String customFilename) {
        validateFile(multipartFile);

        try {
            String originalFilename = customFilename != null ? customFilename : multipartFile.getOriginalFilename();
            String extension = getFileExtension(originalFilename);
            String storagePath = generateStoragePath(userId, extension);

            String url = storageService.uploadFile(
                    storagePath,
                    multipartFile.getInputStream(),
                    multipartFile.getContentType(),
                    multipartFile.getSize()
            );

            File file = new File();
            file.setId(java.util.UUID.randomUUID().toString());
            file.setName(originalFilename);
            file.setOriginalName(originalFilename);
            file.setFileSize(multipartFile.getSize());
            file.setMimeType(multipartFile.getContentType());
            file.setStoragePath(storagePath);
            file.setStorageProvider("MINIO");
            file.setUploaderId(userId);
            file.setStatus("ACTIVE");
            file.setCategoryId(determineCategoryId(multipartFile.getContentType()));
            file.setCreatedAt(LocalDateTime.now());
            file.setUpdatedAt(LocalDateTime.now());

            fileMapper.insertFile(file);
            // 查询刚插入的文件获取ID
            File insertedFile = fileMapper.findLatestByStoragePath(storagePath);
            if (insertedFile != null) {
                file.setId(insertedFile.getId());
            }
            log.info("File uploaded successfully: {} by user {}", originalFilename, userId);

            return file;
        } catch (Exception e) {
            log.error("Failed to upload file: {}", multipartFile.getOriginalFilename(), e);
            throw new BusinessException("文件上传失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public List<FileUploadResult> uploadFiles(List<MultipartFile> files, String userId) {
        if (files.size() > MAX_BATCH_SIZE) {
            throw new BusinessException("批量上传文件数量不能超过 " + MAX_BATCH_SIZE + " 个");
        }

        List<FileUploadResult> results = new ArrayList<>();
        for (MultipartFile file : files) {
            try {
                File uploadedFile = uploadFile(file, userId);
                String url = storageService.getFileUrl(uploadedFile.getStoragePath());
                FileVO fileVO = FileVO.fromEntity(uploadedFile, url);
                results.add(FileUploadResult.success(file.getOriginalFilename(), fileVO));
            } catch (Exception e) {
                log.error("Failed to upload file in batch: {}", file.getOriginalFilename(), e);
                results.add(FileUploadResult.failure(file.getOriginalFilename(), e.getMessage()));
            }
        }
        return results;
    }

    @Override
    public InputStream getFileStream(String fileId, String userId) {
        File file = getFile(fileId, userId);
        return storageService.downloadFile(file.getStoragePath());
    }

    @Override
    public IPage<File> getFiles(FileQueryRequest query, String userId) {
        int page = Math.max(query.getPage(), 1);  // 确保页码至少为1
        int size = query.getSize();
        int offset = (page - 1) * size;
        
        String categoryId = query.getCategoryId() != null ? query.getCategoryId().toString() : null;
        String keyword = StringUtils.hasText(query.getKeyword()) ? query.getKeyword() : null;
        
        List<File> files = fileMapper.findByUploaderIdWithPagination(userId, categoryId, keyword, size, offset);
        long total = fileMapper.countByUploaderIdWithCondition(userId, categoryId, keyword);
        
        Page<File> result = new Page<>(page, size);
        result.setRecords(files);
        result.setTotal(total);
        
        return result;
    }

    @Override
    public File getFile(String fileId, String userId) {
        File file = fileMapper.selectById(fileId);
        if (file == null) {
            throw new BusinessException("文件不存在");
        }
        if (file.getUploaderId() != null && !file.getUploaderId().equals(userId)) {
            throw new BusinessException("无权限访问此文件");
        }
        return file;
    }

    @Override
    public File getFileById(String fileId) {
        File file = fileMapper.selectById(fileId);
        if (file == null) {
            throw new BusinessException("文件不存在");
        }
        return file;
    }

    @Override
    @Transactional
    public File updateFile(String fileId, FileUpdateRequest request, String userId) {
        File file = getFile(fileId, userId);

        if (StringUtils.hasText(request.getName())) {
            file.setName(request.getName());
        }
        if (request.getCategoryId() != null) {
            file.setCategoryId(request.getCategoryId());
        }
        if (request.getTags() != null) {
            file.setTags(request.getTags().toArray(new String[0]));
        }
        if (request.getMetadata() != null) {
            file.setMetadata(request.getMetadata());
        }
        file.setUpdatedAt(LocalDateTime.now());

        fileMapper.updateById(file);
        log.info("File updated: {} by user {}", fileId, userId);

        return file;
    }

    @Override
    @Transactional
    public void deleteFile(String fileId, String userId) {
        File file = getFile(fileId, userId);

        try {
            storageService.deleteFile(file.getStoragePath());
        } catch (Exception e) {
            log.error("Failed to delete physical file: {}", file.getStoragePath(), e);
        }

        fileMapper.deleteById(fileId);
        log.info("File deleted: {} by user {}", fileId, userId);
    }

    @Override
    @Transactional
    public void deleteFiles(List<String> fileIds, String userId) {
        List<String> storagePaths = new ArrayList<>();
        
        for (String fileId : fileIds) {
            File file = fileMapper.selectById(fileId);
            if (file != null && file.getUploaderId().equals(userId)) {
                storagePaths.add(file.getStoragePath());
                fileMapper.deleteById(fileId);
            }
        }

        if (!storagePaths.isEmpty()) {
            try {
                storageService.deleteFiles(storagePaths);
            } catch (Exception e) {
                log.error("Failed to batch delete physical files", e);
            }
        }

        log.info("Batch deleted {} files by user {}", fileIds.size(), userId);
    }

    @Override
    public String getFileUrl(String fileId) {
        File file = fileMapper.selectById(fileId);
        if (file == null) {
            throw new BusinessException("文件不存在");
        }
        return storageService.getFileUrl(file.getStoragePath());
    }

    @Override
    public boolean hasPermission(String fileId, String userId) {
        File file = fileMapper.selectById(fileId);
        return file != null && file.getUploaderId().equals(userId);
    }

    @Override
    public List<File> getFilesByUserId(String userId) {
        return fileMapper.findByUploaderId(userId);
    }

    @Override
    @Transactional
    public void moveToTrash(String fileId, String userId) {
        File file = getFile(fileId, userId);
        if (Boolean.TRUE.equals(file.getDeleted())) {
            throw new BusinessException("文件已在回收站中");
        }
        fileMapper.softDeleteById(fileId, LocalDateTime.now());
        log.info("File moved to trash: {} by user {}", fileId, userId);
    }

    @Override
    @Transactional
    public void moveToTrash(List<String> fileIds, String userId) {
        LocalDateTime now = LocalDateTime.now();
        for (String fileId : fileIds) {
            File file = fileMapper.selectById(fileId);
            if (file != null && file.getUploaderId().equals(userId) && !Boolean.TRUE.equals(file.getDeleted())) {
                fileMapper.softDeleteById(fileId, now);
            }
        }
        log.info("Batch moved {} files to trash by user {}", fileIds.size(), userId);
    }

    @Override
    @Transactional
    public void restoreFromTrash(String fileId, String userId) {
        File file = fileMapper.selectById(fileId);
        if (file == null) {
            throw new BusinessException("文件不存在");
        }
        if (!file.getUploaderId().equals(userId)) {
            throw new BusinessException("无权限操作此文件");
        }
        if (!Boolean.TRUE.equals(file.getDeleted())) {
            throw new BusinessException("文件不在回收站中");
        }
        fileMapper.restoreById(fileId, LocalDateTime.now());
        log.info("File restored from trash: {} by user {}", fileId, userId);
    }

    @Override
    @Transactional
    public void restoreFromTrash(List<String> fileIds, String userId) {
        LocalDateTime now = LocalDateTime.now();
        for (String fileId : fileIds) {
            File file = fileMapper.selectById(fileId);
            if (file != null && file.getUploaderId().equals(userId) && Boolean.TRUE.equals(file.getDeleted())) {
                fileMapper.restoreById(fileId, now);
            }
        }
        log.info("Batch restored {} files from trash by user {}", fileIds.size(), userId);
    }

    @Override
    @Transactional
    public void permanentDelete(String fileId, String userId) {
        File file = fileMapper.selectById(fileId);
        if (file == null) {
            throw new BusinessException("文件不存在");
        }
        if (!file.getUploaderId().equals(userId)) {
            throw new BusinessException("无权限操作此文件");
        }
        if (!Boolean.TRUE.equals(file.getDeleted())) {
            throw new BusinessException("只能永久删除回收站中的文件");
        }
        try {
            storageService.deleteFile(file.getStoragePath());
        } catch (Exception e) {
            log.error("Failed to delete physical file: {}", file.getStoragePath(), e);
        }
        fileMapper.deleteById(fileId);
        log.info("File permanently deleted: {} by user {}", fileId, userId);
    }

    @Override
    @Transactional
    public void permanentDelete(List<String> fileIds, String userId) {
        List<String> storagePaths = new ArrayList<>();
        for (String fileId : fileIds) {
            File file = fileMapper.selectById(fileId);
            if (file != null && file.getUploaderId().equals(userId) && Boolean.TRUE.equals(file.getDeleted())) {
                storagePaths.add(file.getStoragePath());
                fileMapper.deleteById(fileId);
            }
        }
        if (!storagePaths.isEmpty()) {
            try {
                storageService.deleteFiles(storagePaths);
            } catch (Exception e) {
                log.error("Failed to batch delete physical files", e);
            }
        }
        log.info("Batch permanently deleted {} files by user {}", fileIds.size(), userId);
    }

    @Override
    @Transactional
    public void emptyTrash(String userId) {
        List<File> deletedFiles = fileMapper.findDeletedByUploaderId(userId);
        List<String> storagePaths = new ArrayList<>();
        for (File file : deletedFiles) {
            storagePaths.add(file.getStoragePath());
            fileMapper.deleteById(file.getId());
        }
        if (!storagePaths.isEmpty()) {
            try {
                storageService.deleteFiles(storagePaths);
            } catch (Exception e) {
                log.error("Failed to delete physical files when emptying trash", e);
            }
        }
        log.info("Trash emptied for user {}, deleted {} files", userId, deletedFiles.size());
    }

    @Override
    public IPage<File> getTrashFiles(int page, int size, String userId) {
        int offset = (page - 1) * size;
        List<File> files = fileMapper.findDeletedByUploaderIdWithPagination(userId, size, offset);
        long total = fileMapper.countDeletedByUploaderId(userId);
        
        Page<File> result = new Page<>(page, size);
        result.setRecords(files);
        result.setTotal(total);
        return result;
    }

    @Override
    public long getTrashCount(String userId) {
        return fileMapper.countDeletedByUploaderId(userId);
    }

    @Override
    @Transactional
    public void updateFile(File file) {
        file.setUpdatedAt(LocalDateTime.now());
        fileMapper.updateById(file);
        log.info("File updated: {}", file.getId());
    }

    @Override
    @Transactional
    public void deleteFile(String fileId) {
        File file = fileMapper.selectById(fileId);
        if (file != null) {
            try {
                storageService.deleteFile(file.getStoragePath());
            } catch (Exception e) {
                log.error("Failed to delete physical file: {}", file.getStoragePath(), e);
            }
            fileMapper.deleteById(fileId);
            log.info("File deleted: {}", fileId);
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("文件不能为空");
        }

        if (file.getSize() > maxFileSize) {
            throw new BusinessException("文件大小超过限制（最大 " + (maxFileSize / 1024 / 1024) + "MB）");
        }

        String contentType = file.getContentType();
        if (allowedTypes != null && !allowedTypes.isEmpty() && !allowedTypes.contains(contentType)) {
            throw new BusinessException("不支持的文件类型: " + contentType);
        }
    }

    private String generateStoragePath(String userId, String extension) {
        String uuid = UUID.randomUUID().toString().replace("-", "");
        String datePath = LocalDateTime.now().toString().substring(0, 10).replace("-", "/");
        String owner = (userId != null && !userId.isEmpty()) ? userId : "anonymous";
        return String.format("%s/%s/%s%s", owner, datePath, uuid, extension);
    }

    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf("."));
    }

    private String determineCategoryId(String mimeType) {
        if (mimeType == null) {
            return CATEGORY_NAME_MAP.get("其他");
        }
        
        mimeType = mimeType.toLowerCase();
        
        if (mimeType.startsWith("image/")) {
            return CATEGORY_NAME_MAP.get("图片");
        }
        
        if (mimeType.startsWith("video/")) {
            return CATEGORY_NAME_MAP.get("视频");
        }
        
        if (mimeType.startsWith("audio/")) {
            return CATEGORY_NAME_MAP.get("音频");
        }
        
        if (mimeType.contains("zip") || mimeType.contains("rar") || mimeType.contains("7z")
                || mimeType.contains("tar") || mimeType.contains("gz") || mimeType.contains("bz2")
                || mimeType.equals("application/x-compressed") || mimeType.equals("application/x-archive")) {
            return CATEGORY_NAME_MAP.get("压缩包");
        }
        
        if (mimeType.contains("pdf") || mimeType.contains("word") || mimeType.contains("document")
                || mimeType.contains("excel") || mimeType.contains("spreadsheet")
                || mimeType.contains("powerpoint") || mimeType.contains("presentation")
                || mimeType.startsWith("text/") || mimeType.equals("application/msword")
                || mimeType.equals("application/vnd.ms-excel") || mimeType.equals("application/vnd.ms-powerpoint")
                || mimeType.contains("application/vnd.openxmlformats-officedocument")) {
            return CATEGORY_NAME_MAP.get("文档");
        }
        
        return CATEGORY_NAME_MAP.get("其他");
    }
}
