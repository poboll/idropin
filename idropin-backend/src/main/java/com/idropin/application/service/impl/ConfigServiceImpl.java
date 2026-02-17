package com.idropin.application.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.idropin.application.service.ConfigService;
import com.idropin.application.service.OperationLogService;
import com.idropin.common.exception.BusinessException;
import com.idropin.domain.dto.UpdateRouteConfigRequest;
import com.idropin.domain.entity.RouteConfig;
import com.idropin.domain.entity.SystemConfig;
import com.idropin.domain.vo.RouteConfigVO;
import com.idropin.infrastructure.persistence.mapper.RouteConfigMapper;
import com.idropin.infrastructure.persistence.mapper.SystemConfigMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ConfigServiceImpl implements ConfigService {

    private final RouteConfigMapper routeConfigMapper;
    private final SystemConfigMapper systemConfigMapper;
    private final OperationLogService operationLogService;

    @Override
    @Cacheable(value = "config", key = "'routes:all'")
    public List<RouteConfigVO> getAllRouteConfigs() {
        List<RouteConfig> configs = routeConfigMapper.selectList(null);
        return configs.stream().map(this::toVO).collect(Collectors.toList());
    }

    @Override
    @Cacheable(value = "config", key = "'routes:enabled'")
    public List<RouteConfigVO> getEnabledRouteConfigs() {
        LambdaQueryWrapper<RouteConfig> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(RouteConfig::getIsEnabled, true);
        List<RouteConfig> configs = routeConfigMapper.selectList(queryWrapper);
        return configs.stream().map(this::toVO).collect(Collectors.toList());
    }

    @Override
    public boolean isRouteEnabled(String routePath) {
        RouteConfig config = routeConfigMapper.findByRoutePath(routePath);
        return config == null || config.getIsEnabled();
    }

    @Override
    public RouteConfigVO getRouteConfig(String routePath) {
        RouteConfig config = routeConfigMapper.findByRoutePath(routePath);
        return config != null ? toVO(config) : null;
    }

    @Override
    @Transactional
    @CacheEvict(value = "config", allEntries = true)
    public void updateRouteConfig(String adminId, String configId, UpdateRouteConfigRequest request, String ipAddress) {
        RouteConfig config = routeConfigMapper.findById(configId);
        if (config == null) {
            throw new BusinessException("路由配置不存在");
        }
        
        String redirectUrl = request.getRedirectUrl() != null ? request.getRedirectUrl() : config.getRedirectUrl();
        String redirectMessage = request.getRedirectMessage() != null ? request.getRedirectMessage() : config.getRedirectMessage();
        
        routeConfigMapper.updateRouteConfig(configId, request.getIsEnabled(), redirectUrl, redirectMessage);
        
        String action = request.getIsEnabled() ? "启用" : "禁用";
        operationLogService.log(adminId, "UPDATE_ROUTE_CONFIG", "ROUTE_CONFIG", configId,
                action + "路由: " + config.getRoutePath(), ipAddress);
        
        log.info("管理员 {} {} 路由 {}", adminId, action, config.getRoutePath());
    }

    @Override
    @Cacheable(value = "config", key = "'system:all'")
    public List<SystemConfig> getAllSystemConfigs() {
        return systemConfigMapper.findAll();
    }

    @Override
    public List<SystemConfig> getEnabledSystemConfigs() {
        return systemConfigMapper.findAllEnabled();
    }

    @Override
    public SystemConfig getSystemConfig(String key) {
        return systemConfigMapper.findByKey(key);
    }

    @Override
    @Cacheable(value = "config", key = "'system:val:' + #key")
    public String getSystemConfigValue(String key) {
        SystemConfig config = systemConfigMapper.findByKey(key);
        return config != null && config.getIsEnabled() ? config.getConfigValue() : null;
    }

    @Override
    @Transactional
    @CacheEvict(value = "config", allEntries = true)
    public void updateSystemConfig(String adminId, String configId, String value, String ipAddress) {
        SystemConfig config = systemConfigMapper.findById(configId);
        if (config == null) {
            throw new BusinessException("系统配置不存在");
        }
        
        String oldValue = config.getConfigValue();
        // 使用自定义方法更新配置值，避免UUID类型转换问题
        systemConfigMapper.updateConfigValue(configId, value);
        
        operationLogService.log(adminId, "UPDATE_SYSTEM_CONFIG", "SYSTEM_CONFIG", configId,
                "更新配置 " + config.getConfigKey() + ": " + oldValue + " -> " + value, ipAddress);
        
        log.info("管理员 {} 更新系统配置 {}: {} -> {}", adminId, config.getConfigKey(), oldValue, value);
    }

    @Override
    @Transactional
    @CacheEvict(value = "config", allEntries = true)
    public void toggleSystemConfig(String adminId, String configId, Boolean enabled, String ipAddress) {
        SystemConfig config = systemConfigMapper.findById(configId);
        if (config == null) {
            throw new BusinessException("系统配置不存在");
        }
        
        if ("boolean".equalsIgnoreCase(config.getConfigType())) {
            String newValue = enabled ? "true" : "false";
            String oldValue = config.getConfigValue();
            systemConfigMapper.updateConfigValue(configId, newValue);
            
            operationLogService.log(adminId, "TOGGLE_SYSTEM_CONFIG", "SYSTEM_CONFIG", configId,
                    "切换配置 " + config.getConfigKey() + ": " + oldValue + " -> " + newValue, ipAddress);
            
            log.info("管理员 {} 切换系统配置 {}: {} -> {}", adminId, config.getConfigKey(), oldValue, newValue);
        } else {
            // 对于非布尔类型配置，修改 is_enabled（启用/禁用该配置项）
            systemConfigMapper.updateEnabled(configId, enabled);
            
            String action = enabled ? "启用" : "禁用";
            operationLogService.log(adminId, "TOGGLE_SYSTEM_CONFIG", "SYSTEM_CONFIG", configId,
                    action + "配置: " + config.getConfigKey(), ipAddress);
            
            log.info("管理员 {} {} 系统配置 {}", adminId, action, config.getConfigKey());
        }
    }
    
    private RouteConfigVO toVO(RouteConfig config) {
        RouteConfigVO vo = new RouteConfigVO();
        BeanUtils.copyProperties(config, vo);
        return vo;
    }

    @Override
    public List<SystemConfig> getConfigsByCategory(String category) {
        LambdaQueryWrapper<SystemConfig> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SystemConfig::getCategory, category);
        return systemConfigMapper.selectList(wrapper);
    }

    @Override
    @Transactional
    @CacheEvict(value = "config", allEntries = true)
    public void batchUpdateConfigs(String adminId, Map<String, String> configMap, String ipAddress) {
        for (Map.Entry<String, String> entry : configMap.entrySet()) {
            LambdaUpdateWrapper<SystemConfig> update = new LambdaUpdateWrapper<>();
            update.eq(SystemConfig::getConfigKey, entry.getKey())
                    .set(SystemConfig::getConfigValue, entry.getValue())
                    .set(SystemConfig::getUpdatedAt, LocalDateTime.now());
            int affected = systemConfigMapper.update(null, update);
            if (affected > 0) {
                operationLogService.log(adminId, "UPDATE_CONFIG", "SYSTEM_CONFIG",
                        entry.getKey(), "Updated config: " + entry.getKey(), ipAddress);
            }
        }
    }
}
