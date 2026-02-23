package com.idropin.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.idropin.domain.entity.AiEvaluationHistory;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface AiEvaluationHistoryMapper extends BaseMapper<AiEvaluationHistory> {

    @Select("SELECT * FROM ai_evaluation_history WHERE submission_id::text = #{submissionId}::text ORDER BY created_at ASC")
    List<AiEvaluationHistory> findBySubmissionId(@Param("submissionId") String submissionId);
}
