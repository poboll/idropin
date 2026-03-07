package com.idropin.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.idropin.domain.entity.RouteConfig;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface RouteConfigMapper extends BaseMapper<RouteConfig> {
    
    @Select("SELECT * FROM sys_route_config WHERE route_path = #{routePath}")
    RouteConfig findByRoutePath(@Param("routePath") String routePath);
    
    @Select("SELECT * FROM sys_route_config WHERE id = #{id}")
    RouteConfig findById(@Param("id") String id);
    
    @Update("UPDATE sys_route_config SET is_enabled = #{isEnabled}, redirect_url = #{redirectUrl}, redirect_message = #{redirectMessage}, updated_at = NOW() WHERE id = #{id}")
    int updateRouteConfig(@Param("id") String id, @Param("isEnabled") Boolean isEnabled, @Param("redirectUrl") String redirectUrl, @Param("redirectMessage") String redirectMessage);
}
