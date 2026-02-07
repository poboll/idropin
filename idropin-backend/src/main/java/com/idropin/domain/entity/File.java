package com.idropin.domain.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 文件实体
 *
 * @author Idrop.in Team
 */
@Data
@TableName("file")
public class File {

  @TableId(type = IdType.INPUT)
  private String id;

  /**
   * 文件名
   */
  private String name;

  /**
   * 原始文件名
   */
  private String originalName;

  /**
   * 文件大小
   */
  private Long fileSize;

  /**
   * MIME类型
   */
  private String mimeType;

  /**
   * 存储路径
   */
  private String storagePath;

  /**
   * 存储提供商
   */
  private String storageProvider;

  /**
   * 元数据（JSONB）
   */
  private String metadata;

  /**
   * 标签（数组）
   */
  @TableField(typeHandler = com.idropin.infrastructure.config.StringArrayTypeHandler.class)
  private String[] tags;

  /**
   * 分类ID
   */
  private String categoryId;

  /**
   * 上传者ID
   */
  private String uploaderId;

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

  /**
   * 是否已删除（软删除标记）
   */
  private Boolean deleted;

  /**
   * 删除时间
   */
  private LocalDateTime deletedAt;
}
