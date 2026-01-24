package com.idropin.application.service;

import com.idropin.domain.dto.AIClassificationRequest;
import com.idropin.domain.vo.AIClassificationResult;

/**
 * AI分类服务接口
 *
 * @author Idrop.in Team
 */
public interface AIClassificationService {

  /**
   * AI分类文件
   *
   * @param request 分类请求
   * @return 分类结果
   */
  AIClassificationResult classifyFile(AIClassificationRequest request);
}
