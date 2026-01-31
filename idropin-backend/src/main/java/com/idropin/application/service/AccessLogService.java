package com.idropin.application.service;

import jakarta.servlet.http.HttpServletRequest;

/**
 * 访问日志服务接口
 *
 * @author Idrop.in Team
 */
public interface AccessLogService {

    /**
     * 记录访问日志
     *
     * @param request HTTP请求
     * @param userId 用户ID（未登录为null）
     */
    void logAccess(HttpServletRequest request, String userId);

    /**
     * 统计今日PV
     */
    Long getTodayPV();

    /**
     * 统计今日UV
     */
    Long getTodayUV();

    /**
     * 统计历史总PV
     */
    Long getTotalPV();

    /**
     * 统计历史总UV
     */
    Long getTotalUV();
}
