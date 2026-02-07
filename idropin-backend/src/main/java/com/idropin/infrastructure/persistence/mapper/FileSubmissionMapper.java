package com.idropin.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.idropin.domain.entity.FileSubmission;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import java.util.List;

/**
 * 文件提交记录Mapper
 *
 * @author Idrop.in Team
 */
@Mapper
public interface FileSubmissionMapper extends BaseMapper<FileSubmission> {
    
    /**
     * 根据任务ID和提交者姓名查询提交记录
     */
    List<FileSubmission> findByTaskIdAndSubmitterName(@Param("taskId") String taskId, @Param("submitterName") String submitterName);
    
    /**
     * 根据String类型的ID查询记录（处理UUID类型转换）
     */
    @Select("SELECT * FROM file_submission WHERE id::text = #{submissionId}::text")
    FileSubmission selectByIdString(@Param("submissionId") String submissionId);
    
    /**
     * 根据String类型的ID删除记录（处理UUID类型转换）
     */
    @Delete("DELETE FROM file_submission WHERE id::text = #{submissionId}::text")
    int deleteByIdString(@Param("submissionId") String submissionId);

    @Select("SELECT COUNT(*) FROM file_submission WHERE task_id::text = #{taskId}::text AND submitter_ip = #{submitterIp}")
    long countByTaskIdAndIp(@Param("taskId") String taskId, @Param("submitterIp") String submitterIp);
}
