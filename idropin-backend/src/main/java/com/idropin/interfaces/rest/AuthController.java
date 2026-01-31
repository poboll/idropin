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
    @Operation(summary = "用户注册", description = "新用户注册账号")
    @PostMapping("/register")
    public Result<UserVO> register(@Valid @RequestBody RegisterRequest request, HttpServletRequest httpRequest) {
        String ipAddress = getClientIp(httpRequest);
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
    @Operation(summary = "用户登录", description = "用户登录获取Token")
    @PostMapping("/login")
    public Result<LoginResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        String ipAddress = getClientIp(httpRequest);
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

    /**
     * 确认密码重置
     */
    @Operation(summary = "确认密码重置", description = "使用令牌重置密码")
    @PostMapping("/password-reset/confirm")
    public Result<Void> confirmPasswordReset(@Valid @RequestBody PasswordResetConfirmRequest request) {
        authService.confirmPasswordReset(request);
        return Result.<Void>success("密码重置成功", null);
    }

    /**
     * 获取客户端IP地址
     */
    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        // 多个代理时取第一个IP
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }
}
