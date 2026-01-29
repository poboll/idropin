package com.idropin.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.idropin.domain.entity.TaskMoreInfo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 任务更多信息Mapper
 *
 * @author Idrop.in Team
 */
@Mapper
public interface TaskMoreInfoMapper extends BaseMapper<TaskMoreInfo> {
    
    /**
     * 根据任务ID查询更多信息（使用XML定义）
     */
    TaskMoreInfo selectByTaskId(@Param("taskId") String taskId);
    
    /**
     * 根据任务ID更新更多信息（使用XML定义）
     */
    int updateByTaskId(@Param("entity") TaskMoreInfo entity);
}
