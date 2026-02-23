package com.idropin.domain.vo;

import lombok.Data;

@Data
public class StorageInfoVO {
    private String storageType;
    private String localPath;
    private String localBaseUrl;
    private String minioEndpoint;
    private String minioBucket;
    private String minioAccessKey;
    private String ossEndpoint;
    private String ossBucket;
    private String ossRegion;
    private String ossAccessKeyId;
    private String ossDomain;
    private String qiniuAccessKey;
    private String qiniuBucket;
    private String qiniuDomain;
    private String qiniuRegion;
    private String s3Endpoint;
    private String s3Bucket;
    private String s3Region;
    private String s3AccessKey;
    private boolean s3SecretKeyConfigured;
    private String nasPath;
    private String nasBaseUrl;
}
