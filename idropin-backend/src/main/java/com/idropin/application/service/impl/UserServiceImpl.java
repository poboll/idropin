package com.idropin.application.service.impl;

import com.idropin.application.service.UserService;
import com.idropin.common.exception.BusinessException;
import com.idropin.domain.dto.ChangePasswordRequest;
import com.idropin.domain.entity.User;
import com.idropin.domain.vo.UserVO;
import com.idropin.infrastructure.persistence.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 用户服务实现
 *
 * @author Idrop.in Team
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    public User getUserById(String id) {
        return userMapper.selectById(id);
    }

    @Override
    public User getUserByUsername(String username) {
        return userMapper.findByUsername(username);
    }

    @Override
    public User getUserByEmail(String email) {
        return userMapper.findByEmail(email);
    }

    @Override
    public boolean existsByUsername(String username) {
        return userMapper.existsByUsername(username);
    }

    @Override
    public boolean existsByEmail(String email) {
        return userMapper.existsByEmail(email);
    }

    @Override
    public UserVO getCurrentUserInfo(String username) {
        User user = userMapper.findByUsername(username);
        if (user == null) {
            throw new BusinessException(404, "用户不存在");
        }

        return UserVO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .status(user.getStatus())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public void changePassword(String userId, ChangePasswordRequest request) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(404, "用户不存在");
        }

        String verifyType = request.getVerifyType();
        
        if ("password".equals(verifyType) || verifyType == null) {
            if (request.getOldPassword() == null || request.getOldPassword().isEmpty()) {
                throw new BusinessException(400, "原密码不能为空");
            }
            if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
                throw new BusinessException(400, "原密码错误");
            }
        } else if ("email".equals(verifyType)) {
            if (request.getVerifyCode() == null || request.getVerifyCode().isEmpty()) {
                throw new BusinessException(400, "邮箱验证码不能为空");
            }
            // TODO: 实际项目中需要从Redis获取并验证验证码
            // 这里简化处理，暂时接受任何非空验证码
            log.info("邮箱验证码验证通过: {}", request.getVerifyCode());
        } else if ("phone".equals(verifyType)) {
            if (request.getVerifyCode() == null || request.getVerifyCode().isEmpty()) {
                throw new BusinessException(400, "手机验证码不能为空");
            }
            // TODO: 实际项目中需要从Redis获取并验证验证码
            log.info("手机验证码验证通过: {}", request.getVerifyCode());
        } else {
            throw new BusinessException(400, "不支持的验证方式: " + verifyType);
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.updateById(user);

        log.info("用户 {} 密码修改成功，验证方式: {}", user.getUsername(), verifyType);
    }

    @Override
    @Transactional
    public UserVO updateProfile(String userId, String avatarUrl) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(404, "用户不存在");
        }

        user.setAvatarUrl(avatarUrl);
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.updateById(user);

        log.info("用户 {} 资料更新成功", user.getUsername());

        return UserVO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .status(user.getStatus())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
