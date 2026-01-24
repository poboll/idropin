package com.idropin.application.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.idropin.domain.dto.FileQueryRequest;
import com.idropin.domain.dto.FileUpdateRequest;
import com.idropin.domain.entity.File;
import com.idropin.domain.vo.FileUploadResult;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.List;

/**
 * 文件服务接口
 *
 * @author Idrop.in Team
 */
public interface FileService {

    /**
     * 上传单个文件
     */
    File uploadFile(MultipartFile file, String userId);

    /**
     * 上传多个文件
     */
    List<FileUploadResult> uploadFiles(List<MultipartFile> files, String userId);

    /**
     * 获取文件流
     */
    InputStream getFileStream(String fileId, String userId);

    /**
     * 获取文件列表
     */
    IPage<File> getFiles(FileQueryRequest query, String userId);

    /**
     * 获取文件详情
     */
    File getFile(String fileId, String userId);

    /**
     * 获取文件详情（不检查权限，用于公开访问）
     */
    File getFileById(String fileId);

    /**
     * 更新文件信息
     */
    File updateFile(String fileId, FileUpdateRequest request, String userId);

    /**
     * 更新文件实体
     */
    void updateFile(File file);

    /**
     * 删除文件
     */
    void deleteFile(String fileId, String userId);

    /**
     * 删除文件（不检查权限）
     */
    void deleteFile(String fileId);

    /**
     * 批量删除文件
     */
    void deleteFiles(List<String> fileIds, String userId);

    /**
     * 获取文件URL
     */
    String getFileUrl(String fileId);

    /**
     * 检查用户是否有权限访问文件
     */
    boolean hasPermission(String fileId, String userId);

    /**
     * 获取用户的所有文件
     */
    List<File> getFilesByUserId(String userId);
}
