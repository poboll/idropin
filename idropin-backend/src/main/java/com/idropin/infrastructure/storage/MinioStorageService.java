package com.idropin.infrastructure.storage;

import com.idropin.common.exception.BusinessException;
import io.minio.*;
import io.minio.ComposeObjectArgs;
import io.minio.SourceObject;
import io.minio.errors.*;
import io.minio.Http.Method;
import io.minio.messages.DeleteRequest;
import io.minio.messages.DeleteResult;
import lombok.extern.slf4j.Slf4j;

import java.io.InputStream;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
public class MinioStorageService implements StorageService {

    private final MinioClient minioClient;
    private final String endpoint;
    private final String bucket;

    public MinioStorageService(MinioClient minioClient, String endpoint, String bucket) {
        this.minioClient = minioClient;
        this.endpoint = endpoint;
        this.bucket = bucket;
    }

    public void init() {
        try {
            boolean bucketExists = minioClient.bucketExists(
                    BucketExistsArgs.builder().bucket(bucket).build()
            );
            if (!bucketExists) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
                log.info("Created MinIO bucket: {}", bucket);
            }
        } catch (Exception e) {
            log.error("Failed to initialize MinIO bucket", e);
        }
    }

    @Override
    public String uploadFile(String objectName, InputStream inputStream, String contentType, long size) {
        try {
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucket)
                            .object(objectName)
                            .stream(inputStream, size, -1L)
                            .contentType(contentType)
                            .build()
            );
            log.info("Uploaded file to MinIO: {}", objectName);
            return getFileUrl(objectName);
        } catch (Exception e) {
            log.error("Failed to upload file to MinIO: {}", objectName, e);
            throw new BusinessException("文件上传失败: " + e.getMessage());
        }
    }

    @Override
    public InputStream downloadFile(String objectName) {
        try {
            return minioClient.getObject(
                    GetObjectArgs.builder()
                            .bucket(bucket)
                            .object(objectName)
                            .build()
            );
        } catch (Exception e) {
            log.error("Failed to download file from MinIO: {}", objectName, e);
            throw new BusinessException("文件下载失败: " + e.getMessage());
        }
    }

    @Override
    public void deleteFile(String objectName) {
        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(bucket)
                            .object(objectName)
                            .build()
            );
            log.info("Deleted file from MinIO: {}", objectName);
        } catch (Exception e) {
            log.error("Failed to delete file from MinIO: {}", objectName, e);
            throw new BusinessException("文件删除失败: " + e.getMessage());
        }
    }

    @Override
    public void deleteFiles(List<String> objectNames) {
        try {
            List<DeleteRequest.Object> objects = objectNames.stream()
                    .map(DeleteRequest.Object::new)
                    .collect(Collectors.toList());

            Iterable<Result<DeleteResult.Error>> results = minioClient.removeObjects(
                    RemoveObjectsArgs.builder()
                            .bucket(bucket)
                            .objects(objects)
                            .build()
            );

            for (Result<DeleteResult.Error> result : results) {
                DeleteResult.Error error = result.get();
                log.error("Failed to delete object: {}", error.objectName());
            }
            log.info("Batch deleted {} files from MinIO", objectNames.size());
        } catch (Exception e) {
            log.error("Failed to batch delete files from MinIO", e);
            throw new BusinessException("批量删除文件失败: " + e.getMessage());
        }
    }

    @Override
    public String getFileUrl(String objectName) {
        // Return backend proxy URL for private S3 buckets
        // The /api/files/download/ endpoint will stream the file from S3
        return "/api/files/download/" + objectName;
    }

    @Override
    public String getPresignedUrl(String objectName, int expiry) {
        try {
            return minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(bucket)
                            .object(objectName)
                            .expiry(expiry, TimeUnit.SECONDS)
                            .build()
            );
        } catch (Exception e) {
            log.error("Failed to get presigned URL for: {}", objectName, e);
            throw new BusinessException("获取文件链接失败: " + e.getMessage());
        }
    }

    @Override
    public boolean fileExists(String objectName) {
        try {
            minioClient.statObject(
                    StatObjectArgs.builder()
                            .bucket(bucket)
                            .object(objectName)
                            .build()
            );
            return true;
        } catch (ErrorResponseException e) {
            if (e.errorResponse().code().equals("NoSuchKey")) {
                return false;
            }
            throw new BusinessException("检查文件是否存在失败: " + e.getMessage());
        } catch (Exception e) {
            throw new BusinessException("检查文件是否存在失败: " + e.getMessage());
        }
    }

    @Override
    public long getFileSize(String objectName) {
        try {
            StatObjectResponse stat = minioClient.statObject(
                    StatObjectArgs.builder()
                            .bucket(bucket)
                            .object(objectName)
                            .build()
            );
            return stat.size();
        } catch (Exception e) {
            log.error("Failed to get file size for: {}", objectName, e);
            throw new BusinessException("获取文件大小失败: " + e.getMessage());
        }
    }

    @Override
    public String getContentType(String objectName) {
        try {
            StatObjectResponse stat = minioClient.statObject(
                    StatObjectArgs.builder()
                            .bucket(bucket)
                            .object(objectName)
                            .build()
            );
            return stat.contentType();
        } catch (Exception e) {
            log.error("Failed to get content type for: {}", objectName, e);
            throw new BusinessException("获取文件类型失败: " + e.getMessage());
        }
    }

    @Override
    public String getPresignedUploadUrl(String objectName, String contentType, int expiry) {
        try {
            return minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.PUT)
                            .bucket(bucket)
                            .object(objectName)
                            .expiry(expiry, TimeUnit.SECONDS)
                            .build()
            );
        } catch (Exception e) {
            log.error("Failed to get presigned upload URL for: {}", objectName, e);
            throw new BusinessException("获取上传链接失败: " + e.getMessage());
        }
    }

    @Override
    public void composeObjects(List<String> sourceKeys, String destKey) {
        try {
            List<SourceObject> sources = sourceKeys.stream()
                .map(k -> SourceObject.builder().bucket(bucket).object(k).build())
                .collect(Collectors.toList());
            minioClient.composeObject(ComposeObjectArgs.builder()
                .bucket(bucket).object(destKey).sources(sources).build());
            log.info("Composed {} chunks into {}", sourceKeys.size(), destKey);
        } catch (Exception e) {
            log.error("Failed to compose objects into {}", destKey, e);
            throw new UnsupportedOperationException("composeObject failed: " + e.getMessage(), e);
        }
    }
}
