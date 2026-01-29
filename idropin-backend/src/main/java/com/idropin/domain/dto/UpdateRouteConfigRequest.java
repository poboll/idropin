package com.idropin.domain.dto;

import lombok.Data;
import jakarta.validation.constraints.NotNull;

/**
 * 更新路由配置请求
 *
 * @author Idrop.in Team
 */
@Data
public class UpdateRouteConfigRequest {
    
    /**
     * 是否启用
     */
    @NotNull(message = "启用状态不能为空")
    private Boolean isEnabled;
    
    /**
     * 重定向URL
     */
    private String redirectUrl;
    
    /**
     * 重定向消息
     */
    private String redirectMessage;
}
