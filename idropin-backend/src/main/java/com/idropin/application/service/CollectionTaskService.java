package com.idropin.application.service;

import com.idropin.domain.dto.CreateTaskRequest;
import com.idropin.domain.entity.CollectionTask;
import com.idropin.domain.entity.FileSubmission;
import com.idropin.domain.vo.TaskStatisticsVO;

import java.util.List;

/**
 * 收集任务服务接口
 *
 * @author Idrop.in Team
 */
public interface CollectionTaskService {

  /**
   * 创建收集任务
   */
  CollectionTask createTask(CreateTaskRequest request, String userId);

  /**
   * 获取用户的任务列表
   */
  List<CollectionTask> getUserTasks(String userId);

  /**
   * 获取任务详情
   */
  CollectionTask getTask(String taskId, String userId);

  /**
   * 更新任务
   */
  CollectionTask updateTask(String taskId, CreateTaskRequest request, String userId);

  /**
   * 删除任务
   */
  void deleteTask(String taskId, String userId);

  /**
   * 提交文件到任务
   */
  FileSubmission submitFile(String taskId, String fileId, String submitterName,
      String submitterEmail, String submitterId, String submitterIp);

  /**
   * 获取任务的提交记录
   */
  List<com.idropin.domain.vo.FileSubmissionVO> getTaskSubmissions(String taskId, String userId);

  /**
   * 获取任务统计
   */
  TaskStatisticsVO getTaskStatistics(String taskId, String userId);

  /**
   * 公开获取任务（不验证用户权限，用于收集链接）
   */
  CollectionTask getTaskPublic(String taskId);

  /**
   * 批量获取用户所有任务的提交记录
   */
  List<com.idropin.domain.vo.FileSubmissionVO> getAllUserTaskSubmissions(String userId);

  /**
   * 获取用户的回收站任务列表
   */
  List<CollectionTask> getDeletedTasks(String userId);

  /**
   * 恢复任务（从回收站）
   */
  void restoreTask(String taskId, String userId);

  /**
   * 永久删除任务
   */
  void permanentlyDeleteTask(String taskId, String userId);
}
