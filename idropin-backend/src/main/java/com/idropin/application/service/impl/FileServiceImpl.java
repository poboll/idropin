package com.idropin.application.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.idropin.application.service.FileService;
import com.idropin.common.exception.BusinessException;
import com.idropin.domain.dto.FileQueryRequest;
import com.idropin.domain.dto.FileUpdateRequest;
import com.idropin.domain.entity.File;
import com.idropin.domain.vo.FileUploadResult;
import com.idropin.domain.vo.FileVO;
import com.idropin.infrastructure.persistence.mapper.FileMapper;
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
import java.util.List;
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

    @Value("${file.upload.max-size:104857600}")
    private long maxFileSize;

    @Value("${file.upload.allowed-types:}")
    private List<String> allowedTypes;

    private static final int MAX_BATCH_SIZE = 10;

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
            file.setName(originalFilename);
            file.setOriginalName(originalFilename);
            file.setFileSize(multipartFile.getSize());
            file.setMimeType(multipartFile.getContentType());
            file.setStoragePath(storagePath);
            file.setStorageProvider("MINIO");
            file.setUploaderId(userId);
            file.setStatus("ACTIVE");
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
        if (!file.getUploaderId().equals(userId)) {
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
        return String.format("%s/%s/%s%s", userId, datePath, uuid, extension);
    }

    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf("."));
    }
}
