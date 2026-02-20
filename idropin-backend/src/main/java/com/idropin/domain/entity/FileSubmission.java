package com.idropin.domain.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.idropin.domain.vo.AiEvaluationResult;
import com.idropin.infrastructure.config.JsonbTypeHandler;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@TableName(value = "file_submission", autoResultMap = true)
public class FileSubmission {

  @TableId(type = IdType.ASSIGN_UUID)
  private String id;

  @TableField(typeHandler = org.apache.ibatis.type.StringTypeHandler.class)
  private String taskId;

  @TableField(typeHandler = org.apache.ibatis.type.StringTypeHandler.class)
  private String fileId;

  @TableField(typeHandler = org.apache.ibatis.type.StringTypeHandler.class)
  private String submitterId;

  private String submitterName;

  private String submitterEmail;

  @TableField(fill = FieldFill.INSERT)
  private LocalDateTime submittedAt;

  private String submitterIp;

  @TableField(fill = FieldFill.INSERT)
  private LocalDateTime createdAt;

  // --- AI 批阅字段 ---

  private Integer aiStatus;

  @TableField(typeHandler = JsonbTypeHandler.class)
  private AiEvaluationResult aiEvaluation;

  private String similarToId;

  private Boolean isPlagiarized;
}
