package com.idropin.domain.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.idropin.infrastructure.config.JsonbTypeHandler;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@TableName(value = "ai_evaluation_history", autoResultMap = true)
public class AiEvaluationHistory {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    private String submissionId;

    private Integer score;

    @TableField(typeHandler = com.idropin.infrastructure.config.MapJsonbTypeHandler.class)
    private Map<String, Integer> dimensions;

    private String feedback;

    private String summary;

    private LocalDateTime evaluatedAt;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
