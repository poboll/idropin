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
   * 是否需要登录
   */
  private Boolean requireLogin;

  /**
   * 是否允许匿名提交（与 requireLogin 互补；用于任务列表/详情展示）
   */
  private Boolean allowAnonymous;

  /**
   * 限制每个IP/设备只能提交一次
   */
  private Boolean limitOnePerDevice;

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
   * 最大同时提交文件数量（1-16，默认10）
   */
  private Integer maxFileCount;

  /**
   * 创建者ID
   */
  private String createdBy;

  /**
   * 状态
   */
  private String status;

  /**
   * 任务类型: FILE_COLLECTION（文件收集）, INFO_COLLECTION（信息收集）
   */
  private String taskType;

  /**
   * 收集类型: INFO（仅收集信息）, FILE（收集文件）
   */
  private String collectionType;

  /**
   * 软删除标记（回收站）
   */
  private Boolean deleted;

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
