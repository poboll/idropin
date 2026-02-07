package com.idropin.interfaces.rest;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.idropin.application.service.AdminService;
import com.idropin.application.service.OperationLogService;
import com.idropin.common.vo.Result;
import com.idropin.domain.dto.BindPhoneRequest;
import com.idropin.domain.dto.SendMessageRequest;
import com.idropin.domain.dto.UpdateQuotaRequest;
import com.idropin.domain.dto.UpdateStatusRequest;
import com.idropin.domain.vo.AdminUserVO;
import com.idropin.domain.vo.OperationLogVO;
import com.idropin.domain.vo.OverviewStatsVO;
import com.idropin.infrastructure.security.CurrentUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * 管理控制器
 *
 * @author Idrop.in Team
 */
@Tag(name = "管理功能", description = "管理员专属接口")
@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final OperationLogService operationLogService;
    private final CurrentUser currentUser;

    @Operation(summary = "获取平台概况统计")
    @GetMapping("/overview")
    public Result<OverviewStatsVO> getOverviewStats() {
        OverviewStatsVO stats = adminService.getOverviewStats();
        return Result.success(stats);
    }

    @Operation(summary = "获取用户列表")
    @GetMapping("/users")
    public Result<IPage<AdminUserVO>> getUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer size) {
        IPage<AdminUserVO> users = adminService.getUsers(keyword, status, page, size);
        return Result.success(users);
    }

    @Operation(summary = "修改用户状态")
    @PutMapping("/users/{id}/status")
    public Result<Void> updateUserStatus(
            @PathVariable String id,
            @Valid @RequestBody UpdateStatusRequest request,
            HttpServletRequest httpRequest) {
        String adminId = currentUser.getUserId();
        String ipAddress = getClientIp(httpRequest);
        adminService.updateUserStatus(adminId, id, request, ipAddress);
        return Result.success();
    }

    @Operation(summary = "重置用户密码")
    @PostMapping("/users/{id}/reset-password")
    public Result<String> resetUserPassword(
            @PathVariable String id,
            HttpServletRequest httpRequest) {
        String adminId = currentUser.getUserId();
        String ipAddress = getClientIp(httpRequest);
        String newPassword = adminService.resetUserPassword(adminId, id, ipAddress);
        return Result.success(newPassword);
    }

    @Operation(summary = "绑定用户手机号")
    @PutMapping("/users/{id}/phone")
    public Result<Void> bindUserPhone(
            @PathVariable String id,
            @Valid @RequestBody BindPhoneRequest request,
            HttpServletRequest httpRequest) {
        String adminId = currentUser.getUserId();
        String ipAddress = getClientIp(httpRequest);
        adminService.bindUserPhone(adminId, id, request, ipAddress);
        return Result.success();
    }

    @Operation(summary = "发送消息给用户")
    @PostMapping("/users/{id}/message")
    public Result<Void> sendMessageToUser(
            @PathVariable String id,
            @Valid @RequestBody SendMessageRequest request) {
        String adminId = currentUser.getUserId();
        adminService.sendMessageToUser(adminId, id, request);
        return Result.success();
    }

    @Operation(summary = "修改用户配额")
    @PutMapping("/users/{id}/quota")
    public Result<Void> updateUserQuota(
            @PathVariable String id,
            @Valid @RequestBody UpdateQuotaRequest request,
            HttpServletRequest httpRequest) {
        String adminId = currentUser.getUserId();
        String ipAddress = getClientIp(httpRequest);
        adminService.updateUserQuota(adminId, id, request, ipAddress);
        return Result.success();
    }

    @Operation(summary = "强制用户下线")
    @PostMapping("/users/{id}/force-logout")
    public Result<Void> forceUserLogout(
            @PathVariable String id,
            HttpServletRequest httpRequest) {
        String adminId = currentUser.getUserId();
        String ipAddress = getClientIp(httpRequest);
        adminService.forceUserLogout(adminId, id, ipAddress);
        return Result.success();
    }

    @Operation(summary = "推送全局消息")
    @PostMapping("/broadcast-message")
    public Result<Void> broadcastMessage(@Valid @RequestBody SendMessageRequest request) {
        String adminId = currentUser.getUserId();
        adminService.broadcastMessage(adminId, request);
        return Result.success();
    }

    @Operation(summary = "获取操作日志")
    @GetMapping("/operation-logs")
    public Result<IPage<OperationLogVO>> getOperationLogs(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer size) {
        IPage<OperationLogVO> logs = operationLogService.getLogs(page, size);
        return Result.success(logs);
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
        // 多个代理时取第一个IP
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }
    
    @Operation(summary = "更新用户角色")
    @PutMapping("/users/{id}/role")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public Result<Void> updateUserRole(
            @PathVariable String id,
            @Valid @RequestBody com.idropin.domain.dto.UpdateRoleRequest request,
            HttpServletRequest httpRequest) {
        String adminId = currentUser.getUserId();
        String ipAddress = getClientIp(httpRequest);
        adminService.updateUserRole(adminId, id, request, ipAddress);
        return Result.success();
    }
}
