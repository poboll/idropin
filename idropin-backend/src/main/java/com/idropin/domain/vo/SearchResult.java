package com.idropin.domain.vo;

import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * 搜索结果
 *
 * @author Idrop.in Team
 */
@Data
@Builder
public class SearchResult {

  /**
   * 总数
   */
  private Long total;

  /**
   * 文件列表
   */
  private List<FileSearchItem> files;

  /**
   * 搜索耗时（毫秒）
   */
  private Long duration;

  /**
   * 搜索建议
   */
  private List<String> suggestions;

  /**
   * 文件搜索项
   */
  @Data
  @Builder
  public static class FileSearchItem {
    private String id;
    private String name;
    private String originalName;
    private Long fileSize;
    private String mimeType;
    private String categoryId;
    private String categoryName;
    private String[] tags;
    private String storagePath;
    private String url;
    private String createdAt;
  }
}
