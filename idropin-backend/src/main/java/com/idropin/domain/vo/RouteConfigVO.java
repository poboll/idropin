package com.idropin.domain.vo;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 路由配置视图对象
 *
 * @author Idrop.in Team
 */
@Data
public class RouteConfigVO {
    
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
    private LocalDateTime createdAt;
    
    /**
     * 更新时间
     */
    private LocalDateTime updatedAt;
}
