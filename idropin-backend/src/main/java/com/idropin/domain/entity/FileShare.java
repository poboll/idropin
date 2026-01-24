package com.idropin.domain.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 文件分享实体
 *
 * @author Idrop.in Team
 */
@Data
@TableName("file_share")
public class FileShare {

  @TableId(type = IdType.ASSIGN_UUID)
  private String id;

  /**
   * 文件ID
   */
  private String fileId;

  /**
   * 分享码
   */
  private String shareCode;

  /**
   * 密码
   */
  private String password;

  /**
   * 过期时间
   */
  private LocalDateTime expireAt;

  /**
   * 下载限制
   */
  private Integer downloadLimit;

  /**
   * 下载次数
   */
  private Integer downloadCount;

  /**
   * 创建者ID
   */
  private String createdBy;

  /**
   * 创建时间
   */
  @TableField(fill = FieldFill.INSERT)
  private LocalDateTime createdAt;
}
