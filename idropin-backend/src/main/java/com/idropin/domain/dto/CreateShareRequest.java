package com.idropin.domain.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 创建分享请求
 *
 * @author Idrop.in Team
 */
@Data
public class CreateShareRequest {

  /**
   * 文件ID
   */
  private String fileId;

  /**
   * 分享密码
   */
  private String password;

  /**
   * 过期时间
   */
  private LocalDateTime expireAt;

  /**
   * 下载次数限制
   */
  private Integer downloadLimit;
}
