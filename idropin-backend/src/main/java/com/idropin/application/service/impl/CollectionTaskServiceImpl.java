package com.idropin.application.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.idropin.application.service.CollectionTaskService;
import com.idropin.application.service.FileService;
import com.idropin.common.exception.BusinessException;
import com.idropin.domain.dto.CreateTaskRequest;
import com.idropin.domain.entity.CollectionTask;
import com.idropin.domain.entity.File;
import com.idropin.domain.entity.FileSubmission;
import com.idropin.domain.vo.TaskStatisticsVO;
import com.idropin.infrastructure.persistence.mapper.CollectionTaskMapper;
import com.idropin.infrastructure.persistence.mapper.FileMapper;
import com.idropin.infrastructure.persistence.mapper.FileSubmissionMapper;
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
    task.setAllowAnonymous(request.getAllowAnonymous() != null ? request.getAllowAnonymous() : false);
    task.setRequireLogin(request.getRequireLogin() != null ? request.getRequireLogin() : true);
    task.setMaxFileSize(request.getMaxFileSize());

    if (request.getAllowedTypes() != null && !request.getAllowedTypes().isEmpty()) {
      task.setAllowedTypes(request.getAllowedTypes().toArray(new String[0]));
    }

    task.setCreatedBy(userId);
    task.setStatus("OPEN");
    task.setCreatedAt(LocalDateTime.now());
    task.setUpdatedAt(LocalDateTime.now());

    taskMapper.insert(task);
    log.info("Collection task created: {} by user {}", task.getTitle(), userId);

    return task;
  }

  @Override
  public List<CollectionTask> getUserTasks(String userId) {
    LambdaQueryWrapper<CollectionTask> wrapper = new LambdaQueryWrapper<>();
    wrapper.eq(CollectionTask::getCreatedBy, userId)
        .orderByDesc(CollectionTask::getCreatedAt);
    return taskMapper.selectList(wrapper);
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
    if (request.getDescription() != null) {
      task.setDescription(request.getDescription());
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
    if (request.getAllowAnonymous() != null) {
      task.setAllowAnonymous(request.getAllowAnonymous());
    }
    if (request.getRequireLogin() != null) {
      task.setRequireLogin(request.getRequireLogin());
    }
    if (request.getMaxFileSize() != null) {
      task.setMaxFileSize(request.getMaxFileSize());
    }
    if (request.getAllowedTypes() != null) {
      task.setAllowedTypes(request.getAllowedTypes().toArray(new String[0]));
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

    LambdaQueryWrapper<FileSubmission> wrapper = new LambdaQueryWrapper<>();
    wrapper.eq(FileSubmission::getTaskId, task.getId());
    submissionMapper.delete(wrapper);

    taskMapper.deleteById(task.getId());
    log.info("Collection task deleted: {} by user {}", taskId, userId);
  }

  @Override
  @Transactional
  public FileSubmission submitFile(String taskId, String fileId, String submitterName,
      String submitterEmail, String submitterId) {
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

    File file = fileMapper.selectById(fileId);
    if (file == null) {
      throw new BusinessException("文件不存在");
    }

    if (task.getMaxFileSize() != null && file.getFileSize() > task.getMaxFileSize()) {
      throw new BusinessException("文件大小超过限制");
    }

    if (task.getAllowedTypes() != null && task.getAllowedTypes().length > 0) {
      boolean allowed = Arrays.stream(task.getAllowedTypes())
          .anyMatch(type -> file.getMimeType().startsWith(type));
      if (!allowed) {
        throw new BusinessException("不支持的文件类型: " + file.getMimeType());
      }
    }

    LambdaQueryWrapper<FileSubmission> wrapper = new LambdaQueryWrapper<>();
    if (submitterId != null) {
      wrapper.eq(FileSubmission::getSubmitterId, submitterId);
    } else {
      wrapper.eq(FileSubmission::getSubmitterEmail, submitterEmail);
    }
    wrapper.eq(FileSubmission::getTaskId, taskId);
    wrapper.eq(FileSubmission::getFileId, fileId);

    if (submissionMapper.selectCount(wrapper) > 0) {
      throw new BusinessException("已提交过此文件");
    }

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

    submissionMapper.insert(submission);
    log.info("File submitted to task: {} by {}", taskId, submitterId != null ? submitterId : submitterEmail);

    return submission;
  }

  @Override
  public List<FileSubmission> getTaskSubmissions(String taskId, String userId) {
    CollectionTask task = getTask(taskId, userId);

    LambdaQueryWrapper<FileSubmission> wrapper = new LambdaQueryWrapper<>();
    wrapper.eq(FileSubmission::getTaskId, taskId)
        .orderByDesc(FileSubmission::getSubmittedAt);

    return submissionMapper.selectList(wrapper);
  }

  @Override
  public TaskStatisticsVO getTaskStatistics(String taskId, String userId) {
    CollectionTask task = getTask(taskId, userId);

    LambdaQueryWrapper<FileSubmission> wrapper = new LambdaQueryWrapper<>();
    wrapper.eq(FileSubmission::getTaskId, taskId);
    List<FileSubmission> submissions = submissionMapper.selectList(wrapper);

    long totalSubmissions = submissions.size();

    Set<String> uniqueSubmitters = submissions.stream()
        .map(sub -> sub.getSubmitterId() != null ? sub.getSubmitterId() : sub.getSubmitterEmail())
        .collect(Collectors.toSet());
    long uniqueSubmittersCount = uniqueSubmitters.size();

    Map<String, Long> fileTypeDistribution = new HashMap<>();
    for (FileSubmission submission : submissions) {
      File file = fileMapper.selectById(submission.getFileId());
      if (file != null) {
        String type = file.getMimeType().split("/")[0];
        fileTypeDistribution.put(type, fileTypeDistribution.getOrDefault(type, 0L) + 1);
      }
    }

    List<TaskStatisticsVO.RecentSubmission> recentSubmissions = submissions.stream()
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
}
