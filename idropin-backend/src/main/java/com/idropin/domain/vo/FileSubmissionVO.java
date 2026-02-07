package com.idropin.domain.vo;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 文件提交记录VO（包含文件详细信息）
 *
 * @author Idrop.in Team
 */
@Data
public class FileSubmissionVO {
  
  /**
   * 提交记录ID
   */
  private String id;
  
  /**
   * 任务ID
   */
  private String taskId;

  /**
   * 任务标题
   */
  private String taskTitle;
  
  /**
   * 文件ID
   */
  private String fileId;
  
  /**
   * 提交者ID
   */
  private String submitterId;
  
  /**
   * 提交者姓名
   */
  private String submitterName;
  
  /**
   * 提交者邮箱
   */
  private String submitterEmail;
  
  /**
   * 提交时间
   */
  private LocalDateTime submittedAt;
  
  // 文件详细信息
  /**
   * 文件原始名称
   */
  private String fileName;
  
  /**
   * 文件大小（字节）
   */
  private Long fileSize;
  
  /**
   * 文件MIME类型
   */
  private String mimeType;
  
  /**
   * 文件URL
   */
  private String fileUrl;
  
  /**
   * 文件存储路径
   */
  private String storagePath;
}
