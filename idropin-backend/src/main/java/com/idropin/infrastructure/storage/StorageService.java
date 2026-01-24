package com.idropin.infrastructure.storage;

import java.io.InputStream;
import java.util.List;

/**
 * 存储服务接口
 *
 * @author Idrop.in Team
 */
public interface StorageService {

    /**
     * 上传文件
     *
     * @param objectName  对象名称
     * @param inputStream 输入流
     * @param contentType 内容类型
     * @param size        文件大小
     * @return 文件URL
     */
    String uploadFile(String objectName, InputStream inputStream, String contentType, long size);

    /**
     * 下载文件
     *
     * @param objectName 对象名称
     * @return 输入流
     */
    InputStream downloadFile(String objectName);

    /**
     * 删除文件
     *
     * @param objectName 对象名称
     */
    void deleteFile(String objectName);

    /**
     * 批量删除文件
     *
     * @param objectNames 对象名称列表
     */
    void deleteFiles(List<String> objectNames);

    /**
     * 获取文件URL
     *
     * @param objectName 对象名称
     * @return 文件URL
     */
    String getFileUrl(String objectName);

    /**
     * 获取文件URL（带过期时间）
     *
     * @param objectName 对象名称
     * @param expiry     过期时间（秒）
     * @return 文件URL
     */
    String getPresignedUrl(String objectName, int expiry);

    /**
     * 检查文件是否存在
     *
     * @param objectName 对象名称
     * @return 是否存在
     */
    boolean fileExists(String objectName);

    /**
     * 获取文件大小
     *
     * @param objectName 对象名称
     * @return 文件大小
     */
    long getFileSize(String objectName);

    /**
     * 获取文件内容类型
     *
     * @param objectName 对象名称
     * @return 内容类型
     */
    String getContentType(String objectName);
}
