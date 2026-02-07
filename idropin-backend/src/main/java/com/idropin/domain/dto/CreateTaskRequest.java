package com.idropin.domain.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 创建收集任务请求
 *
 * @author Idrop.in Team
 */
@Data
public class CreateTaskRequest {

  /**
   * 任务标题
   */
  private String title;

  /**
   * 任务描述
   */
  private String description;

  /**
   * 截止时间
   */
  private String deadline;

  /**
   * 是否需要登录
   */
  private Boolean requireLogin;

  /**
   * 限制每个IP/设备只能提交一次
   */
  private Boolean limitOnePerDevice;

  /**
   * 最大文件大小（字节）
   */
  private Long maxFileSize;

  /**
   * 允许的文件类型（MIME类型数组）
   */
  private List<String> allowedTypes;

  /**
   * 最大同时提交文件数量（1-16，默认10）
   */
  private Integer maxFileCount;

  private String category;

  /**
   * 任务类型: FILE_COLLECTION（文件收集）, INFO_COLLECTION（信息收集）
   */
  private String taskType;

  /**
   * 收集类型: INFO（仅收集信息）, FILE（收集文件）
   */
  private String collectionType;
}
