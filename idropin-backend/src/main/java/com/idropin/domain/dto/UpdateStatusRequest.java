package com.idropin.domain.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * 更新用户状态请求
 *
 * @author Idrop.in Team
 */
@Data
public class UpdateStatusRequest {
    
    /**
     * 用户状态: ACTIVE-正常, DISABLED-禁用
     */
    @NotBlank(message = "状态不能为空")
    @Pattern(regexp = "^(ACTIVE|DISABLED)$", message = "状态值无效")
    private String status;
}
