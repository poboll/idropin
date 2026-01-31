package com.idropin.domain.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 访问日志实体
 *
 * @author Idrop.in Team
 */
@Data
@TableName("sys_access_log")
public class AccessLog {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    /**
     * 用户ID（未登录为NULL）
     */
    private String userId;

    /**
     * IP地址
     */
    private String ipAddress;

    /**
     * User-Agent
     */
    private String userAgent;

    /**
     * 请求路径
     */
    private String requestPath;

    /**
     * 请求方法
     */
    private String requestMethod;

    /**
     * 来源页面
     */
    private String referer;

    /**
     * 会话ID（用于UV统计）
     */
    private String sessionId;

    /**
     * 创建时间
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
