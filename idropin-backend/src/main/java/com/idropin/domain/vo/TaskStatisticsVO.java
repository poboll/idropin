package com.idropin.domain.vo;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

/**
 * 任务统计VO
 *
 * @author Idrop.in Team
 */
@Data
@Builder
public class TaskStatisticsVO {

  /**
   * 任务ID
   */
  private String taskId;

  /**
   * 任务标题
   */
  private String taskTitle;

  /**
   * 总提交数
   */
  private Long totalSubmissions;

  /**
   * 唯一提交者数量
   */
  private Long uniqueSubmitters;

  /**
   * 文件类型分布
   */
  private Map<String, Long> fileTypeDistribution;

  /**
   * 最近提交记录
   */
  private List<RecentSubmission> recentSubmissions;

  /**
   * 最近提交记录
   */
  @Data
  @Builder
  public static class RecentSubmission {
    private String submissionId;
    private String fileName;
    private String submitterName;
    private String submittedAt;
  }
}
