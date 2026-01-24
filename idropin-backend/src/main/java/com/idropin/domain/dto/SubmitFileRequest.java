package com.idropin.domain.dto;

import lombok.Data;

/**
 * 提交文件请求
 *
 * @author Idrop.in Team
 */
@Data
public class SubmitFileRequest {

  /**
   * 任务ID
   */
  private String taskId;

  /**
   * 提交者姓名（匿名提交时使用）
   */
  private String submitterName;

  /**
   * 提交者邮箱（匿名提交时使用）
   */
  private String submitterEmail;
}
