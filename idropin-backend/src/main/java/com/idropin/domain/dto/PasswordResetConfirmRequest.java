package com.idropin.domain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/**
 * 密码重置确认请求
 *
 * @author Idrop.in Team
 */
@Data
public class PasswordResetConfirmRequest {

    @NotBlank(message = "令牌不能为空")
    private String token;

    @NotBlank(message = "新密码不能为空")
    @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d_]{6,16}$", 
             message = "密码格式不正确(6-16位 支持字母/数字/下划线)")
    private String newPassword;
}
