package com.idropin.application.service.impl;

import com.idropin.application.service.AuthService;
import com.idropin.application.service.OperationLogService;
import com.idropin.common.exception.BusinessException;
import com.idropin.domain.dto.LoginRequest;
import com.idropin.domain.dto.LoginResponse;
import com.idropin.domain.dto.PasswordResetConfirmRequest;
import com.idropin.domain.dto.PasswordResetRequest;
import com.idropin.domain.dto.RegisterRequest;
import com.idropin.domain.entity.PasswordResetToken;
import com.idropin.domain.entity.User;
import com.idropin.domain.vo.UserVO;
import com.idropin.infrastructure.email.EmailService;
import com.idropin.infrastructure.persistence.mapper.PasswordResetTokenMapper;
import com.idropin.infrastructure.persistence.mapper.UserMapper;
import com.idropin.infrastructure.security.JwtTokenUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 认证服务实现
 *
 * @author Idrop.in Team
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserMapper userMapper;
    private final PasswordResetTokenMapper resetTokenMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenUtil jwtTokenUtil;
    private final EmailService emailService;
    private final OperationLogService operationLogService;

    @Value("${jwt.expiration}")
    private Long jwtExpiration;

    @Override
    @Transactional
    public User register(RegisterRequest request, String ipAddress) {
        // 检查用户名是否已存在
        if (userMapper.existsByUsername(request.getUsername())) {
            throw new BusinessException(400, "用户名已存在");
        }

        // 检查邮箱是否已存在
        if (userMapper.existsByEmail(request.getEmail())) {
            throw new BusinessException(400, "邮箱已被注册");
        }

        // 创建用户
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setStatus("ACTIVE");
        user.setRole("USER"); // 默认角色为普通用户
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        userMapper.insert(user);
        log.info("用户注册成功: {}", user.getUsername());

        // 记录操作日志
        operationLogService.log(
            user.getId(),
            "USER_REGISTER",
            "USER",
            user.getId(),
            "用户注册: " + user.getUsername(),
            ipAddress
        );

        return user;
    }

    @Override
    public LoginResponse login(LoginRequest request, String ipAddress) {
        // 查找用户
        User user = userMapper.findByUsername(request.getUsername());
        if (user == null) {
            throw new BusinessException(401, "用户名或密码错误");
        }

        // 验证密码
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BusinessException(401, "用户名或密码错误");
        }

        // 检查用户状态
        if (!"ACTIVE".equals(user.getStatus())) {
            throw new BusinessException(403, "账户已被禁用");
        }

        // 生成Token
        String token = jwtTokenUtil.generateToken(user.getUsername());

        // 构建响应
        UserVO userVO = UserVO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .status(user.getStatus())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();

        log.info("用户登录成功: {}", user.getUsername());

        // 记录操作日志
        operationLogService.log(
            user.getId(),
            "USER_LOGIN",
            "USER",
            user.getId(),
            "用户登录: " + user.getUsername(),
            ipAddress
        );

        return LoginResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .expiresIn(jwtExpiration / 1000)
                .user(userVO)
                .build();
    }

    @Override
    public boolean validateToken(String token) {
        try {
            String username = jwtTokenUtil.getUsernameFromToken(token);
            return username != null && jwtTokenUtil.validateToken(token, username);
        } catch (Exception e) {
            log.error("Token验证失败", e);
            return false;
        }
    }

    @Override
    @Transactional
    public void requestPasswordReset(PasswordResetRequest request) {
        // 查找用户
        User user = userMapper.findByEmail(request.getEmail());
        if (user == null) {
            // 为了安全，即使用户不存在也返回成功
            log.warn("密码重置请求的邮箱不存在: {}", request.getEmail());
            return;
        }

        // 生成重置令牌
        String token = UUID.randomUUID().toString();
        
        // 创建重置令牌记录
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .userId(user.getId())
                .token(token)
                .expiryDate(LocalDateTime.now().plusHours(24))
                .used(false)
                .createdAt(LocalDateTime.now())
                .build();
        
        resetTokenMapper.insert(resetToken);

        // 发送重置邮件
        try {
            emailService.sendPasswordResetEmail(user.getEmail(), token);
            log.info("密码重置邮件已发送: email={}", user.getEmail());
        } catch (Exception e) {
            log.error("密码重置邮件发送失败: email={}", user.getEmail(), e);
            throw new BusinessException(500, "邮件发送失败，请稍后重试");
        }
    }

    @Override
    @Transactional
    public void confirmPasswordReset(PasswordResetConfirmRequest request) {
        // 查找令牌
        PasswordResetToken resetToken = resetTokenMapper.findByToken(request.getToken());
        if (resetToken == null) {
            throw new BusinessException(400, "无效的重置令牌");
        }

        // 检查是否已使用
        if (resetToken.getUsed()) {
            throw new BusinessException(400, "重置令牌已使用");
        }

        // 检查是否过期
        if (resetToken.isExpired()) {
            throw new BusinessException(400, "重置令牌已过期");
        }

        // 查找用户
        User user = userMapper.selectById(resetToken.getUserId());
        if (user == null) {
            throw new BusinessException(404, "用户不存在");
        }

        // 更新密码
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.updateById(user);

        // 标记令牌为已使用
        resetToken.setUsed(true);
        resetTokenMapper.updateById(resetToken);

        log.info("用户 {} 密码重置成功", user.getUsername());
    }
}
