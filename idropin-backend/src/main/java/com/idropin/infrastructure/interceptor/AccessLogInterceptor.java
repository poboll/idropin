package com.idropin.infrastructure.interceptor;

import com.idropin.application.service.AccessLogService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * 访问日志拦截器
 *
 * @author Idrop.in Team
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AccessLogInterceptor implements HandlerInterceptor {

    private final AccessLogService accessLogService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // 只记录GET请求的页面访问
        if ("GET".equalsIgnoreCase(request.getMethod())) {
            String path = request.getRequestURI();
            
            // 排除静态资源和API请求
            if (!path.startsWith("/api/") && 
                !path.contains(".") && 
                !path.startsWith("/static/") &&
                !path.startsWith("/_next/")) {
                
                // 异步记录访问日志（不获取用户ID，简化实现）
                accessLogService.logAccess(request, null);
            }
        }
        
        return true;
    }
}
