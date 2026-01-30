package com.idropin.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.idropin.domain.entity.TaskSubmission;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 任务提交记录Mapper
 */
@Mapper
public interface TaskSubmissionMapper extends BaseMapper<TaskSubmission> {

    /**
     * 根据任务Key和提交者姓名查询提交记录
     */
    @Select("SELECT * FROM task_submission WHERE task_key = #{taskKey,jdbcType=VARCHAR} AND submitter_name = #{submitterName,jdbcType=VARCHAR} AND status = 0")
    List<TaskSubmission> findByTaskKeyAndSubmitterName(@Param("taskKey") String taskKey, @Param("submitterName") String submitterName);

    /**
     * 根据任务Key、文件哈希和提交者姓名查询提交记录
     */
    @Select("SELECT * FROM task_submission WHERE task_key = #{taskKey,jdbcType=VARCHAR} AND file_hash = #{fileHash,jdbcType=VARCHAR} AND submitter_name = #{submitterName,jdbcType=VARCHAR} AND status = 0")
    TaskSubmission findByTaskKeyAndHashAndName(@Param("taskKey") String taskKey, @Param("fileHash") String fileHash, @Param("submitterName") String submitterName);

    /**
     * 根据任务Key和文件名查询提交记录（用于撤回）
     */
    @Select("SELECT * FROM task_submission WHERE task_key = #{taskKey,jdbcType=VARCHAR} AND file_name = #{fileName,jdbcType=VARCHAR} AND status = 0")
    TaskSubmission findByTaskKeyAndFileName(@Param("taskKey") String taskKey, @Param("fileName") String fileName);

    /**
     * 根据任务Key查询所有提交记录（包括已撤回的）
     */
    @Select("SELECT * FROM task_submission WHERE task_key = #{taskKey,jdbcType=VARCHAR} ORDER BY created_at DESC")
    List<TaskSubmission> findAllByTaskKey(@Param("taskKey") String taskKey);
}
