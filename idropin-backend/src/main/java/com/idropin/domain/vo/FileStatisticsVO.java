package com.idropin.domain.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * 文件统计VO
 *
 * @author Idrop.in Team
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileStatisticsVO {

  /**
   * 总文件数
   */
  private Long totalFiles;

  /**
   * 总存储大小（字节）
   */
  private Long totalStorageSize;

  /**
   * 今日上传数
   */
  private Long todayUploads;

  /**
   * 本周上传数
   */
  private Long weekUploads;

  /**
   * 本月上传数
   */
  private Long monthUploads;

  /**
   * 文件类型分布
   */
  private List<FileTypeDistribution> fileTypeDistribution;

  /**
   * 上传趋势（最近7天）
   */
  private List<UploadTrend> uploadTrend;

  /**
   * 分类统计
   */
  private List<CategoryStatistics> categoryStatistics;

  /**
   * 存储空间使用情况
   */
  private StorageUsage storageUsage;

  /**
   * 文件类型分布
   */
  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class FileTypeDistribution {
    /**
     * 文件类型
     */
    private String type;

    /**
     * 类型名称
     */
    private String typeName;

    /**
     * 数量
     */
    private Long count;

    /**
     * 占比
     */
    private Double percentage;
  }

  /**
   * 上传趋势
   */
  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class UploadTrend {
    /**
     * 日期
     */
    private String date;

    /**
     * 上传数量
     */
    private Long count;

    /**
     * 上传大小（字节）
     */
    private Long size;
  }

  /**
   * 分类统计
   */
  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class CategoryStatistics {
    /**
     * 分类ID
     */
    private String categoryId;

    /**
     * 分类名称
     */
    private String categoryName;

    /**
     * 文件数量
     */
    private Long fileCount;

    /**
     * 存储大小（字节）
     */
    private Long storageSize;
  }

  /**
   * 存储空间使用情况
   */
  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class StorageUsage {
    /**
     * 已使用（字节）
     */
    private Long used;

    /**
     * 总容量（字节）
     */
    private Long total;

    /**
     * 使用占比
     */
    private Double percentage;

    /**
     * 剩余（字节）
     */
    private Long remaining;
  }
}
