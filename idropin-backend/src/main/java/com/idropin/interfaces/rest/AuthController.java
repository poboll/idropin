package com.idropin.interfaces.rest;

import com.idropin.application.service.AuthService;
import com.idropin.common.util.IpUtil;
import com.idropin.common.vo.Result;
import com.idropin.domain.dto.LoginRequest;
import com.idropin.domain.dto.LoginResponse;
import com.idropin.domain.dto.PasswordResetConfirmRequest;
import com.idropin.domain.dto.PasswordResetRequest;
import com.idropin.domain.dto.RegisterRequest;
import com.idropin.domain.entity.User;
import com.idropin.domain.vo.UserVO;
import com.idropin.infrastructure.ratelimit.RateLimit;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
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
    @RateLimit(permits = 5, seconds = 60, key = "register")
    @Operation(summary = "用户注册", description = "新用户注册账号")
    @PostMapping("/register")
    public Result<UserVO> register(@Valid @RequestBody RegisterRequest request, HttpServletRequest httpRequest) {
        String ipAddress = IpUtil.getClientIp(httpRequest);
        User user = authService.register(request, ipAddress);
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
    @RateLimit(permits = 10, seconds = 60, key = "login")
    @Operation(summary = "用户登录", description = "用户登录获取Token")
    @PostMapping("/login")
    public Result<LoginResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        String ipAddress = IpUtil.getClientIp(httpRequest);
        LoginResponse response = authService.login(request, ipAddress);
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

    @Operation(summary = "确认密码重置", description = "使用令牌重置密码")
    @PostMapping("/password-reset/confirm")
    public Result<Void> confirmPasswordReset(@Valid @RequestBody PasswordResetConfirmRequest request) {
        authService.confirmPasswordReset(request);
        return Result.<Void>success("密码重置成功", null);
    }

    @RateLimit(permits = 10, seconds = 60, key = "refresh")
    @Operation(summary = "刷新令牌", description = "使用 refresh token 获取新的 access token")
    @PostMapping("/refresh")
    public Result<LoginResponse> refresh(@RequestBody java.util.Map<String, String> body) {
        String refreshToken = body.get("refreshToken");
        if (refreshToken == null || refreshToken.isBlank()) {
            return Result.error(400, "refreshToken 不能为空");
        }
        return Result.success(authService.refreshToken(refreshToken));
    }

    @Operation(summary = "用户登出", description = "注销 refresh token")
    @PostMapping("/logout")
    public Result<Void> logout(@RequestBody java.util.Map<String, String> body) {
        String refreshToken = body.get("refreshToken");
        if (refreshToken != null && !refreshToken.isBlank()) {
            authService.logout(refreshToken);
        }
        return Result.<Void>success("已登出", null);
    }
}
