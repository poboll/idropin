package com.idropin.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.idropin.domain.entity.CollectionTask;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 收集任务Mapper
 *
 * @author Idrop.in Team
 */
@Mapper
public interface CollectionTaskMapper extends BaseMapper<CollectionTask> {
    
    /**
     * 根据ID查询任务（使用XML定义，明确指定VARCHAR类型避免UUID类型问题）
     */
    CollectionTask selectByIdString(@Param("id") String id);
}
