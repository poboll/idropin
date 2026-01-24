package com.idropin.domain.vo;

import lombok.Builder;
import lombok.Data;

/**
 * AI分类结果
 *
 * @author Idrop.in Team
 */
@Data
@Builder
public class AIClassificationResult {

  /**
   * 分类ID
   */
  private String categoryId;

  /**
   * 分类名称
   */
  private String categoryName;

  /**
   * 置信度（0-1）
   */
  private Double confidence;

  /**
   * 是否成功
   */
  private Boolean success;

  /**
   * 错误信息
   */
  private String errorMessage;
}
