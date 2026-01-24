package com.idropin.domain.entity;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 文件分片实体
 *
 * @author Idrop.in Team
 */
@Data
public class FileChunk {

  /**
   * 分片ID
   */
  private String id;

  /**
   * 文件ID（完整文件上传后生成）
   */
  private String fileId;

  /**
   * 上传任务ID（用于标识同一个大文件的上传任务）
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
   * 分片序号（从0开始）
   */
  private Integer chunkNumber;

  /**
   * 分片大小
   */
  private Long chunkSize;

  /**
   * 分片存储路径
   */
  private String storagePath;

  /**
   * 上传用户ID
   */
  private String uploaderId;

  /**
   * 分片状态：UPLOADING-上传中，COMPLETED-已完成，MERGED-已合并
   */
  private String status;

  /**
   * 创建时间
   */
  private LocalDateTime createdAt;

  /**
   * 更新时间
   */
  private LocalDateTime updatedAt;
}
