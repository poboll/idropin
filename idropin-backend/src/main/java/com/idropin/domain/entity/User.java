package com.idropin.domain.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 用户实体
 *
 * @author Idrop.in Team
 */
@Data
@TableName("sys_user")
public class User {

  @TableId(type = IdType.ASSIGN_UUID)
  private String id;

  /**
   * 用户名
   */
  private String username;

  /**
   * 邮箱
   */
  private String email;

  /**
   * 密码哈希
   */
  private String passwordHash;

  /**
   * 头像URL
   */
  private String avatarUrl;

  /**
   * 元数据（JSONB）
   */
  private String metadata;

  /**
   * 用户状态
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
