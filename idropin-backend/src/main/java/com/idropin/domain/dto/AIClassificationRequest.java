package com.idropin.domain.dto;

import lombok.Data;

/**
 * AI分类请求
 *
 * @author Idrop.in Team
 */
@Data
public class AIClassificationRequest {

  /**
   * 文件ID
   */
  private String fileId;

  /**
   * 文件类型（image、text等）
   */
  private String fileType;

  /**
   * 文件内容（文本文件）
   */
  private String content;
}
