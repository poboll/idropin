package com.idropin.domain.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 操作日志实体
 *
 * @author Idrop.in Team
 */
@Data
@TableName("sys_operation_log")
public class OperationLog {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    /**
     * 操作者ID
     */
    private String operatorId;

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
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
