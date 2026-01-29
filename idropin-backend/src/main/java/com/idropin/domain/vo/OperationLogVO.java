package com.idropin.domain.vo;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 操作日志视图对象
 *
 * @author Idrop.in Team
 */
@Data
public class OperationLogVO {
    
    private String id;
    
    /**
     * 操作者ID
     */
    private String operatorId;
    
    /**
     * 操作者名称
     */
    private String operatorName;
    
    /**
     * 操作类型
     */
    private String operationType;
    
    /**
     * 目标类型
     */
    private String targetType;
    
    /**
     * 目标ID
     */
    private String targetId;
    
    /**
     * 操作描述
     */
    private String description;
    
    /**
     * IP地址
     */
    private String ipAddress;
    
    /**
     * 创建时间
     */
    private LocalDateTime createdAt;
}
