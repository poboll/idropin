package com.idropin.application.service;

import com.idropin.domain.dto.UpdateRouteConfigRequest;
import com.idropin.domain.vo.RouteConfigVO;

import java.util.List;

/**
 * 配置服务接口
 *
 * @author Idrop.in Team
 */
public interface ConfigService {
    
    /**
     * 获取所有路由配置
     *
     * @return 路由配置列表
     */
    List<RouteConfigVO> getAllRouteConfigs();
    
    /**
     * 获取启用的路由配置（公开接口）
     *
     * @return 路由配置列表
     */
    List<RouteConfigVO> getEnabledRouteConfigs();
    
    /**
     * 检查路由是否启用
     *
     * @param routePath 路由路径
     * @return 是否启用
     */
    boolean isRouteEnabled(String routePath);
    
    /**
     * 获取路由配置
     *
     * @param routePath 路由路径
     * @return 路由配置
     */
    RouteConfigVO getRouteConfig(String routePath);
    
    /**
     * 更新路由配置
     *
     * @param adminId 管理员ID
     * @param configId 配置ID
     * @param request 更新请求
     * @param ipAddress IP地址
     */
    void updateRouteConfig(String adminId, String configId, UpdateRouteConfigRequest request, String ipAddress);
}
