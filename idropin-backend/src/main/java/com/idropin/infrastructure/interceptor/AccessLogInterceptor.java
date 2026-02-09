package com.idropin.infrastructure.interceptor;

import com.idropin.application.service.AccessLogService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Slf4j
@Component
@RequiredArgsConstructor
public class AccessLogInterceptor implements HandlerInterceptor {

    private final AccessLogService accessLogService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String method = request.getMethod();
        String path = request.getRequestURI();

        if (isTrackable(method, path)) {
            accessLogService.logAccess(request, null);
        }

        return true;
    }

    private boolean isTrackable(String method, String path) {
        if (path.contains(".") || path.startsWith("/api/actuator")) {
            return false;
        }

        if ("GET".equalsIgnoreCase(method)) {
            return path.startsWith("/api/tasks/") ||
                   path.startsWith("/api/shares/") ||
                   path.startsWith("/api/files/download/") ||
                   path.startsWith("/api/submit/");
        }

        if ("POST".equalsIgnoreCase(method)) {
            return path.startsWith("/api/submit/");
        }

        return false;
    }
}
