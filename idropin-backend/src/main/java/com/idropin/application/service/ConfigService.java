package com.idropin.application.service;

import com.idropin.domain.dto.UpdateRouteConfigRequest;
import com.idropin.domain.entity.SystemConfig;
import com.idropin.domain.vo.RouteConfigVO;

import java.util.List;

public interface ConfigService {
    
    List<RouteConfigVO> getAllRouteConfigs();
    
    List<RouteConfigVO> getEnabledRouteConfigs();
    
    boolean isRouteEnabled(String routePath);
    
    RouteConfigVO getRouteConfig(String routePath);
    
    void updateRouteConfig(String adminId, String configId, UpdateRouteConfigRequest request, String ipAddress);

    List<SystemConfig> getAllSystemConfigs();

    List<SystemConfig> getEnabledSystemConfigs();

    SystemConfig getSystemConfig(String key);

    String getSystemConfigValue(String key);

    void updateSystemConfig(String adminId, String configId, String value, String ipAddress);

    void toggleSystemConfig(String adminId, String configId, Boolean enabled, String ipAddress);
}
