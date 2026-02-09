package com.idropin.domain.vo;

import lombok.Data;

@Data
public class StorageInfoVO {
    private String storageType;
    private String localPath;
    private String localBaseUrl;
    private String minioEndpoint;
    private String minioBucket;
}
