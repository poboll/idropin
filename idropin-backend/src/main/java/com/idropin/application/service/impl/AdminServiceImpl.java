package com.idropin.application.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.idropin.application.service.AccessLogService;
import com.idropin.application.service.AdminService;
import com.idropin.application.service.MessageService;
import com.idropin.application.service.OperationLogService;
import com.idropin.common.exception.BusinessException;
import com.idropin.domain.dto.BindPhoneRequest;
import com.idropin.domain.dto.SendMessageRequest;
import com.idropin.domain.dto.UpdateQuotaRequest;
import com.idropin.domain.dto.UpdateRoleRequest;
import com.idropin.domain.dto.UpdateStatusRequest;
import com.idropin.domain.entity.User;
import com.idropin.domain.vo.AdminUserVO;
import com.idropin.domain.vo.OverviewStatsVO;
import com.idropin.infrastructure.cache.TokenCacheService;
import com.idropin.infrastructure.persistence.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.security.SecureRandom;
import java.util.stream.Collectors;

/**
 * 管理服务实现
 *
 * @author Idrop.in Team
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final UserMapper userMapper;
    private final MessageService messageService;
    private final OperationLogService operationLogService;
    private final AccessLogService accessLogService;
    private final PasswordEncoder passwordEncoder;
    private final TokenCacheService tokenCacheService;

    private static final String CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    @Override
    public OverviewStatsVO getOverviewStats() {
        OverviewStatsVO stats = new OverviewStatsVO();
        
        // 用户统计
        stats.setUserCount(userMapper.countUsers());
        stats.setActiveUserCount(userMapper.countActiveUsers());
        stats.setUserCountYesterday(userMapper.countUsersYesterday());
        
        // 文件统计
        stats.setRecordCount(userMapper.countFiles());
        stats.setRecordCountYesterday(userMapper.countFilesYesterday());
        stats.setOssStorageBytes(userMapper.sumFileSize());
        
        // 日志统计
        stats.setLogCount(operationLogService.countLogs());
        stats.setLogCountYesterday(operationLogService.countLogsYesterday());
        
        // PV/UV统计
        stats.setPvCount(accessLogService.getTodayPV());
        stats.setUvCount(accessLogService.getTodayUV());
        stats.setHistoryPvCount(accessLogService.getTotalPV());
        stats.setHistoryUvCount(accessLogService.getTotalUV());
        
        // 归档和无效文件统计
        stats.setArchivedFileCount(userMapper.countArchivedFiles());
        stats.setArchivedFileSize(userMapper.sumArchivedFileSize());
        stats.setInvalidFileCount(userMapper.countInvalidFiles());
        stats.setInvalidFileSize(userMapper.sumInvalidFileSize());
        
        return stats;
    }

    @Override
    public IPage<AdminUserVO> getUsers(String keyword, String status, Integer page, Integer size) {
        Page<AdminUserVO> pageParam = new Page<>(page, size);
        return userMapper.selectAdminUserPage(pageParam, keyword, status);
    }

    @Override
    @Transactional
    public void updateUserStatus(String adminId, String userId, UpdateStatusRequest request, String ipAddress) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException("用户不存在");
        }
        
        LambdaUpdateWrapper<User> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.eq(User::getId, userId)
                .set(User::getStatus, request.getStatus());
        userMapper.update(null, updateWrapper);
        
        operationLogService.log(adminId, "UPDATE_USER_STATUS", "USER", userId, 
                "修改用户状态为: " + request.getStatus(), ipAddress);
        log.info("管理员 {} 修改用户 {} 状态为 {}", adminId, userId, request.getStatus());
    }

    @Override
    @Transactional
    public String resetUserPassword(String adminId, String userId, String ipAddress) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException("用户不存在");
        }
        
        // 生成随机密码
        String newPassword = generateRandomPassword(8);
        String encodedPassword = passwordEncoder.encode(newPassword);
        
        LambdaUpdateWrapper<User> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.eq(User::getId, userId)
                .set(User::getPasswordHash, encodedPassword);
        userMapper.update(null, updateWrapper);
        
        // 发送消息通知用户
        SendMessageRequest msgRequest = new SendMessageRequest();
        msgRequest.setTitle("密码已重置");
        msgRequest.setContent("您的密码已被管理员重置，新密码为: " + newPassword + "，请尽快登录并修改密码。");
        messageService.sendMessage(adminId, userId, msgRequest);
        
        operationLogService.log(adminId, "RESET_PASSWORD", "USER", userId, 
                "重置用户密码", ipAddress);
        log.info("管理员 {} 重置用户 {} 密码", adminId, userId);
        
        return newPassword;
    }

    @Override
    @Transactional
    public void bindUserPhone(String adminId, String userId, BindPhoneRequest request, String ipAddress) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException("用户不存在");
        }
        
        LambdaUpdateWrapper<User> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.eq(User::getId, userId)
                .set(User::getPhone, request.getPhone());
        userMapper.update(null, updateWrapper);
        
        operationLogService.log(adminId, "BIND_PHONE", "USER", userId, 
                "绑定手机号: " + request.getPhone(), ipAddress);
        log.info("管理员 {} 为用户 {} 绑定手机号 {}", adminId, userId, request.getPhone());
    }

    @Override
    public void sendMessageToUser(String adminId, String userId, SendMessageRequest request) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException("用户不存在");
        }
        messageService.sendMessage(adminId, userId, request);
    }

    @Override
    @Transactional
    public void updateUserQuota(String adminId, String userId, UpdateQuotaRequest request, String ipAddress) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException("用户不存在");
        }
        
        LambdaUpdateWrapper<User> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.eq(User::getId, userId);
        
        if (request.getStorageLimit() != null) {
            updateWrapper.set(User::getStorageLimit, request.getStorageLimit());
        }
        if (request.getTaskLimit() != null) {
            updateWrapper.set(User::getTaskLimit, request.getTaskLimit());
        }
        userMapper.update(null, updateWrapper);
        
        operationLogService.log(adminId, "UPDATE_QUOTA", "USER", userId, 
                "修改用户配额", ipAddress);
        log.info("管理员 {} 修改用户 {} 配额", adminId, userId);
    }

    @Override
    @Transactional
    public void forceUserLogout(String adminId, String userId, String ipAddress) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException("用户不存在");
        }
        
        // 使用户所有token失效
        tokenCacheService.invalidateUserTokens(userId);
        
        operationLogService.log(adminId, "FORCE_LOGOUT", "USER", userId, 
                "强制用户下线", ipAddress);
        log.info("管理员 {} 强制用户 {} 下线", adminId, userId);
    }

    @Override
    public void broadcastMessage(String adminId, SendMessageRequest request) {
        messageService.broadcastMessage(adminId, request);
    }

    @Override
    @Transactional
    public void updateUserRole(String adminId, String userId, UpdateRoleRequest request, String ipAddress) {
        // 验证角色值
        String role = request.getRole();
        if (!role.equals("USER") && !role.equals("ADMIN") && !role.equals("SUPER_ADMIN")) {
            throw new BusinessException("无效的角色类型");
        }
        
        // 获取用户
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException("用户不存在");
        }
        
        // 不能修改自己的角色
        if (userId.equals(adminId)) {
            throw new BusinessException("不能修改自己的角色");
        }
        
        // 记录旧角色
        String oldRole = user.getRole();
        
        // 只更新角色字段
        LambdaUpdateWrapper<User> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.eq(User::getId, userId)
                .set(User::getRole, role);
        userMapper.update(null, updateWrapper);
        
        // 记录操作日志
        operationLogService.log(adminId, "UPDATE_ROLE", "USER", userId, 
                String.format("修改用户角色: %s -> %s", oldRole, role), ipAddress);
        log.info("管理员 {} 修改用户 {} 的角色: {} -> {}", adminId, userId, oldRole, role);
    }

    private String generateRandomPassword(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(CHARS.charAt(RANDOM.nextInt(CHARS.length())));
        }
        return sb.toString();
    }
}
