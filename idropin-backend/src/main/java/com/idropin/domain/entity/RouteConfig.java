package com.idropin.domain.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 路由配置实体
 *
 * @author Idrop.in Team
 */
@Data
@TableName("sys_route_config")
public class RouteConfig {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    /**
     * 路由路径
     */
    private String routePath;

    /**
     * 路由名称
     */
    private String routeName;

    /**
     * 是否启用
     */
    private Boolean isEnabled;

    /**
     * 重定向URL
     */
    private String redirectUrl;

    /**
     * 重定向消息
     */
    private String redirectMessage;

    /**
     * 创建时间
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
