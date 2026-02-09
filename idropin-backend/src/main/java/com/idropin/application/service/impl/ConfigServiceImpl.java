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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ConfigServiceImpl implements ConfigService {

    private final RouteConfigMapper routeConfigMapper;
    private final SystemConfigMapper systemConfigMapper;
    private final OperationLogService operationLogService;

    @Override
    public List<RouteConfigVO> getAllRouteConfigs() {
        List<RouteConfig> configs = routeConfigMapper.selectList(null);
        return configs.stream().map(this::toVO).collect(Collectors.toList());
    }

    @Override
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
    public void updateRouteConfig(String adminId, String configId, UpdateRouteConfigRequest request, String ipAddress) {
        RouteConfig config = routeConfigMapper.selectById(configId);
        if (config == null) {
            throw new BusinessException("路由配置不存在");
        }
        
        LambdaUpdateWrapper<RouteConfig> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.eq(RouteConfig::getId, configId)
                .set(RouteConfig::getIsEnabled, request.getIsEnabled())
                .set(RouteConfig::getUpdatedAt, LocalDateTime.now());
        
        if (request.getRedirectUrl() != null) {
            updateWrapper.set(RouteConfig::getRedirectUrl, request.getRedirectUrl());
        }
        if (request.getRedirectMessage() != null) {
            updateWrapper.set(RouteConfig::getRedirectMessage, request.getRedirectMessage());
        }
        
        routeConfigMapper.update(null, updateWrapper);
        
        String action = request.getIsEnabled() ? "启用" : "禁用";
        operationLogService.log(adminId, "UPDATE_ROUTE_CONFIG", "ROUTE_CONFIG", configId,
                action + "路由: " + config.getRoutePath(), ipAddress);
        
        log.info("管理员 {} {} 路由 {}", adminId, action, config.getRoutePath());
    }

    @Override
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
    public String getSystemConfigValue(String key) {
        SystemConfig config = systemConfigMapper.findByKey(key);
        return config != null && config.getIsEnabled() ? config.getConfigValue() : null;
    }

    @Override
    @Transactional
    public void updateSystemConfig(String adminId, String configId, String value, String ipAddress) {
        SystemConfig config = systemConfigMapper.selectById(configId);
        if (config == null) {
            throw new BusinessException("系统配置不存在");
        }
        
        String oldValue = config.getConfigValue();
        config.setConfigValue(value);
        config.setUpdatedAt(LocalDateTime.now());
        systemConfigMapper.updateById(config);
        
        operationLogService.log(adminId, "UPDATE_SYSTEM_CONFIG", "SYSTEM_CONFIG", configId,
                "更新配置 " + config.getConfigKey() + ": " + oldValue + " -> " + value, ipAddress);
        
        log.info("管理员 {} 更新系统配置 {}: {} -> {}", adminId, config.getConfigKey(), oldValue, value);
    }

    @Override
    @Transactional
    public void toggleSystemConfig(String adminId, String configId, Boolean enabled, String ipAddress) {
        SystemConfig config = systemConfigMapper.selectById(configId);
        if (config == null) {
            throw new BusinessException("系统配置不存在");
        }
        
        systemConfigMapper.updateEnabled(configId, enabled);
        
        String action = enabled ? "启用" : "禁用";
        operationLogService.log(adminId, "TOGGLE_SYSTEM_CONFIG", "SYSTEM_CONFIG", configId,
                action + "配置: " + config.getConfigKey(), ipAddress);
        
        log.info("管理员 {} {} 系统配置 {}", adminId, action, config.getConfigKey());
    }
    
    private RouteConfigVO toVO(RouteConfig config) {
        RouteConfigVO vo = new RouteConfigVO();
        BeanUtils.copyProperties(config, vo);
        return vo;
    }
}
