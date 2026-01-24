package com.idropin.domain.dto;

import lombok.Data;

/**
 * 搜索请求
 *
 * @author Idrop.in Team
 */
@Data
public class SearchRequest {

  /**
   * 搜索关键字
   */
  private String keyword;

  /**
   * 文件类型（MIME类型）
   */
  private String mimeType;

  /**
   * 分类ID
   */
  private String categoryId;

  /**
   * 标签列表
   */
  private java.util.List<String> tags;

  /**
   * 开始时间
   */
  private String startDate;

  /**
   * 结束时间
   */
  private String endDate;

  /**
   * 最小文件大小
   */
  private Long minFileSize;

  /**
   * 最大文件大小
   */
  private Long maxFileSize;

  /**
   * 页码（从0开始）
   */
  private Integer page;

  /**
   * 每页大小
   */
  private Integer size;

  /**
   * 排序字段
   */
  private String sortBy;

  /**
   * 排序方向（asc、desc）
   */
  private String sortOrder;
}
