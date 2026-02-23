package com.idropin.interfaces.rest;

import com.idropin.application.service.ConfigService;
import com.idropin.common.util.IpUtil;
import com.idropin.common.vo.Result;
import com.idropin.domain.dto.UpdateRouteConfigRequest;
import com.idropin.domain.entity.SystemConfig;
import com.idropin.domain.vo.RouteConfigVO;
import com.idropin.domain.vo.StorageInfoVO;
import com.idropin.infrastructure.email.EmailService;
import com.idropin.infrastructure.security.CurrentUser;
import com.idropin.infrastructure.storage.StorageServiceManager;
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
    private final EmailService emailService;
    private final StorageServiceManager storageServiceManager;

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
        String ipAddress = IpUtil.getClientIp(httpRequest);
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
        String ipAddress = IpUtil.getClientIp(httpRequest);
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
        String ipAddress = IpUtil.getClientIp(httpRequest);
        configService.toggleSystemConfig(adminId, id, request.get("enabled"), ipAddress);
        return Result.success();
    }

    @Operation(summary = "获取存储配置信息（管理员）")
    @GetMapping("/admin/storage-info")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public Result<StorageInfoVO> getStorageInfo() {
        StorageInfoVO info = new StorageInfoVO();
        info.setStorageType(cfgVal("storage.type", "local"));
        info.setLocalPath(cfgVal("storage.local.path", "./uploads"));
        info.setLocalBaseUrl(cfgVal("storage.local.base-url", ""));
        info.setMinioEndpoint(cfgVal("storage.minio.endpoint", ""));
        info.setMinioAccessKey(cfgVal("storage.minio.accessKey", ""));
        info.setMinioBucket(cfgVal("storage.minio.bucket", ""));
        info.setQiniuAccessKey(cfgVal("storage.qiniu.accessKey", ""));
        info.setQiniuBucket(cfgVal("storage.qiniu.bucket", ""));
        info.setQiniuDomain(cfgVal("storage.qiniu.domain", ""));
        info.setQiniuRegion(cfgVal("storage.qiniu.region", "as0"));
        info.setS3Endpoint(cfgVal("storage.s3.endpoint", ""));
        info.setS3Bucket(cfgVal("storage.s3.bucket", ""));
        info.setS3Region(cfgVal("storage.s3.region", "us-east-1"));
        info.setS3AccessKey(cfgVal("storage.s3.accessKey", ""));
        String s3sk = cfgVal("storage.s3.secretKey", "");
        info.setS3SecretKeyConfigured(!s3sk.isBlank());
        info.setNasPath(cfgVal("storage.nas.path", "/vol1/shares/idropin"));
        info.setNasBaseUrl(cfgVal("storage.nas.base-url", ""));
        return Result.success(info);
    }

    @Operation(summary = "保存存储配置并热重载（管理员）")
    @PostMapping("/admin/storage")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public Result<Void> saveStorageConfig(
            @RequestBody Map<String, String> configMap,
            HttpServletRequest httpRequest) {
        String adminId = currentUser.getUserId();
        String ipAddress = IpUtil.getClientIp(httpRequest);
        configService.batchUpdateConfigs(adminId, configMap, ipAddress);
        storageServiceManager.refresh();
        return Result.success();
    }

    private String cfgVal(String key, String fallback) {
        String v = configService.getSystemConfigValue(key);
        return (v != null && !v.isBlank()) ? v : fallback;
    }

    @Operation(summary = "备份所有系统配置（管理员）")
    @GetMapping("/admin/backup")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public Result<List<SystemConfig>> backupConfigs() {
        return Result.success(configService.getAllSystemConfigs());
    }

    @Operation(summary = "恢复系统配置（管理员）")
    @PostMapping("/admin/restore")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public Result<Void> restoreConfigs(@RequestBody Map<String, String> configMap, HttpServletRequest httpRequest) {
        String adminId = currentUser.getUserId();
        String ipAddress = IpUtil.getClientIp(httpRequest);
        configService.batchUpdateConfigs(adminId, configMap, ipAddress);
        storageServiceManager.refresh();
        return Result.success();
    }

    @Operation(summary = "刷新邮件配置缓存（管理员）")
    @PostMapping("/admin/email/refresh-cache")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public Result<Void> refreshEmailCache() {
        emailService.refreshCache();
        return Result.success();
    }

    @Operation(summary = "获取AI配置（管理员）")
    @GetMapping("/admin/ai")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public Result<List<SystemConfig>> getAiConfigs() {
        List<SystemConfig> configs = configService.getConfigsByCategory("ai");
        return Result.success(configs);
    }

    @Operation(summary = "批量更新AI配置（管理员）")
    @PutMapping("/admin/ai")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public Result<Void> updateAiConfigs(
            @RequestBody Map<String, String> configMap,
            HttpServletRequest httpRequest) {
        String adminId = currentUser.getUserId();
        String ipAddress = IpUtil.getClientIp(httpRequest);
        configService.batchUpdateConfigs(adminId, configMap, ipAddress);
        return Result.success();
    }

     @Operation(summary = "测试存储连接（管理员）")
     @PostMapping("/admin/storage/test")
     @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
     public Result<String> testStorageConnection() {
         try {
             storageServiceManager.refresh();
             String type = storageServiceManager.getActiveStorageType();
             storageServiceManager.downloadFile("__connection_test_nonexistent__");
             return Result.success("连接成功（" + type + "）");
         } catch (Exception e) {
             String msg = e.getMessage();
             // msg 为 null 或包含"null"通常表示文件不存在（连接本身正常），视为连接成功
             if (msg == null || msg.equals("null") || msg.equalsIgnoreCase("null")) {
                 return Result.success("连接成功（" + storageServiceManager.getActiveStorageType() + "）");
             }
             boolean notFoundError = msg.contains("NoSuchKey") || msg.contains("does not exist")
                     || msg.contains("Object does not exist") || msg.contains("404")
                     || msg.contains("not found") || msg.contains("NoSuchObject")
                     || msg.contains("NoSuchBucket") || msg.contains("InvalidAccessKeyId")
                     || msg.contains("文件下载失败") && msg.contains("null");
             if (notFoundError) {
                 return Result.success("连接成功（" + storageServiceManager.getActiveStorageType() + "）");
             }
             // 截断过长错误信息
             String displayMsg = msg.length() > 300 ? msg.substring(0, 300) + "..." : msg;
             return Result.error("连接失败：" + displayMsg);
         }
     }

    @Operation(summary = "测试AI连接（管理员）")
    @PostMapping("/admin/ai/test")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public Result<String> testAiConnection(@RequestBody Map<String, String> configMap) {
        String baseUrl = configMap.getOrDefault("ai.base_url", "");
        String apiKey = configMap.getOrDefault("ai.api_key", "");
        String model = configMap.getOrDefault("ai.chat_model", "");
        if (baseUrl.trim().isEmpty() || apiKey.trim().isEmpty() || model.trim().isEmpty()) {
            return Result.error("请填写 Base URL、API Key 和对话模型");
        }
        try {
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);
            Map<String, Object> body = new java.util.LinkedHashMap<>();
            body.put("model", model);
            Map<String, String> msg = new java.util.LinkedHashMap<>();
            msg.put("role", "user");
            msg.put("content", "hi");
            body.put("messages", java.util.Collections.singletonList(msg));
            body.put("max_tokens", 5);
            org.springframework.http.ResponseEntity<String> resp = new org.springframework.web.client.RestTemplate()
                    .exchange(baseUrl + "/chat/completions", org.springframework.http.HttpMethod.POST,
                            new org.springframework.http.HttpEntity<>(body, headers), String.class);
            if (resp.getStatusCode().is2xxSuccessful()) {
                return Result.success("连接成功");
            }
            return Result.error("连接失败：HTTP " + resp.getStatusCode());
        } catch (Exception e) {
            String errMsg = e.getMessage();
            if (errMsg != null && errMsg.length() > 200) {
                errMsg = errMsg.substring(0, 200) + "...";
            }
            return Result.error("连接失败：" + errMsg);
        }
    }
}
