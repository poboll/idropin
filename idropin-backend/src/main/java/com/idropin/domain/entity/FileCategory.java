package com.idropin.domain.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 文件分类实体
 *
 * @author Idrop.in Team
 */
@Data
@TableName("file_category")
public class FileCategory {

  @TableId(type = IdType.ASSIGN_UUID)
  private String id;

  /**
   * 分类名称
   */
  private String name;

  /**
   * 父分类ID
   */
  private String parentId;

  /**
   * 创建者ID
   */
  private String userId;

  /**
   * 图标
   */
  private String icon;

  /**
   * 颜色
   */
  private String color;

  /**
   * 排序顺序
   */
  private Integer sortOrder;

  /**
   * 创建时间
   */
  @TableField(fill = FieldFill.INSERT)
  private LocalDateTime createdAt;
}
