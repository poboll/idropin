package com.idropin.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.idropin.domain.entity.SystemConfig;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface SystemConfigMapper extends BaseMapper<SystemConfig> {

    @Select("SELECT * FROM system_config WHERE is_enabled = true ORDER BY config_key")
    List<SystemConfig> findAllEnabled();

    @Select("SELECT * FROM system_config ORDER BY config_type, config_key")
    List<SystemConfig> findAll();

    @Select("SELECT * FROM system_config WHERE config_key = #{key}")
    SystemConfig findByKey(@Param("key") String key);

    @Select("SELECT * FROM system_config WHERE config_type = #{type} ORDER BY config_key")
    List<SystemConfig> findByType(@Param("type") String type);

    @Update("UPDATE system_config SET config_value = #{value}, updated_at = CURRENT_TIMESTAMP WHERE config_key = #{key}")
    int updateValue(@Param("key") String key, @Param("value") String value);

    @Update("UPDATE system_config SET is_enabled = #{enabled}, updated_at = CURRENT_TIMESTAMP WHERE id = #{id}")
    int updateEnabled(@Param("id") String id, @Param("enabled") Boolean enabled);
}
