package com.idropin.application.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.idropin.application.service.CollectionTaskService;
import com.idropin.application.service.FileService;
import com.idropin.common.exception.BusinessException;
import com.idropin.domain.dto.CreateTaskRequest;
import com.idropin.domain.entity.CollectionTask;
import com.idropin.domain.entity.File;
import com.idropin.domain.entity.FileSubmission;
import com.idropin.domain.entity.TaskSubmission;
import com.idropin.domain.vo.TaskStatisticsVO;
import com.idropin.domain.entity.TaskMoreInfo;
import com.idropin.infrastructure.persistence.mapper.CollectionTaskMapper;
import com.idropin.infrastructure.persistence.mapper.FileMapper;
import com.idropin.infrastructure.persistence.mapper.FileSubmissionMapper;
import com.idropin.infrastructure.persistence.mapper.TaskMoreInfoMapper;
import com.idropin.infrastructure.persistence.mapper.TaskSubmissionMapper;
import com.idropin.infrastructure.storage.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 收集任务服务实现类
 *
 * @author Idrop.in Team
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CollectionTaskServiceImpl implements CollectionTaskService {

  private final CollectionTaskMapper taskMapper;
  private final FileSubmissionMapper submissionMapper;
  private final FileMapper fileMapper;
  private final FileService fileService;
  private final StorageService storageService;
  private final TaskSubmissionMapper taskSubmissionMapper;
  private final TaskMoreInfoMapper taskMoreInfoMapper;

  /**
   * 生成6位短码
   * 使用字母和数字组合，排除容易混淆的字符（0,O,1,I,l）
   */
  private String generateShortCode() {
    String chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz";
    StringBuilder sb = new StringBuilder();
    Random random = new Random();
    for (int i = 0; i < 6; i++) {
      sb.append(chars.charAt(random.nextInt(chars.length())));
    }
    return sb.toString();
  }

  @Override
  @Transactional
  public CollectionTask createTask(CreateTaskRequest request, String userId) {
    CollectionTask task = new CollectionTask();
    // 生成6位短码作为任务ID
    String shortCode;
    int maxAttempts = 10;
    int attempts = 0;
    do {
      shortCode = generateShortCode();
      attempts++;
      // 检查是否已存在
      if (taskMapper.selectByIdString(shortCode) == null) {
        break;
      }
    } while (attempts < maxAttempts);
    
    if (attempts >= maxAttempts) {
      // 如果多次尝试都冲突，使用UUID的前8位
      shortCode = UUID.randomUUID().toString().substring(0, 8);
    }
    
    task.setId(shortCode);
    task.setTitle(request.getTitle());
    task.setDescription(request.getDescription());
    if (StringUtils.hasText(request.getDeadline())) {
      try {
        task.setDeadline(LocalDateTime.parse(request.getDeadline()));
      } catch (Exception e) {
        log.warn("Failed to parse deadline: {}, trying to fix format", request.getDeadline());
        try {
           String fixed = request.getDeadline().replace(" ", "T");
           if (fixed.length() == 16) {
             fixed += ":00";
           }
           task.setDeadline(LocalDateTime.parse(fixed));
        } catch (Exception e2) {
           log.error("Invalid deadline format", e2);
           task.setDeadline(null);
        }
      }
    } else {
      task.setDeadline(null);
    }
    task.setRequireLogin(request.getRequireLogin() != null ? request.getRequireLogin() : false);
    task.setLimitOnePerDevice(request.getLimitOnePerDevice() != null ? request.getLimitOnePerDevice() : true);
    task.setMaxFileSize(request.getMaxFileSize());
    task.setMaxFileCount(request.getMaxFileCount() != null ? request.getMaxFileCount() : 10);

    if (request.getAllowedTypes() != null && !request.getAllowedTypes().isEmpty()) {
      task.setAllowedTypes(request.getAllowedTypes().toArray(new String[0]));
    }

    task.setCreatedBy(userId);
    task.setStatus("OPEN");
    // 设置收集类型，默认为 FILE（收集文件）
    task.setCollectionType(request.getCollectionType() != null ? request.getCollectionType() : "FILE");
    task.setCreatedAt(LocalDateTime.now());
    task.setUpdatedAt(LocalDateTime.now());

    taskMapper.insert(task);
    
    // 创建默认的 TaskMoreInfo 记录，启用自动重命名
    TaskMoreInfo moreInfo = new TaskMoreInfo();
    moreInfo.setTaskId(task.getId());
    moreInfo.setAutoRename(true);
    moreInfo.setPeople(true);
    moreInfo.setRewrite(false);
    moreInfo.setCreatedAt(LocalDateTime.now());
    moreInfo.setUpdatedAt(LocalDateTime.now());
    taskMoreInfoMapper.insert(moreInfo);
    
    log.info("Collection task created: {} by user {}", task.getTitle(), userId);

    return task;
  }

  @Override
  public List<CollectionTask> getUserTasks(String userId) {
    return taskMapper.selectByCreatedBy(userId);
  }

  @Override
  public CollectionTask getTask(String taskId, String userId) {
    CollectionTask task = taskMapper.selectByIdString(taskId);
    if (task == null) {
      throw new BusinessException("任务不存在");
    }
    if (!task.getCreatedBy().equals(userId)) {
      throw new BusinessException("无权限访问此任务");
    }
    return task;
  }

  @Override
  @Transactional
  public CollectionTask updateTask(String taskId, CreateTaskRequest request, String userId) {
    CollectionTask task = getTask(taskId, userId);

    if (StringUtils.hasText(request.getTitle())) {
      task.setTitle(request.getTitle());
    }
    // Only update description if it's explicitly provided and not empty
    // Empty string should be treated as "no description"
    if (request.getDescription() != null && StringUtils.hasText(request.getDescription())) {
      task.setDescription(request.getDescription());
    } else if (request.getDescription() != null && request.getDescription().isEmpty()) {
      // If explicitly set to empty string, clear the description
      task.setDescription(null);
    }
    if (request.getDeadline() != null) {
      try {
        task.setDeadline(LocalDateTime.parse(request.getDeadline()));
      } catch (Exception e) {
        try {
           String fixed = request.getDeadline().replace(" ", "T");
           if (fixed.length() == 16) {
             fixed += ":00";
           }
           task.setDeadline(LocalDateTime.parse(fixed));
        } catch (Exception e2) {
           task.setDeadline(null);
        }
      }
    }
    if (request.getRequireLogin() != null) {
      task.setRequireLogin(request.getRequireLogin());
    }
    if (request.getLimitOnePerDevice() != null) {
      task.setLimitOnePerDevice(request.getLimitOnePerDevice());
    }
    if (request.getMaxFileSize() != null) {
      task.setMaxFileSize(request.getMaxFileSize());
    }
    if (request.getMaxFileCount() != null) {
      task.setMaxFileCount(request.getMaxFileCount());
    }
    if (request.getAllowedTypes() != null) {
      task.setAllowedTypes(request.getAllowedTypes().toArray(new String[0]));
    }
    // 更新收集类型
    if (request.getCollectionType() != null) {
      task.setCollectionType(request.getCollectionType());
    }

    task.setUpdatedAt(LocalDateTime.now());
    taskMapper.updateById(task);
    log.info("Collection task updated: {} by user {}", taskId, userId);

    return task;
  }

  @Override
  @Transactional
  public void deleteTask(String taskId, String userId) {
    CollectionTask task = getTask(taskId, userId);

    // 软删除：移动到回收站。
    // NOTE: 不能用 BaseMapper/updateById（MP 会生成包含不存在列的 SQL），必须走 XML 显式 SQL。
    int affected = taskMapper.softDeleteByIdAndCreatedBy(task.getId(), userId);
    if (affected <= 0) {
      // 0 行：可能已在回收站，或并发更新。
      throw new BusinessException("删除失败：任务可能已在回收站中");
    }

    log.info("Collection task soft deleted (moved to trash): {} by user {}", taskId, userId);
  }

  @Override
  @Transactional
  public FileSubmission submitFile(String taskId, String fileId, String submitterName,
      String submitterEmail, String submitterId, String submitterIp) {
    CollectionTask task = taskMapper.selectByIdString(taskId);
    if (task == null) {
      throw new BusinessException("任务不存在");
    }

    if (!"OPEN".equals(task.getStatus())) {
      throw new BusinessException("任务已关闭");
    }

    if (task.getDeadline() != null && task.getDeadline().isBefore(LocalDateTime.now())) {
      throw new BusinessException("任务已过期");
    }

    if (Boolean.TRUE.equals(task.getRequireLogin()) && submitterId == null) {
      throw new BusinessException("此任务需要登录后提交");
    }

    if (Boolean.TRUE.equals(task.getLimitOnePerDevice()) && submitterIp != null) {
      long existingSubmissions = submissionMapper.countByTaskIdAndIp(taskId, submitterIp);
      if (existingSubmissions > 0) {
        throw new BusinessException("您已经提交过了，每个设备只能提交一次");
      }
    }

    File file = fileMapper.selectById(fileId);
    if (file == null) {
      throw new BusinessException("文件不存在");
    }

    // maxFileSize = 0 或 null 表示不限制文件大小
    if (task.getMaxFileSize() != null && task.getMaxFileSize() > 0 && file.getFileSize() > task.getMaxFileSize()) {
      throw new BusinessException("文件大小超过限制");
    }

    if (task.getAllowedTypes() != null && task.getAllowedTypes().length > 0) {
      boolean allowed = Arrays.stream(task.getAllowedTypes())
          .anyMatch(type -> file.getMimeType().startsWith(type));
      if (!allowed) {
        throw new BusinessException("不支持的文件类型: " + file.getMimeType());
      }
    }

    // 注意：重复提交检查已通过数据库唯一约束处理
    // 这里不再进行额外的查询检查，以避免UUID类型转换问题

    FileSubmission submission = new FileSubmission();
    submission.setId(UUID.randomUUID().toString());
    submission.setTaskId(taskId);
    submission.setFileId(fileId);
    if (submitterId != null) {
      submission.setSubmitterId(submitterId);
    }
    submission.setSubmitterName(submitterName);
    submission.setSubmitterEmail(submitterEmail);
    submission.setSubmittedAt(LocalDateTime.now());
    submission.setSubmitterIp(submitterIp); // 记录IP地址
    submission.setCreatedAt(LocalDateTime.now());

    submissionMapper.insert(submission);
    log.info("File submitted to task: {} by {} from IP: {}", taskId, submitterId != null ? submitterId : submitterEmail, submitterIp);

    return submission;
  }

  @Override
  public List<com.idropin.domain.vo.FileSubmissionVO> getTaskSubmissions(String taskId, String userId) {
    // 验证任务存在且用户有权限
    CollectionTask task;
    try {
      task = getTask(taskId, userId);
    } catch (Exception e) {
      // 任务不存在或用户无权限,返回空列表
      log.warn("Failed to get task {} for user {}: {}", taskId, userId, e.getMessage());
      return new ArrayList<>();
    }

    // 根据任务类型查询不同的表
    if ("FILE".equals(task.getCollectionType())) {
      // 文件收集任务：查询 file_submission 表
      log.info("Querying file_submission table for FILE collection task, taskId: {}", taskId);
      
      // 使用字符串比较，显式转换类型避免UUID类型转换问题
      LambdaQueryWrapper<FileSubmission> wrapper = new LambdaQueryWrapper<>();
      wrapper.apply("task_id::text = {0}::text", taskId)
          .orderByDesc(FileSubmission::getSubmittedAt);

      List<FileSubmission> submissions = submissionMapper.selectList(wrapper);
      
      // 转换为VO，关联查询文件信息
      return submissions.stream().map(submission -> {
        com.idropin.domain.vo.FileSubmissionVO vo = new com.idropin.domain.vo.FileSubmissionVO();
        vo.setId(submission.getId());
        vo.setTaskId(submission.getTaskId());
        vo.setFileId(submission.getFileId());
        vo.setSubmitterId(submission.getSubmitterId());
        vo.setSubmitterName(submission.getSubmitterName());
        vo.setSubmitterEmail(submission.getSubmitterEmail());
        vo.setSubmittedAt(submission.getSubmittedAt());
        
        // 查询文件详细信息
        if (submission.getFileId() != null) {
          File file = fileMapper.selectById(submission.getFileId());
          if (file != null) {
            vo.setFileName(file.getOriginalName());
            vo.setFileSize(file.getFileSize());
            vo.setMimeType(file.getMimeType());
            vo.setStoragePath(file.getStoragePath());
            // 生成文件URL
            vo.setFileUrl(storageService.getFileUrl(file.getStoragePath()));
          }
        }
        
        return vo;
      }).collect(Collectors.toList());
      
    } else {
      // 信息收集任务：查询 task_submission 表
      log.info("Querying task_submission table for INFO collection task");
      
      List<TaskSubmission> taskSubmissions = taskSubmissionMapper.findAllByTaskKey(taskId);
      
      // 转换为VO
      return taskSubmissions.stream().map(submission -> {
        com.idropin.domain.vo.FileSubmissionVO vo = new com.idropin.domain.vo.FileSubmissionVO();
        vo.setId(submission.getId().toString());
        vo.setTaskId(taskId);
        vo.setSubmitterName(submission.getSubmitterName());
        vo.setSubmitterEmail(submission.getSubmitterEmail());
        vo.setSubmittedAt(submission.getSubmittedAt());
        vo.setFileName(submission.getFileName() != null ? submission.getFileName() : "信息提交");
        vo.setFileSize(submission.getFileSize() != null ? submission.getFileSize() : 0L);
        
        return vo;
      }).collect(Collectors.toList());
    }
  }

  @Override
  public TaskStatisticsVO getTaskStatistics(String taskId, String userId) {
    CollectionTask task = getTask(taskId, userId);

    long totalSubmissions = 0;
    long uniqueSubmittersCount = 0;
    Map<String, Long> fileTypeDistribution = new HashMap<>();
    List<TaskStatisticsVO.RecentSubmission> recentSubmissions = new ArrayList<>();

    // 根据任务类型查询不同的表
    if ("FILE".equals(task.getCollectionType())) {
      // 文件收集任务：查询 file_submission 表
      LambdaQueryWrapper<FileSubmission> wrapper = new LambdaQueryWrapper<>();
      wrapper.apply("task_id::text = {0}::text", taskId)
          .orderByDesc(FileSubmission::getSubmittedAt);
      List<FileSubmission> submissions = submissionMapper.selectList(wrapper);

      totalSubmissions = submissions.size();

      Set<String> uniqueSubmitters = submissions.stream()
          .map(sub -> sub.getSubmitterId() != null ? sub.getSubmitterId() : sub.getSubmitterEmail())
          .filter(id -> id != null && !id.isEmpty())
          .collect(Collectors.toSet());
      uniqueSubmittersCount = uniqueSubmitters.size();

      for (FileSubmission submission : submissions) {
        File file = fileMapper.selectById(submission.getFileId());
        if (file != null) {
          String type = file.getMimeType() != null ? file.getMimeType().split("/")[0] : "unknown";
          fileTypeDistribution.put(type, fileTypeDistribution.getOrDefault(type, 0L) + 1);
        }
      }

      recentSubmissions = submissions.stream()
          .limit(10)
          .map(sub -> {
            File file = fileMapper.selectById(sub.getFileId());
            String fileName = file != null ? file.getOriginalName() : "未知文件";
            return TaskStatisticsVO.RecentSubmission.builder()
                .submissionId(sub.getId())
                .fileName(fileName)
                .submitterName(sub.getSubmitterName() != null ? sub.getSubmitterName() : "匿名用户")
                .submittedAt(sub.getSubmittedAt().toString())
                .build();
          })
          .collect(Collectors.toList());
    } else {
      // 信息收集任务：查询 task_submission 表
      List<TaskSubmission> submissions = taskSubmissionMapper.findAllByTaskKey(taskId);
      
      totalSubmissions = submissions.size();

      Set<String> uniqueSubmitters = submissions.stream()
          .map(TaskSubmission::getSubmitterName)
          .filter(name -> name != null && !name.isEmpty())
          .collect(Collectors.toSet());
      uniqueSubmittersCount = uniqueSubmitters.size();

      recentSubmissions = submissions.stream()
          .limit(10)
          .map(sub -> TaskStatisticsVO.RecentSubmission.builder()
              .submissionId(sub.getId().toString())
              .fileName(sub.getFileName() != null ? sub.getFileName() : "信息提交")
              .submitterName(sub.getSubmitterName() != null ? sub.getSubmitterName() : "匿名用户")
              .submittedAt(sub.getSubmittedAt().toString())
              .build())
          .collect(Collectors.toList());
    }

    return TaskStatisticsVO.builder()
        .taskId(taskId)
        .taskTitle(task.getTitle())
        .totalSubmissions(totalSubmissions)
        .uniqueSubmitters(uniqueSubmittersCount)
        .fileTypeDistribution(fileTypeDistribution)
        .recentSubmissions(recentSubmissions)
        .build();
  }

  @Override
  public CollectionTask getTaskPublic(String taskId) {
    // 使用自定义的 selectByIdString 方法，明确指定 VARCHAR 类型避免 UUID 类型问题
    return taskMapper.selectByIdString(taskId);
  }

  @Override
  public List<com.idropin.domain.vo.FileSubmissionVO> getAllUserTaskSubmissions(String userId) {
    List<CollectionTask> userTasks = getUserTasks(userId);
    List<com.idropin.domain.vo.FileSubmissionVO> allSubmissions = new ArrayList<>();

    for (CollectionTask task : userTasks) {
      try {
        List<com.idropin.domain.vo.FileSubmissionVO> submissions = getTaskSubmissions(task.getId(), userId);
        // 为每个提交记录添加任务信息
        for (com.idropin.domain.vo.FileSubmissionVO vo : submissions) {
          vo.setTaskTitle(task.getTitle());
        }
        allSubmissions.addAll(submissions);
      } catch (Exception e) {
        log.warn("Failed to get submissions for task {}: {}", task.getId(), e.getMessage());
      }
    }

    // 按提交时间倒序排序
    allSubmissions.sort((a, b) -> {
      if (a.getSubmittedAt() == null) return 1;
      if (b.getSubmittedAt() == null) return -1;
      return b.getSubmittedAt().compareTo(a.getSubmittedAt());
    });

    return allSubmissions;
  }

  @Override
  public List<CollectionTask> getDeletedTasks(String userId) {
    // NOTE: 不能用 BaseMapper.selectList（会生成包含不存在列的 SELECT）。
    return taskMapper.selectDeletedByCreatedBy(userId);
  }

  @Override
  @Transactional
  public void restoreTask(String taskId, String userId) {
    // 用自定义 select，避免 MP 默认 SELECT 触发缺列。
    CollectionTask task = taskMapper.selectByIdString(taskId);
    if (task == null) {
      throw new BusinessException("任务不存在");
    }
    
    if (!task.getCreatedBy().equals(userId)) {
      throw new BusinessException("无权限操作此任务");
    }
    
    if (!Boolean.TRUE.equals(task.getDeleted())) {
      throw new BusinessException("任务未在回收站中");
    }

    int affected = taskMapper.restoreByIdAndCreatedBy(task.getId(), userId);
    if (affected <= 0) {
      throw new BusinessException("恢复失败，请重试");
    }
    log.info("Collection task restored from trash: {} by user {}", taskId, userId);
  }

  @Override
  @Transactional
  public void permanentlyDeleteTask(String taskId, String userId) {
    // 用自定义 select，避免 MP 默认 SELECT 触发缺列。
    CollectionTask task = taskMapper.selectByIdString(taskId);
    if (task == null) {
      throw new BusinessException("任务不存在");
    }
    
    if (!task.getCreatedBy().equals(userId)) {
      throw new BusinessException("无权限操作此任务");
    }
    
    if (!Boolean.TRUE.equals(task.getDeleted())) {
      throw new BusinessException("请先将任务移至回收站");
    }
    
    LambdaQueryWrapper<FileSubmission> wrapper = new LambdaQueryWrapper<>();
    wrapper.apply("task_id::text = {0}::text", task.getId());
    submissionMapper.delete(wrapper);

    int affected = taskMapper.deletePermanentlyByIdAndCreatedBy(task.getId(), userId);
    if (affected <= 0) {
      throw new BusinessException("永久删除失败，请重试");
    }
    log.info("Collection task permanently deleted: {} by user {}", taskId, userId);
  }
}
