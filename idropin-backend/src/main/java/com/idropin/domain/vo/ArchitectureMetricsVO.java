package com.idropin.domain.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArchitectureMetricsVO implements Serializable {
    private static final long serialVersionUID = 1L;

    private CacheMetrics cache;
    private KafkaMetrics kafka;
    private AiMetrics ai;
    private SystemOverview system;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CacheMetrics implements Serializable {
        private static final long serialVersionUID = 1L;
        private long hits;
        private long misses;
        private double hitRate;
        private long totalKeys;
        private long memoryUsedBytes;
        private String memoryUsedHuman;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KafkaMetrics implements Serializable {
        private static final long serialVersionUID = 1L;
        private boolean connected;
        private long totalProduced;
        private long totalConsumed;
        private long pendingMessages;
        private String topic;
        private int partitions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AiMetrics implements Serializable {
        private static final long serialVersionUID = 1L;
        private long totalProcessed;
        private long pendingCount;
        private long successCount;
        private long failedCount;
        private double successRate;
        private boolean serviceAvailable;
        private String modelProvider;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SystemOverview implements Serializable {
        private static final long serialVersionUID = 1L;
        private boolean postgresConnected;
        private boolean redisConnected;
        private boolean kafkaConnected;
        private boolean minioConnected;
        private boolean pgvectorEnabled;
        private long uptimeSeconds;
        private String javaVersion;
        private long heapUsedMB;
        private long heapMaxMB;
    }
}
