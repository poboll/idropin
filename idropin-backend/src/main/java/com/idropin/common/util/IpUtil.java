package com.idropin.common.util;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.util.StringUtils;

/**
 * IP地址工具类
 *
 * @author Idrop.in Team
 */
public class IpUtil {

    private static final String UNKNOWN = "unknown";
    private static final String LOCALHOST_IPV4 = "127.0.0.1";
    private static final String LOCALHOST_IPV6 = "0:0:0:0:0:0:0:1";

    /**
     * 获取客户端真实IP地址
     * 支持通过代理、负载均衡等方式获取真实IP
     *
     * @param request HTTP请求对象
     * @return 客户端IP地址
     */
    public static String getClientIp(HttpServletRequest request) {
        if (request == null) {
            return UNKNOWN;
        }

        String ip = request.getHeader("X-Forwarded-For");
        if (isValidIp(ip)) {
            // 多次反向代理后会有多个IP值，第一个为真实IP
            int index = ip.indexOf(',');
            if (index != -1) {
                return ip.substring(0, index);
            }
            return ip;
        }

        ip = request.getHeader("X-Real-IP");
        if (isValidIp(ip)) {
            return ip;
        }

        ip = request.getHeader("Proxy-Client-IP");
        if (isValidIp(ip)) {
            return ip;
        }

        ip = request.getHeader("WL-Proxy-Client-IP");
        if (isValidIp(ip)) {
            return ip;
        }

        ip = request.getHeader("HTTP_CLIENT_IP");
        if (isValidIp(ip)) {
            return ip;
        }

        ip = request.getHeader("HTTP_X_FORWARDED_FOR");
        if (isValidIp(ip)) {
            return ip;
        }

        ip = request.getRemoteAddr();
        
        // 本地访问转换为可读格式
        if (LOCALHOST_IPV6.equals(ip)) {
            return LOCALHOST_IPV4;
        }

        return ip;
    }

    /**
     * 验证IP地址是否有效
     *
     * @param ip IP地址
     * @return 是否有效
     */
    private static boolean isValidIp(String ip) {
        return StringUtils.hasText(ip) && !UNKNOWN.equalsIgnoreCase(ip);
    }
}
