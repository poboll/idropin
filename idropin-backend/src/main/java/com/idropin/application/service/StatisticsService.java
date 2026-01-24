package com.idropin.application.service;

import com.idropin.domain.vo.FileStatisticsVO;

/**
 * 统计服务接口
 *
 * @author Idrop.in Team
 */
public interface StatisticsService {

  /**
   * 获取文件统计数据
   *
   * @param userId 用户ID
   * @return 文件统计数据
   */
  FileStatisticsVO getFileStatistics(String userId);

  /**
   * 获取系统统计数据（管理员）
   *
   * @return 系统统计数据
   */
  FileStatisticsVO getSystemStatistics();
}
