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
   * 用户角色: USER-普通用户, ADMIN-管理员, SUPER_ADMIN-超级管理员
   */
  private String role;

  /**
   * 手机号
   */
  private String phone;

  /**
   * 存储配额(字节)
   */
  private Long storageLimit;

  /**
   * 已使用存储(字节)
   */
  private Long storageUsed;

  /**
   * 任务数量限制
   */
  private Integer taskLimit;

  /**
   * 最后登录时间
   */
  private LocalDateTime lastLoginAt;

  /**
   * 最后登录IP
   */
  private String lastLoginIp;

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
