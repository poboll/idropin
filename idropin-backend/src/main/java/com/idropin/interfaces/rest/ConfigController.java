package com.idropin.interfaces.rest;

import com.idropin.application.service.ConfigService;
import com.idropin.common.vo.Result;
import com.idropin.domain.dto.UpdateRouteConfigRequest;
import com.idropin.domain.entity.SystemConfig;
import com.idropin.domain.vo.RouteConfigVO;
import com.idropin.infrastructure.security.CurrentUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "配置管理", description = "系统配置相关接口")
@RestController
@RequestMapping("/config")
@RequiredArgsConstructor
public class ConfigController {

    private final ConfigService configService;
    private final CurrentUser currentUser;

    @Operation(summary = "获取路由配置（公开接口）")
    @GetMapping("/routes")
    public Result<List<RouteConfigVO>> getRouteConfigs() {
        List<RouteConfigVO> configs = configService.getEnabledRouteConfigs();
        return Result.success(configs);
    }

    @Operation(summary = "检查路由是否启用")
    @GetMapping("/routes/check")
    public Result<RouteConfigVO> checkRoute(@RequestParam String path) {
        RouteConfigVO config = configService.getRouteConfig(path);
        return Result.success(config);
    }

    @Operation(summary = "获取所有路由配置（管理员）")
    @GetMapping("/admin/routes")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public Result<List<RouteConfigVO>> getAllRouteConfigs() {
        List<RouteConfigVO> configs = configService.getAllRouteConfigs();
        return Result.success(configs);
    }

    @Operation(summary = "更新路由配置（管理员）")
    @PutMapping("/admin/routes/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public Result<Void> updateRouteConfig(
            @PathVariable String id,
            @Valid @RequestBody UpdateRouteConfigRequest request,
            HttpServletRequest httpRequest) {
        String adminId = currentUser.getUserId();
        String ipAddress = getClientIp(httpRequest);
        configService.updateRouteConfig(adminId, id, request, ipAddress);
        return Result.success();
    }

    @Operation(summary = "获取所有系统配置（管理员）")
    @GetMapping("/admin/system")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public Result<List<SystemConfig>> getAllSystemConfigs() {
        List<SystemConfig> configs = configService.getAllSystemConfigs();
        return Result.success(configs);
    }

    @Operation(summary = "获取系统配置值（公开接口）")
    @GetMapping("/system/{key}")
    public Result<String> getSystemConfigValue(@PathVariable String key) {
        String value = configService.getSystemConfigValue(key);
        return Result.success(value);
    }

    @Operation(summary = "更新系统配置值（管理员）")
    @PutMapping("/admin/system/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public Result<Void> updateSystemConfig(
            @PathVariable String id,
            @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {
        String adminId = currentUser.getUserId();
        String ipAddress = getClientIp(httpRequest);
        configService.updateSystemConfig(adminId, id, request.get("value"), ipAddress);
        return Result.success();
    }

    @Operation(summary = "切换系统配置启用状态（管理员）")
    @PutMapping("/admin/system/{id}/toggle")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public Result<Void> toggleSystemConfig(
            @PathVariable String id,
            @RequestBody Map<String, Boolean> request,
            HttpServletRequest httpRequest) {
        String adminId = currentUser.getUserId();
        String ipAddress = getClientIp(httpRequest);
        configService.toggleSystemConfig(adminId, id, request.get("enabled"), ipAddress);
        return Result.success();
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }
}
