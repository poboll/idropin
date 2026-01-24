package com.idropin.domain.dto;

import lombok.Data;

/**
 * 分片上传请求
 *
 * @author Idrop.in Team
 */
@Data
public class ChunkUploadRequest {

  /**
   * 上传任务ID（唯一标识一个大文件的上传）
   */
  private String uploadId;

  /**
   * 文件名
   */
  private String fileName;

  /**
   * 文件总大小
   */
  private Long totalSize;

  /**
   * 文件MD5（用于验证完整性）
   */
  private String fileMd5;

  /**
   * 当前分片序号（从0开始）
   */
  private Integer chunkNumber;

  /**
   * 分片总数
   */
  private Integer totalChunks;

  /**
   * 分片大小
   */
  private Long chunkSize;

  /**
   * 是否是最后一个分片
   */
  private Boolean isLastChunk;
}
