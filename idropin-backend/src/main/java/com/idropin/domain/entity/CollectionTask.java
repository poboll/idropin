package com.idropin.domain.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import org.apache.ibatis.type.JdbcType;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 收集任务实体
 *
 * @author Idrop.in Team
 */
@Data
@TableName(value = "collection_task", autoResultMap = true)
public class CollectionTask {

  @TableId(type = IdType.INPUT)
  private String id;


  /**
   * 任务标题
   */
  private String title;

  /**
   * 任务描述
   */
  private String description;

  /**
   * 截止时间
   */
  private LocalDateTime deadline;

  /**
   * 是否允许匿名
   */
  private Boolean allowAnonymous;

  /**
   * 是否需要登录
   */
  private Boolean requireLogin;

  /**
   * 最大文件大小
   */
  private Long maxFileSize;

  /**
   * 允许的文件类型（数组）
   */
  @TableField(typeHandler = com.idropin.infrastructure.config.StringArrayTypeHandler.class, jdbcType = JdbcType.ARRAY)
  private String[] allowedTypes;

  /**
   * 创建者ID
   */
  private String createdBy;

  /**
   * 状态
   */
  private String status;

  /**
   * 创建时间
   */
  @TableField(fill = FieldFill.INSERT)
  private LocalDateTime createdAt;

  /**
   * 更新时间
   */
  @TableField(fill = FieldFill.INSERT_UPDATE)
  private LocalDateTime updatedAt;
}
