package com.idropin.domain.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;

/**
 * 更新用户角色请求
 *
 * @author Idrop.in Team
 */
@Data
public class UpdateRoleRequest {
    
    /**
     * 新角色: USER-普通用户, ADMIN-管理员, SUPER_ADMIN-超级管理员
     */
    @NotBlank(message = "角色不能为空")
    private String role;
}
