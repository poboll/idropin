package com.idropin.domain.vo;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 分享信息VO（公开信息，不包含敏感数据）
 *
 * @author Idrop.in Team
 */
@Data
public class ShareInfoVO {
  private String shareCode;
  private String fileName;
  private Long fileSize;
  private String fileType;
  private Boolean hasPassword;
  private LocalDateTime expireAt;
  private Integer downloadLimit;
  private Integer downloadCount;
  private String creatorUsername;
}
