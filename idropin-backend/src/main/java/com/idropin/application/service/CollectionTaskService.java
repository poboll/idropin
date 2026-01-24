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
      String submitterEmail, String submitterId);

  /**
   * 获取任务的提交记录
   */
  List<FileSubmission> getTaskSubmissions(String taskId, String userId);

  /**
   * 获取任务统计
   */
  TaskStatisticsVO getTaskStatistics(String taskId, String userId);
}
