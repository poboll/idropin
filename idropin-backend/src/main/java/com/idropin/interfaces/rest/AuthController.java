package com.idropin.interfaces.rest;

import com.idropin.application.service.AuthService;
import com.idropin.common.vo.Result;
import com.idropin.domain.dto.LoginRequest;
import com.idropin.domain.dto.LoginResponse;
import com.idropin.domain.dto.PasswordResetConfirmRequest;
import com.idropin.domain.dto.PasswordResetRequest;
import com.idropin.domain.dto.RegisterRequest;
import com.idropin.domain.entity.User;
import com.idropin.domain.vo.UserVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 认证控制器
 *
 * @author Idrop.in Team
 */
@Tag(name = "认证管理", description = "用户注册、登录等认证相关接口")
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * 用户注册
     */
    @Operation(summary = "用户注册", description = "新用户注册账号")
    @PostMapping("/register")
    public Result<UserVO> register(@Valid @RequestBody RegisterRequest request) {
        User user = authService.register(request);
        UserVO userVO = UserVO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .status(user.getStatus())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
        return Result.success(userVO);
    }

    /**
     * 用户登录
     */
    @Operation(summary = "用户登录", description = "用户登录获取Token")
    @PostMapping("/login")
    public Result<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return Result.success(response);
    }

    /**
     * 请求密码重置
     */
    @Operation(summary = "请求密码重置", description = "通过邮箱请求密码重置链接")
    @PostMapping("/password-reset/request")
    public Result<Void> requestPasswordReset(@Valid @RequestBody PasswordResetRequest request) {
        authService.requestPasswordReset(request);
        return Result.<Void>success("密码重置邮件已发送，请查收", null);
    }

    /**
     * 确认密码重置
     */
    @Operation(summary = "确认密码重置", description = "使用令牌重置密码")
    @PostMapping("/password-reset/confirm")
    public Result<Void> confirmPasswordReset(@Valid @RequestBody PasswordResetConfirmRequest request) {
        authService.confirmPasswordReset(request);
        return Result.<Void>success("密码重置成功", null);
    }
}
