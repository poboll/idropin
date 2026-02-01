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

  @TableId(type = IdType.ASSIGN_UUID)
  private String id;

  /**
   * 任务ID (数据库中为UUID类型)
   */
  @TableField(typeHandler = org.apache.ibatis.type.StringTypeHandler.class)
  private String taskId;

  /**
   * 文件ID (数据库中为UUID类型)
   */
  @TableField(typeHandler = org.apache.ibatis.type.StringTypeHandler.class)
  private String fileId;

  /**
   * 提交者ID (数据库中为UUID类型)
   */
  @TableField(typeHandler = org.apache.ibatis.type.StringTypeHandler.class)
  private String submitterId;


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
