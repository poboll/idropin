package com.idropin.infrastructure.storage;

import com.idropin.application.service.ConfigService;
import com.qiniu.storage.Configuration;
import com.qiniu.storage.Region;
import com.qiniu.util.Auth;
import io.minio.MinioClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import okhttp3.OkHttpClient;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.net.Proxy;
import java.util.List;

@Slf4j
@Service
@Primary
@RequiredArgsConstructor
public class StorageServiceManager implements StorageService {

    private final ConfigService configService;

    private volatile StorageService delegate;
    private volatile String activeType;

    public synchronized void refresh() {
        log.info("Storage service refresh triggered, invalidating delegate");
        this.delegate = null;
        this.activeType = null;
    }

    public String getActiveStorageType() {
        return resolveType();
    }

    private String resolveType() {
        String type = configService.getSystemConfigValue("storage.type");
        return (type != null && !type.isBlank()) ? type.trim() : "local";
    }

    private String cfg(String key) {
        return configService.getSystemConfigValue(key);
    }

    private String cfg(String key, String fallback) {
        String v = cfg(key);
        return (v != null && !v.isBlank()) ? v : fallback;
    }

    private StorageService getDelegate() {
        String type = resolveType();
        if (delegate != null && type.equals(activeType)) {
            return delegate;
        }
        synchronized (this) {
            type = resolveType();
            if (delegate != null && type.equals(activeType)) {
                return delegate;
            }
            delegate = createService(type);
            activeType = type;
            log.info("Storage service switched to: {}", type);
        }
        return delegate;
    }

    private StorageService createService(String type) {
        return switch (type) {
            case "minio" -> createMinio();
            case "s3" -> createS3();
            case "qiniu" -> createQiniu();
            default -> createLocal();
        };
    }

    private StorageService createLocal() {
        String path = cfg("storage.local.path", "./uploads");
        String baseUrl = cfg("storage.local.base-url", "http://localhost:8081/api/files/download");
        LocalStorageService svc = new LocalStorageService(path, baseUrl);
        svc.init();
        return svc;
    }

    private StorageService createMinio() {
        String endpoint = cfg("storage.minio.endpoint", "http://localhost:9000");
        String accessKey = cfg("storage.minio.accessKey", "minioadmin");
        String secretKey = cfg("storage.minio.secretKey", "minioadmin");
        String bucket = cfg("storage.minio.bucket", "idropin-files");
        MinioClient client = MinioClient.builder()
                .endpoint(endpoint)
                .credentials(accessKey, secretKey)
                .build();
        MinioStorageService svc = new MinioStorageService(client, endpoint, bucket);
        svc.init();
        return svc;
    }

    private StorageService createS3() {
        String endpoint = cfg("storage.s3.endpoint", "https://s3.amazonaws.com");
        String accessKey = cfg("storage.s3.accessKey", "");
        String secretKey = cfg("storage.s3.secretKey", "");
        String bucket = cfg("storage.s3.bucket", "");
        String region = cfg("storage.s3.region", "us-east-1");
        log.info("Initializing S3 storage: endpoint={}, bucket={}, region={}", endpoint, bucket, region);
        OkHttpClient httpClient = new OkHttpClient.Builder()
                .proxy(Proxy.NO_PROXY)
                .build();
        MinioClient client = MinioClient.builder()
                .endpoint(endpoint)
                .credentials(accessKey, secretKey)
                .region(region)
                .httpClient(httpClient)
                .build();
        MinioStorageService svc = new MinioStorageService(client, endpoint, bucket);
        svc.init();
        return svc;
    }

    private StorageService createQiniu() {
        String ak = cfg("storage.qiniu.accessKey", "");
        String sk = cfg("storage.qiniu.secretKey", "");
        String bucket = cfg("storage.qiniu.bucket", "");
        String domain = cfg("storage.qiniu.domain", "");
        String region = cfg("storage.qiniu.region", "as0");
        Auth auth = Auth.create(ak, sk);
        Configuration qCfg = new Configuration(resolveQiniuRegion(region));
        return new QiniuStorageService(auth, qCfg, bucket, domain, region);
    }

    private Region resolveQiniuRegion(String region) {
        if (region == null) return Region.autoRegion();
        return switch (region) {
            case "z0" -> Region.region0();
            case "z1" -> Region.region1();
            case "z2" -> Region.region2();
            case "na0" -> Region.regionNa0();
            case "as0" -> Region.regionAs0();
            default -> Region.autoRegion();
        };
    }

    @Override
    public String uploadFile(String objectName, InputStream inputStream, String contentType, long size) {
        return getDelegate().uploadFile(objectName, inputStream, contentType, size);
    }

    @Override
    public InputStream downloadFile(String objectName) {
        return getDelegate().downloadFile(objectName);
    }

    @Override
    public void deleteFile(String objectName) {
        getDelegate().deleteFile(objectName);
    }

    @Override
    public void deleteFiles(List<String> objectNames) {
        getDelegate().deleteFiles(objectNames);
    }

    @Override
    public String getFileUrl(String objectName) {
        return getDelegate().getFileUrl(objectName);
    }

    @Override
    public String getPresignedUrl(String objectName, int expiry) {
        return getDelegate().getPresignedUrl(objectName, expiry);
    }

    @Override
    public boolean fileExists(String objectName) {
        return getDelegate().fileExists(objectName);
    }

    @Override
    public long getFileSize(String objectName) {
        return getDelegate().getFileSize(objectName);
    }

    @Override
    public String getContentType(String objectName) {
        return getDelegate().getContentType(objectName);
    }

    @Override
    public String getPresignedUploadUrl(String objectName, String contentType, int expiry) {
        return getDelegate().getPresignedUploadUrl(objectName, contentType, expiry);
    }

    @Override
    public String getUploadToken(String objectName, int expiry) {
        return getDelegate().getUploadToken(objectName, expiry);
    }

    @Override
    public void composeObjects(List<String> sourceKeys, String destKey) {
        getDelegate().composeObjects(sourceKeys, destKey);
    }
}
