package com.idropin.infrastructure.storage;

import com.idropin.common.exception.BusinessException;
import com.qiniu.common.QiniuException;
import com.qiniu.http.Response;
import com.qiniu.storage.BucketManager;
import com.qiniu.storage.Configuration;
import com.qiniu.storage.UploadManager;
import com.qiniu.util.Auth;
import lombok.extern.slf4j.Slf4j;

import java.io.InputStream;
import java.net.URL;
import java.util.List;

@Slf4j
public class QiniuStorageService implements StorageService {

    private static final java.util.Map<String, String> UPLOAD_URLS = java.util.Map.of(
        "z0", "https://up.qiniup.com",
        "z1", "https://up-z1.qiniup.com",
        "z2", "https://up-z2.qiniup.com",
        "na0", "https://up-na0.qiniup.com",
        "as0", "https://up-as0.qiniup.com"
    );

    private final Auth auth;
    private final Configuration cfg;
    private final String bucket;
    private final String domain;
    private final String region;

    public QiniuStorageService(Auth auth, Configuration cfg, String bucket, String domain, String region) {
        this.auth = auth;
        this.cfg = cfg;
        this.bucket = bucket;
        this.domain = domain;
        this.region = region;
    }

    @Override
    public String uploadFile(String objectName, InputStream inputStream, String contentType, long size) {
        try {
            UploadManager uploadManager = new UploadManager(cfg);
            String token = auth.uploadToken(bucket);
            Response response = uploadManager.put(inputStream, objectName, token, null, contentType);
            if (!response.isOK()) {
                throw new BusinessException("七牛云上传失败: " + response.error);
            }
            log.info("Uploaded file to Qiniu: {}", objectName);
            return getFileUrl(objectName);
        } catch (QiniuException e) {
            log.error("Failed to upload file to Qiniu: {}", objectName, e);
            throw new BusinessException("文件上传失败: " + e.getMessage());
        }
    }

    @Override
    public InputStream downloadFile(String objectName) {
        try {
            return new URL(getFileUrl(objectName)).openStream();
        } catch (Exception e) {
            log.error("Failed to download file from Qiniu: {}", objectName, e);
            throw new BusinessException("文件下载失败: " + e.getMessage());
        }
    }

    @Override
    public void deleteFile(String objectName) {
        try {
            new BucketManager(auth, cfg).delete(bucket, objectName);
            log.info("Deleted file from Qiniu: {}", objectName);
        } catch (QiniuException e) {
            log.error("Failed to delete file from Qiniu: {}", objectName, e);
            throw new BusinessException("文件删除失败: " + e.getMessage());
        }
    }

    @Override
    public void deleteFiles(List<String> objectNames) {
        BucketManager bm = new BucketManager(auth, cfg);
        for (String name : objectNames) {
            try {
                bm.delete(bucket, name);
            } catch (QiniuException e) {
                log.error("Failed to delete from Qiniu: {}", name, e);
            }
        }
    }

    @Override
    public String getFileUrl(String objectName) {
        String base = domain.endsWith("/") ? domain.substring(0, domain.length() - 1) : domain;
        if (!base.startsWith("http")) base = "http://" + base;
        return base + "/" + objectName;
    }

    @Override
    public String getPresignedUrl(String objectName, int expiry) {
        return auth.privateDownloadUrl(getFileUrl(objectName), expiry);
    }

    @Override
    public boolean fileExists(String objectName) {
        try {
            new BucketManager(auth, cfg).stat(bucket, objectName);
            return true;
        } catch (QiniuException e) {
            return false;
        }
    }

    @Override
    public long getFileSize(String objectName) {
        try {
            return new BucketManager(auth, cfg).stat(bucket, objectName).fsize;
        } catch (QiniuException e) {
            throw new BusinessException("获取文件大小失败: " + e.getMessage());
        }
    }

    @Override
    public String getContentType(String objectName) {
        try {
            return new BucketManager(auth, cfg).stat(bucket, objectName).mimeType;
        } catch (QiniuException e) {
            throw new BusinessException("获取文件类型失败: " + e.getMessage());
        }
    }

    @Override
    public String getPresignedUploadUrl(String objectName, String contentType, int expiry) {
        return UPLOAD_URLS.getOrDefault(region, "https://up.qiniup.com");
    }

    @Override
    public String getUploadToken(String objectName, int expiry) {
        return auth.uploadToken(bucket, objectName, expiry, null);
    }
}
