package com.idropin.application.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.idropin.application.service.ConfigService;
import com.idropin.application.service.OperationLogService;
import com.idropin.common.exception.BusinessException;
import com.idropin.domain.dto.UpdateRouteConfigRequest;
import com.idropin.domain.entity.RouteConfig;
import com.idropin.domain.vo.RouteConfigVO;
import com.idropin.infrastructure.persistence.mapper.RouteConfigMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 配置服务实现
 *
 * @author Idrop.in Team
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ConfigServiceImpl implements ConfigService {

    private final RouteConfigMapper routeConfigMapper;
    private final OperationLogService operationLogService;

    @Override
    public List<RouteConfigVO> getAllRouteConfigs() {
        List<RouteConfig> configs = routeConfigMapper.selectList(null);
        return configs.stream().map(this::toVO).collect(Collectors.toList());
    }

    @Override
    public List<RouteConfigVO> getEnabledRouteConfigs() {
        LambdaQueryWrapper<RouteConfig> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(RouteConfig::getIsEnabled, false); // 返回禁用的路由，前端需要知道哪些被禁用
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
    
    private RouteConfigVO toVO(RouteConfig config) {
        RouteConfigVO vo = new RouteConfigVO();
        BeanUtils.copyProperties(config, vo);
        return vo;
    }
}
