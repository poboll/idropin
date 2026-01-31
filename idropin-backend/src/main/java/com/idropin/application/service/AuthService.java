package com.idropin.application.service;

import com.idropin.domain.dto.LoginRequest;
import com.idropin.domain.dto.LoginResponse;
import com.idropin.domain.dto.PasswordResetConfirmRequest;
import com.idropin.domain.dto.PasswordResetRequest;
import com.idropin.domain.dto.RegisterRequest;
import com.idropin.domain.entity.User;

/**
 * 认证服务接口
 *
 * @author Idrop.in Team
 */
public interface AuthService {

    /**
     * 用户注册
     *
     * @param request 注册请求
     * @param ipAddress 客户端IP地址
     * @return 注册成功的用户
     */
    User register(RegisterRequest request, String ipAddress);

    /**
     * 用户登录
     *
     * @param request 登录请求
     * @param ipAddress 客户端IP地址
     * @return 登录响应（包含Token和用户信息）
     */
    LoginResponse login(LoginRequest request, String ipAddress);

    /**
     * 验证Token
     *
     * @param token JWT Token
     * @return 是否有效
     */
    boolean validateToken(String token);

    /**
     * 请求密码重置
     *
     * @param request 密码重置请求
     */
    void requestPasswordReset(PasswordResetRequest request);

    /**
     * 确认密码重置
     *
     * @param request 密码重置确认请求
     */
    void confirmPasswordReset(PasswordResetConfirmRequest request);
}
