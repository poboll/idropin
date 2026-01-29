package com.idropin.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.idropin.domain.entity.RouteConfig;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

/**
 * 路由配置Mapper
 *
 * @author Idrop.in Team
 */
@Mapper
public interface RouteConfigMapper extends BaseMapper<RouteConfig> {
    
    /**
     * 根据路由路径查询配置
     */
    @Select("SELECT * FROM sys_route_config WHERE route_path = #{routePath}")
    RouteConfig findByRoutePath(@Param("routePath") String routePath);
}
