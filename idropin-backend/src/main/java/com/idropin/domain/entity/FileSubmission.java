package com.idropin.domain.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 文件提交记录实体
 *
 * @author Idrop.in Team
 */
@Data
@TableName("file_submission")
public class FileSubmission {

  @TableId(type = IdType.INPUT)
  private UUID id;

  /**
   * 任务ID
   */
  private UUID taskId;

  /**
   * 文件ID
   */
  private UUID fileId;

  /**
   * 提交者ID
   */
  private UUID submitterId;


  /**
   * 提交者姓名
   */
  private String submitterName;

  /**
   * 提交者邮箱
   */
  private String submitterEmail;

  /**
   * 提交时间
   */
  @TableField(fill = FieldFill.INSERT)
  private LocalDateTime submittedAt;
}
