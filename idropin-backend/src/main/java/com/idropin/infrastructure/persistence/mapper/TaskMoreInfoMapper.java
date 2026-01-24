package com.idropin.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.idropin.domain.entity.TaskMoreInfo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

/**
 * 任务更多信息Mapper
 *
 * @author Idrop.in Team
 */
@Mapper
public interface TaskMoreInfoMapper extends BaseMapper<TaskMoreInfo> {
    
    @Select("SELECT id, task_id::text as taskId, ddl, tip, info, people, format, template, bind_field as bindField, rewrite, created_at as createdAt, updated_at as updatedAt FROM task_more_info WHERE task_id = #{taskId}::uuid")
    TaskMoreInfo selectByTaskId(@Param("taskId") String taskId);
    
    int updateByTaskId(@Param("entity") TaskMoreInfo entity);
}
