package com.idropin.domain.vo;

import lombok.Data;

/**
 * 概况统计视图对象
 *
 * @author Idrop.in Team
 */
@Data
public class OverviewStatsVO {
    
    /**
     * 用户总数
     */
    private Long userCount;
    
    /**
     * 活跃用户数
     */
    private Long activeUserCount;
    
    /**
     * 昨日新增用户
     */
    private Long userCountYesterday;
    
    /**
     * 文件记录数
     */
    private Long recordCount;
    
    /**
     * 昨日新增记录
     */
    private Long recordCountYesterday;
    
    /**
     * OSS存储大小(字节)
     */
    private Long ossStorageBytes;
    
    /**
     * 日志数量
     */
    private Long logCount;
    
    /**
     * 昨日新增日志
     */
    private Long logCountYesterday;
    
    /**
     * 今日PV
     */
    private Long pvCount;
    
    /**
     * 今日UV
     */
    private Long uvCount;
    
    /**
     * 历史PV
     */
    private Long historyPvCount;
    
    /**
     * 历史UV
     */
    private Long historyUvCount;
    
    /**
     * 归档文件数
     */
    private Long archivedFileCount;
    
    /**
     * 归档文件大小(字节)
     */
    private Long archivedFileSize;
    
    /**
     * 无效文件数
     */
    private Long invalidFileCount;
    
    /**
     * 无效文件大小(字节)
     */
    private Long invalidFileSize;
}
