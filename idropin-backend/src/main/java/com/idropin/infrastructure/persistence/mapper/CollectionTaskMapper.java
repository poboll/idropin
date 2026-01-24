package com.idropin.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.idropin.domain.entity.CollectionTask;
import org.apache.ibatis.annotations.Mapper;

/**
 * 收集任务Mapper
 *
 * @author Idrop.in Team
 */
@Mapper
public interface CollectionTaskMapper extends BaseMapper<CollectionTask> {
}
