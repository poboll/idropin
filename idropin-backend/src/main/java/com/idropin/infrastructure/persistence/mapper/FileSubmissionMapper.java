package com.idropin.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.idropin.domain.entity.FileSubmission;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import java.util.List;
import java.util.Map;

@Mapper
public interface FileSubmissionMapper extends BaseMapper<FileSubmission> {

    List<FileSubmission> findByTaskIdAndSubmitterName(@Param("taskId") String taskId, @Param("submitterName") String submitterName);

    @Select("SELECT * FROM file_submission WHERE id::text = #{submissionId}::text")
    FileSubmission selectByIdString(@Param("submissionId") String submissionId);

    @Delete("DELETE FROM file_submission WHERE id::text = #{submissionId}::text")
    int deleteByIdString(@Param("submissionId") String submissionId);

    @Select("SELECT COUNT(*) FROM file_submission WHERE task_id::text = #{taskId}::text AND submitter_ip = #{submitterIp}")
    long countByTaskIdAndIp(@Param("taskId") String taskId, @Param("submitterIp") String submitterIp);

    List<FileSubmission> findSimilarByVector(
            @Param("taskId") String taskId,
            @Param("excludeId") String excludeId,
            @Param("queryVector") float[] queryVector,
            @Param("threshold") double threshold,
            @Param("limit") int limit
    );

    @Select("SELECT ai_status, COUNT(*) as cnt FROM file_submission GROUP BY ai_status")
    List<Map<String, Object>> countGroupByAiStatus();
}
