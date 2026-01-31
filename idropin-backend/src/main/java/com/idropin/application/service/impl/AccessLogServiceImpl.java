package com.idropin.application.service.impl;

import com.idropin.application.service.AccessLogService;
import com.idropin.domain.entity.AccessLog;
import com.idropin.infrastructure.persistence.mapper.AccessLogMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 访问日志服务实现
 *
 * @author Idrop.in Team
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AccessLogServiceImpl implements AccessLogService {

    private final AccessLogMapper accessLogMapper;

    @Override
    @Transactional
    public void logAccess(HttpServletRequest request, String userId) {
        try {
            AccessLog accessLog = new AccessLog();
            accessLog.setUserId(userId);
            accessLog.setIpAddress(getClientIp(request));
            accessLog.setUserAgent(request.getHeader("User-Agent"));
            accessLog.setRequestPath(request.getRequestURI());
            accessLog.setRequestMethod(request.getMethod());
            accessLog.setReferer(request.getHeader("Referer"));
            
            // 使用session ID作为会话标识
            HttpSession session = request.getSession(true);
            accessLog.setSessionId(session.getId());
            
            accessLog.setCreatedAt(LocalDateTime.now());
            
            // 检查是否在5分钟内有相同session的访问记录，避免重复记录
            LocalDateTime fiveMinutesAgo = LocalDateTime.now().minusMinutes(5);
            if (!accessLogMapper.hasRecentAccess(session.getId(), fiveMinutesAgo)) {
                accessLogMapper.insert(accessLog);
            }
        } catch (Exception e) {
            // 访问日志记录失败不应影响正常业务
            log.error("Failed to log access", e);
        }
    }

    @Override
    public Long getTodayPV() {
        return accessLogMapper.countTodayPV();
    }

    @Override
    public Long getTodayUV() {
        return accessLogMapper.countTodayUV();
    }

    @Override
    public Long getTotalPV() {
        return accessLogMapper.countTotalPV();
    }

    @Override
    public Long getTotalUV() {
        return accessLogMapper.countTotalUV();
    }

    /**
     * 获取客户端真实IP地址
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
            ip = request.getHeader("HTTP_CLIENT_IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("HTTP_X_FORWARDED_FOR");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        // 处理多个IP的情况，取第一个
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }
}
