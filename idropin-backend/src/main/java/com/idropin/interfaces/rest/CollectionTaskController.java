package com.idropin.interfaces.rest;

import com.idropin.application.service.CollectionTaskService;
import com.idropin.application.service.FileService;
import com.idropin.common.exception.BusinessException;
import com.idropin.common.vo.Result;
import com.idropin.domain.dto.CreateTaskRequest;
import com.idropin.domain.dto.TaskMoreInfoRequest;
import com.idropin.domain.entity.CollectionTask;
import com.idropin.domain.entity.FileSubmission;
import com.idropin.domain.entity.TaskMoreInfo;
import com.idropin.domain.entity.TaskSubmission;
import com.idropin.domain.vo.TaskStatisticsVO;
import com.idropin.infrastructure.persistence.mapper.TaskMoreInfoMapper;
import com.idropin.infrastructure.security.CustomUserDetails;
import com.idropin.infrastructure.storage.StorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 收集任务控制器
 *
 * @author Idrop.in Team
 */
@Slf4j
@RestController
@RequestMapping("/tasks")
@RequiredArgsConstructor
@Tag(name = "收集任务", description = "收集任务管理相关接口")
public class CollectionTaskController {

  private final CollectionTaskService taskService;
  private final FileService fileService;
  private final StorageService storageService;
  private final TaskMoreInfoMapper taskMoreInfoMapper;
  private final com.idropin.infrastructure.persistence.mapper.UserMapper userMapper;
  private final com.idropin.infrastructure.persistence.mapper.TaskSubmissionMapper taskSubmissionMapper;
  private final com.idropin.infrastructure.persistence.mapper.FileSubmissionMapper fileSubmissionMapper;
  private final com.idropin.infrastructure.persistence.mapper.FileMapper fileMapper;

  @PostMapping
  @Operation(summary = "创建收集任务")
  public Result<CollectionTask> createTask(
      @RequestBody CreateTaskRequest request,
      @AuthenticationPrincipal UserDetails userDetails) {
    try {
      log.info("Received create task request from user: {}", userDetails != null ? userDetails.getUsername() : "null");
      String userId = getUserId(userDetails);
      CollectionTask task = taskService.createTask(request, userId);
      return Result.success(task);
    } catch (Exception e) {
      log.error("Failed to create task", e);
      throw new RuntimeException("创建任务失败: " + e.getMessage());
    }
  }

  @GetMapping
  @Operation(summary = "获取用户的任务列表")
  public Result<List<CollectionTask>> getUserTasks(
      @AuthenticationPrincipal UserDetails userDetails) {
    String userId = getUserId(userDetails);
    List<CollectionTask> tasks = taskService.getUserTasks(userId);
    return Result.success(tasks);
  }

  @GetMapping("/{id}")
  @Operation(summary = "获取任务详情")
  public Result<CollectionTask> getTask(
      @PathVariable String id,
      @AuthenticationPrincipal UserDetails userDetails) {
    String userId = getUserId(userDetails);
    CollectionTask task = taskService.getTask(id, userId);
    return Result.success(task);
  }

  @PutMapping("/{id}")
  @Operation(summary = "更新任务")
  public Result<CollectionTask> updateTask(
      @PathVariable String id,
      @RequestBody CreateTaskRequest request,
      @AuthenticationPrincipal UserDetails userDetails) {
    String userId = getUserId(userDetails);
    CollectionTask task = taskService.updateTask(id, request, userId);
    return Result.success(task);
  }

  @DeleteMapping("/{id}")
  @Operation(summary = "删除任务")
  public Result<Void> deleteTask(
      @PathVariable String id,
      @AuthenticationPrincipal UserDetails userDetails) {
    String userId = getUserId(userDetails);
    taskService.deleteTask(id, userId);
    return Result.success(null);
  }

  @GetMapping("/trash")
  @Operation(summary = "获取回收站任务列表")
  public Result<List<CollectionTask>> getDeletedTasks(
      @AuthenticationPrincipal UserDetails userDetails) {
    String userId = getUserId(userDetails);
    List<CollectionTask> tasks = taskService.getDeletedTasks(userId);
    return Result.success(tasks);
  }

  @PostMapping("/{id}/restore")
  @Operation(summary = "恢复任务")
  public Result<Void> restoreTask(
      @PathVariable String id,
      @AuthenticationPrincipal UserDetails userDetails) {
    String userId = getUserId(userDetails);
    taskService.restoreTask(id, userId);
    return Result.success(null);
  }

  @DeleteMapping("/{id}/permanent")
  @Operation(summary = "永久删除任务")
  public Result<Void> permanentlyDeleteTask(
      @PathVariable String id,
      @AuthenticationPrincipal UserDetails userDetails) {
    String userId = getUserId(userDetails);
    taskService.permanentlyDeleteTask(id, userId);
    return Result.success(null);
  }

  @PostMapping("/{taskId}/submit")
  @Operation(summary = "提交文件到任务")
  public Result<Map<String, Object>> submitFile(
      @PathVariable String taskId,
      @RequestParam("file") MultipartFile file,
      @RequestParam(value = "submitterName", required = false) String submitterName,
      @RequestParam(value = "submitterEmail", required = false) String submitterEmail,
      @RequestParam(value = "infoData", required = false) String infoData,
      @AuthenticationPrincipal UserDetails userDetails,
      jakarta.servlet.http.HttpServletRequest request) {
    
    log.info("Received file submission for task: {}, file: {}, submitterName: {}, infoData: {}", 
        taskId, file.getOriginalFilename(), submitterName, infoData);
    
    // 获取客户端IP地址
    String clientIp = com.idropin.common.util.IpUtil.getClientIp(request);
    log.info("Client IP: {}", clientIp);
    
    // 验证文件不为空
    if (file.isEmpty()) {
      log.error("File is empty");
      throw new BusinessException("文件不能为空");
    }
    
    String userId = getUserIdOrNull(userDetails);
    
    // 获取任务信息
    CollectionTask task = taskService.getTaskPublic(taskId);
    if (task == null) {
      throw new BusinessException("任务不存在");
    }
    
    // 获取任务更多信息
    TaskMoreInfo moreInfo = taskMoreInfoMapper.selectByTaskId(taskId);
    
    // 计算新文件名（如果需要重命名）
    String newFilename = file.getOriginalFilename();
    
    if (moreInfo != null && (Boolean.TRUE.equals(moreInfo.getRewrite()) || Boolean.TRUE.equals(moreInfo.getAutoRename()))) {
      String originalFilename = file.getOriginalFilename();

      // 解析必填信息，用于构建新文件名
      String infoString = "";
      if (infoData != null && !infoData.isEmpty()) {
        try {
          // 解析JSON格式的infoData（使用LinkedHashMap保持字段顺序）
          com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();
          java.util.LinkedHashMap<String, String> infoMap = objectMapper.readValue(infoData,
              new com.fasterxml.jackson.core.type.TypeReference<java.util.LinkedHashMap<String, String>>() {});

          // 按顺序拼接必填信息的值（如：学号_姓名）
          java.util.List<String> infoValues = new java.util.ArrayList<>();
          for (String value : infoMap.values()) {
            if (value != null && !value.trim().isEmpty()) {
              // 替换文件名中的非法字符
              String cleanValue = value.trim().replaceAll("[\\\\/:*?\"<>|]", "_");
              infoValues.add(cleanValue);
            }
          }
          infoString = String.join("_", infoValues);
        } catch (Exception e) {
          log.warn("Failed to parse infoData: {}", e.getMessage());
          infoString = submitterName != null ? submitterName.replaceAll("[\\\\/:*?\"<>|]", "_") : "";
        }
      } else if (submitterName != null && !submitterName.isEmpty()) {
        infoString = submitterName.replaceAll("[\\\\/:*?\"<>|]", "_");
      }

      // 提取文件扩展名
      String fileExtension = "";
      int lastDotIndex = originalFilename.lastIndexOf('.');
      if (lastDotIndex > 0) {
        fileExtension = originalFilename.substring(lastDotIndex);
      }

      // 构建新文件名：必填信息.扩展名（如：202206120174_成志良.zip）
      if (!infoString.isEmpty()) {
        newFilename = infoString + fileExtension;
      } else {
        // 如果没有必填信息，保留原文件名
        newFilename = originalFilename;
      }

      log.info("File will be renamed from '{}' to '{}'", originalFilename, newFilename);
    }

    // 上传文件到存储（传递新文件名）
    com.idropin.domain.entity.File uploadedFile = fileService.uploadFileWithCustomName(file, userId, newFilename);
    log.info("File uploaded successfully with ID: {} and name: {}", uploadedFile.getId(), uploadedFile.getOriginalName());

    // 创建提交记录
    FileSubmission submission = taskService.submitFile(
        taskId, uploadedFile.getId(), submitterName, submitterEmail, userId, clientIp);
    
    log.info("File submission created successfully with ID: {}", submission.getId());

    // 构建响应，包含提交ID和重命名后的文件名
    java.util.Map<String, Object> response = new java.util.HashMap<>();
    response.put("id", submission.getId());
    response.put("submitterName", submission.getSubmitterName());
    response.put("submittedAt", submission.getSubmittedAt());
    response.put("fileName", uploadedFile.getOriginalName());
    response.put("originalFileName", file.getOriginalFilename());
    
    return Result.success(response);
  }

  @PostMapping("/{taskId}/submit-info")
  @Operation(summary = "提交信息到任务（仅信息收集类型）")
  public Result<Map<String, Object>> submitInfo(
      @PathVariable String taskId,
      @RequestParam(value = "submitterName", required = false) String submitterName,
      @RequestParam(value = "submitterEmail", required = false) String submitterEmail,
      @RequestParam(value = "infoData", required = false) String infoData,
      @AuthenticationPrincipal UserDetails userDetails,
      jakarta.servlet.http.HttpServletRequest request) {
    
    log.info("Received info submission for task: {}, submitterName: {}", taskId, submitterName);
    
    // 获取客户端IP地址
    String clientIp = com.idropin.common.util.IpUtil.getClientIp(request);
    log.info("Client IP: {}", clientIp);
    
    // 验证任务存在且为INFO类型
    CollectionTask task = taskService.getTaskPublic(taskId);
    if (task == null) {
      throw new BusinessException("任务不存在");
    }
    
    if (!"INFO".equals(task.getCollectionType())) {
      throw new BusinessException("此任务不是信息收集类型");
    }
    
    String userId = getUserIdOrNull(userDetails);
    
    // 创建一个信息提交记录（使用TaskSubmission表）
    TaskSubmission submission = new TaskSubmission();
    submission.setTaskKey(taskId);
    submission.setSubmitterName(submitterName);
    submission.setSubmitterEmail(submitterEmail);
    submission.setInfoData(infoData); // 存储JSON格式的表单信息
    submission.setSubmittedAt(LocalDateTime.now());
    submission.setStatus(0); // 0-已提交
    submission.setSubmitterIp(clientIp); // 记录IP地址
    
    taskSubmissionMapper.insert(submission);
    
    log.info("Info submission created successfully with ID: {}", submission.getId());
    
    Map<String, Object> result = new HashMap<>();
    result.put("id", submission.getId());
    result.put("message", "信息提交成功");
    
    return Result.success(result);
  }

  @GetMapping("/{taskId}/submissions")
  @Operation(summary = "获取任务的提交记录")
  public Result<List<com.idropin.domain.vo.FileSubmissionVO>> getTaskSubmissions(
      @PathVariable String taskId,
      @AuthenticationPrincipal UserDetails userDetails) {
    String userId = getUserId(userDetails);
    List<com.idropin.domain.vo.FileSubmissionVO> submissions = taskService.getTaskSubmissions(taskId, userId);
    return Result.success(submissions);
  }

  @GetMapping("/all-submissions")
  @Operation(summary = "获取用户所有任务的提交记录")
  public Result<List<com.idropin.domain.vo.FileSubmissionVO>> getAllUserTaskSubmissions(
      @AuthenticationPrincipal UserDetails userDetails) {
    String userId = getUserId(userDetails);
    List<com.idropin.domain.vo.FileSubmissionVO> submissions = taskService.getAllUserTaskSubmissions(userId);
    return Result.success(submissions);
  }

  @GetMapping("/{taskId}/statistics")
  @Operation(summary = "获取任务统计")
  public Result<TaskStatisticsVO> getTaskStatistics(
      @PathVariable String taskId,
      @AuthenticationPrincipal UserDetails userDetails) {
    String userId = getUserId(userDetails);
    TaskStatisticsVO statistics = taskService.getTaskStatistics(taskId, userId);
    return Result.success(statistics);
  }

  @GetMapping("/{taskId}/more-info")
  @Operation(summary = "获取任务更多信息")
  public Result<Map<String, Object>> getTaskMoreInfo(
      @PathVariable String taskId,
      @AuthenticationPrincipal UserDetails userDetails) {
    String userId = getUserId(userDetails);
    
    // 验证用户有权限访问此任务
    taskService.getTask(taskId, userId);
    
    // 查询更多信息
    TaskMoreInfo moreInfo = taskMoreInfoMapper.selectByTaskId(taskId);
    
    Map<String, Object> result = new HashMap<>();
    if (moreInfo != null) {
      result.put("ddl", moreInfo.getDdl());
      result.put("tip", moreInfo.getTip());
      result.put("info", moreInfo.getInfo());
      result.put("people", moreInfo.getPeople());
      result.put("format", moreInfo.getFormat());
      result.put("template", moreInfo.getTemplate());
      result.put("bindField", moreInfo.getBindField());
      result.put("rewrite", moreInfo.getRewrite());
    }
    
    return Result.success(result);
  }

  @PostMapping("/{taskId}/more-info")
  @Operation(summary = "更新任务更多信息")
  public Result<Void> updateTaskMoreInfo(
      @PathVariable String taskId,
      @RequestBody TaskMoreInfoRequest request,
      @AuthenticationPrincipal UserDetails userDetails) {
    String userId = getUserId(userDetails);
    
    // 验证用户有权限访问此任务
    taskService.getTask(taskId, userId);
    
    // 查询是否已存在
    TaskMoreInfo existing = taskMoreInfoMapper.selectByTaskId(taskId);
    
    if (existing != null) {
      // 更新 - 手动设置字段以避免覆盖taskId
      existing.setDdl(request.getDdl());
      existing.setTip(request.getTip());
      existing.setInfo(request.getInfo());
      existing.setPeople(request.getPeople());
      existing.setFormat(request.getFormat());
      existing.setTemplate(request.getTemplate());
      existing.setBindField(request.getBindField());
      existing.setRewrite(request.getRewrite());
      existing.setUpdatedAt(LocalDateTime.now());
      taskMoreInfoMapper.updateByTaskId(existing);
    } else {
      // 创建
      TaskMoreInfo moreInfo = new TaskMoreInfo();
      BeanUtils.copyProperties(request, moreInfo);
      moreInfo.setTaskId(taskId);
      moreInfo.setCreatedAt(LocalDateTime.now());
      moreInfo.setUpdatedAt(LocalDateTime.now());
      taskMoreInfoMapper.insert(moreInfo);
    }
    
    return Result.success(null);
  }

  @GetMapping("/{taskId}/info")
  @Operation(summary = "获取任务基本信息")
  public Result<CollectionTask> getTaskInfo(
      @PathVariable String taskId,
      @AuthenticationPrincipal UserDetails userDetails) {
    String userId = getUserId(userDetails);
    CollectionTask task = taskService.getTask(taskId, userId);
    return Result.success(task);
  }

  @GetMapping("/{taskId}/public-info")
  @Operation(summary = "获取任务基本信息（公开接口，用于收集链接）")
  public Result<Map<String, Object>> getPublicTaskInfo(@PathVariable String taskId) {
    CollectionTask task = taskService.getTaskPublic(taskId);
    if (task == null) {
      return Result.error(4001, "任务不存在");
    }
    
    // 获取创建者用户名和头像
    String creatorName = "";
    String creatorAvatarUrl = null;
    if (task.getCreatedBy() != null) {
      com.idropin.domain.entity.User creator = userMapper.selectById(task.getCreatedBy());
      if (creator != null) {
        creatorName = creator.getUsername();
        creatorAvatarUrl = creator.getAvatarUrl();
        System.out.println("DEBUG: Creator found - username: " + creatorName + ", avatarUrl: " + creatorAvatarUrl);
        log.info("Creator found: username={}, avatarUrl={}", creatorName, creatorAvatarUrl);
      } else {
        System.out.println("DEBUG: Creator not found for task: " + taskId);
        log.warn("Creator not found for task: {}, createdBy={}", taskId, task.getCreatedBy());
      }
    }
    
    Map<String, Object> result = new HashMap<>();
    result.put("id", task.getId());
    result.put("title", task.getTitle());
    result.put("description", task.getDescription());
    result.put("status", task.getStatus());
    result.put("deadline", task.getDeadline());
    result.put("createdBy", task.getCreatedBy());
    result.put("creatorName", creatorName);
    result.put("creatorAvatarUrl", creatorAvatarUrl);
    result.put("collectionType", task.getCollectionType()); // 添加收集类型
    
    System.out.println("DEBUG: Returning creatorAvatarUrl: " + creatorAvatarUrl);
    log.info("Returning public task info: creatorAvatarUrl={}", creatorAvatarUrl);
    
    return Result.success(result);
  }

  @GetMapping("/{taskId}/public-more-info")
  @Operation(summary = "获取任务更多信息（公开接口，用于收集链接）")
  public Result<Map<String, Object>> getPublicTaskMoreInfo(@PathVariable String taskId) {
    // 先验证任务存在
    CollectionTask task = taskService.getTaskPublic(taskId);
    if (task == null) {
      return Result.error(4001, "任务不存在");
    }
    
    // 查询更多信息
    TaskMoreInfo moreInfo = taskMoreInfoMapper.selectByTaskId(taskId);
    
    Map<String, Object> result = new HashMap<>();
    if (moreInfo != null) {
      result.put("ddl", moreInfo.getDdl());
      result.put("tip", moreInfo.getTip());
      result.put("info", moreInfo.getInfo());
      result.put("people", moreInfo.getPeople());
      result.put("format", moreInfo.getFormat());
      result.put("template", moreInfo.getTemplate());
      result.put("bindField", moreInfo.getBindField());
      result.put("rewrite", moreInfo.getRewrite());
    }
    
    return Result.success(result);
  }

  @GetMapping("/{taskId}/template")
  @Operation(summary = "获取任务模板")
  public Result<Map<String, Object>> getTaskTemplate(
      @PathVariable String taskId,
      @AuthenticationPrincipal UserDetails userDetails) {
    String userId = getUserId(userDetails);
    
    // 验证用户有权限访问此任务
    taskService.getTask(taskId, userId);
    
    // 查询模板信息
    TaskMoreInfo moreInfo = taskMoreInfoMapper.selectByTaskId(taskId);
    
    Map<String, Object> result = new HashMap<>();
    if (moreInfo != null && moreInfo.getTemplate() != null) {
      result.put("template", moreInfo.getTemplate());
    }
    
    return Result.success(result);
  }

  @GetMapping("/{taskKey}/task-submissions")
  @Operation(summary = "获取任务的公开提交记录（通过taskKey）")
  public Result<java.util.Map<String, Object>> getTaskSubmissionsByKey(
      @PathVariable String taskKey,
      @AuthenticationPrincipal UserDetails userDetails) {
    
    log.info("Getting task submissions for taskKey: {}", taskKey);
    
    // 验证用户有权限访问此任务（taskKey就是taskId）
    String userId = getUserId(userDetails);
    CollectionTask task = taskService.getTask(taskKey, userId);
    
    // 查询task_submission表（旧的提交记录）
    List<TaskSubmission> taskSubmissions = taskSubmissionMapper.findAllByTaskKey(taskKey);
    
    // 查询file_submission表（新的提交记录）
    List<com.idropin.domain.entity.FileSubmission> fileSubmissions = 
      fileSubmissionMapper.selectList(
        new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<com.idropin.domain.entity.FileSubmission>()
          .eq("task_id", taskKey)
          .orderByDesc("submitted_at")
      );
    
    // 合并两个表的数据
    java.util.Map<String, Object> result = new java.util.HashMap<>();
    result.put("taskSubmissions", taskSubmissions);
    result.put("fileSubmissions", fileSubmissions);
    result.put("totalCount", taskSubmissions.size() + fileSubmissions.size());
    
    log.info("Found {} task_submissions and {} file_submissions for taskKey: {}", 
      taskSubmissions.size(), fileSubmissions.size(), taskKey);
    
    return Result.success(result);
  }

  @GetMapping("/{taskId}/public-submissions")
  @Operation(summary = "获取任务的公开提交记录（通过提交者姓名查询）")
  public Result<Map<String, Object>> getPublicSubmissions(
      @PathVariable String taskId,
      @RequestParam(value = "submitterName", required = true) String submitterName) {

    log.info("Getting public submissions for taskId: {}, submitterName: {}", taskId, submitterName);

    // 验证任务存在
    CollectionTask task = taskService.getTaskPublic(taskId);
    if (task == null) {
      return Result.error(4001, "任务不存在");
    }

    List<Map<String, Object>> submissionList = new java.util.ArrayList<>();
    int totalCount = 0;

    // 根据任务类型查询不同的表
    if ("FILE".equals(task.getCollectionType())) {
      // 文件收集任务：查询 file_submission 表
      log.info("Querying file_submission table for FILE collection task");
      
      List<com.idropin.domain.entity.FileSubmission> fileSubmissions = 
        fileSubmissionMapper.selectList(
          new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<com.idropin.domain.entity.FileSubmission>()
            .eq("task_id", taskId)
            .eq("submitter_name", submitterName)
            .orderByDesc("submitted_at")
        );
      
      totalCount = fileSubmissions.size();
      
      for (com.idropin.domain.entity.FileSubmission sub : fileSubmissions) {
        Map<String, Object> item = new HashMap<>();
        item.put("id", sub.getId());
        item.put("submitterName", sub.getSubmitterName());
        item.put("submittedAt", sub.getSubmittedAt());
        item.put("submitterIp", sub.getSubmitterIp());
        item.put("status", 0); // file_submission 没有 status 字段，默认为已提交
        
        // 查询文件信息
        if (sub.getFileId() != null) {
          com.idropin.domain.entity.File file = fileMapper.selectById(sub.getFileId());
          if (file != null) {
            item.put("fileName", file.getOriginalName());
            item.put("fileSize", file.getFileSize());
          }
        }
        
        submissionList.add(item);
      }
      
      log.info("Found {} file submissions for submitterName: {}", totalCount, submitterName);
      
    } else {
      // 信息收集任务：查询 task_submission 表
      log.info("Querying task_submission table for INFO collection task");
      
      List<TaskSubmission> taskSubmissions = taskSubmissionMapper.findByTaskKeyAndSubmitterName(taskId, submitterName);
      totalCount = taskSubmissions.size();
      
      for (TaskSubmission sub : taskSubmissions) {
        Map<String, Object> item = new HashMap<>();
        item.put("id", sub.getId());
        item.put("submitterName", sub.getSubmitterName());
        item.put("submitterEmail", sub.getSubmitterEmail());
        item.put("submittedAt", sub.getSubmittedAt());
        item.put("infoData", sub.getInfoData());
        item.put("fileName", sub.getFileName());
        item.put("fileSize", sub.getFileSize());
        item.put("status", sub.getStatus());
        item.put("submitterIp", sub.getSubmitterIp());
        submissionList.add(item);
      }
      
      log.info("Found {} task submissions for submitterName: {}", totalCount, submitterName);
    }

    Map<String, Object> result = new HashMap<>();
    result.put("submissions", submissionList);
    result.put("count", totalCount);
    result.put("taskTitle", task.getTitle());
    result.put("collectionType", task.getCollectionType());

    return Result.success(result);
  }

  @GetMapping("/{taskId}/info-submissions")
  @Operation(summary = "获取任务的信息提交记录（管理员）")
  public Result<Map<String, Object>> getInfoSubmissions(
      @PathVariable String taskId,
      @AuthenticationPrincipal UserDetails userDetails) {

    String userId = getUserId(userDetails);

    // 验证用户有权限访问此任务
    CollectionTask task = taskService.getTask(taskId, userId);

    List<Map<String, Object>> submissionList = new java.util.ArrayList<>();
    int totalCount = 0;

    // 根据任务类型查询不同的表
    if ("FILE".equals(task.getCollectionType())) {
      // 文件收集任务：查询 file_submission 表
      log.info("Querying file_submission table for FILE collection task (admin)");
      
      List<com.idropin.domain.entity.FileSubmission> fileSubmissions = 
        fileSubmissionMapper.selectList(
          new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<com.idropin.domain.entity.FileSubmission>()
            .eq("task_id", taskId)
            .orderByDesc("submitted_at")
        );
      
      totalCount = fileSubmissions.size();
      
      for (com.idropin.domain.entity.FileSubmission sub : fileSubmissions) {
        Map<String, Object> item = new HashMap<>();
        item.put("id", sub.getId());
        item.put("submitterName", sub.getSubmitterName());
        item.put("submitterEmail", sub.getSubmitterEmail());
        item.put("submittedAt", sub.getSubmittedAt());
        item.put("submitterIp", sub.getSubmitterIp());
        item.put("status", 0); // file_submission 没有 status 字段，默认为已提交
        item.put("infoData", "{}"); // 文件收集任务没有infoData
        item.put("createdAt", sub.getCreatedAt());
        
        // 查询文件信息
        if (sub.getFileId() != null) {
          item.put("fileId", sub.getFileId());
          com.idropin.domain.entity.File file = fileMapper.selectById(sub.getFileId());
          if (file != null) {
            item.put("fileName", file.getOriginalName());
            item.put("fileSize", file.getFileSize());
          }
        }
        
        submissionList.add(item);
      }
      
      log.info("Found {} file submissions for admin view", totalCount);
      
    } else {
      // 信息收集任务：查询 task_submission 表
      log.info("Querying task_submission table for INFO collection task (admin)");
      
      List<TaskSubmission> taskSubmissions = taskSubmissionMapper.findAllByTaskKey(taskId);
      totalCount = taskSubmissions.size();
      
      for (TaskSubmission sub : taskSubmissions) {
        Map<String, Object> item = new HashMap<>();
        item.put("id", sub.getId());
        item.put("submitterName", sub.getSubmitterName());
        item.put("submitterEmail", sub.getSubmitterEmail());
        item.put("submittedAt", sub.getSubmittedAt());
        item.put("infoData", sub.getInfoData());
        item.put("fileName", sub.getFileName());
        item.put("fileSize", sub.getFileSize());
        item.put("status", sub.getStatus());
        item.put("createdAt", sub.getCreatedAt());
        item.put("submitterIp", sub.getSubmitterIp());
        submissionList.add(item);
      }
      
      log.info("Found {} task submissions for admin view", totalCount);
    }

    Map<String, Object> result = new HashMap<>();
    result.put("submissions", submissionList);
    result.put("count", totalCount);
    result.put("taskTitle", task.getTitle());
    result.put("collectionType", task.getCollectionType());

    return Result.success(result);
  }

  @GetMapping("/{taskId}/info-submissions/export")
  @Operation(summary = "导出任务的信息提交记录（CSV格式）")
  public void exportInfoSubmissions(
      @PathVariable String taskId,
      @RequestParam(value = "format", defaultValue = "csv") String format,
      @AuthenticationPrincipal UserDetails userDetails,
      jakarta.servlet.http.HttpServletResponse response) throws java.io.IOException {

    String userId = getUserId(userDetails);

    // 验证用户有权限访问此任务
    CollectionTask task = taskService.getTask(taskId, userId);

    // 查询所有信息提交记录
    List<TaskSubmission> submissions = taskSubmissionMapper.findAllByTaskKey(taskId);

    // 生成文件名：任务名称_提交记录_年-月-日
    String dateStr = java.time.LocalDate.now().toString(); // 格式：2026-02-02
    String filename = task.getTitle() + "_提交记录_" + dateStr + ".csv";
    response.setContentType("text/csv;charset=UTF-8");
    response.setHeader("Content-Disposition", "attachment; filename=\"" +
        java.net.URLEncoder.encode(filename, "UTF-8") + "\"");
    response.setCharacterEncoding("UTF-8");

    java.io.PrintWriter writer = response.getWriter();
    
    // 写入BOM以支持Excel正确识别UTF-8
    writer.write('\uFEFF');

    // 收集所有可能的字段名
    java.util.Set<String> allFields = new java.util.LinkedHashSet<>();
    allFields.add("提交者");
    allFields.add("提交时间");
    allFields.add("状态");

    for (TaskSubmission sub : submissions) {
      if (sub.getInfoData() != null && !sub.getInfoData().isEmpty()) {
        try {
          com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();
          java.util.Map<String, String> infoMap = objectMapper.readValue(sub.getInfoData(),
              new com.fasterxml.jackson.core.type.TypeReference<java.util.Map<String, String>>() {});
          allFields.addAll(infoMap.keySet());
        } catch (Exception e) {
          log.warn("Failed to parse infoData: {}", e.getMessage());
        }
      }
    }

    // 写入表头
    writer.println(String.join(",", allFields));

    // 写入数据行
    for (TaskSubmission sub : submissions) {
      java.util.List<String> row = new java.util.ArrayList<>();
      java.util.Map<String, String> infoMap = new java.util.HashMap<>();

      if (sub.getInfoData() != null && !sub.getInfoData().isEmpty()) {
        try {
          com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();
          infoMap = objectMapper.readValue(sub.getInfoData(),
              new com.fasterxml.jackson.core.type.TypeReference<java.util.Map<String, String>>() {});
        } catch (Exception e) {
          log.warn("Failed to parse infoData: {}", e.getMessage());
        }
      }

      for (String field : allFields) {
        String value = "";
        if ("提交者".equals(field)) {
          value = sub.getSubmitterName() != null ? sub.getSubmitterName() : "";
        } else if ("提交时间".equals(field)) {
          value = sub.getSubmittedAt() != null ? sub.getSubmittedAt().toString() : "";
        } else if ("状态".equals(field)) {
          value = sub.getStatus() == 0 ? "已提交" : "已撤回";
        } else {
          value = infoMap.getOrDefault(field, "");
        }
        // 处理CSV特殊字符
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
          value = "\"" + value.replace("\"", "\"\"") + "\"";
        }
        row.add(value);
      }
      writer.println(String.join(",", row));
    }

    writer.flush();
  }

  @PostMapping("/{taskId}/info-submissions/{submissionId}/withdraw")
  @Operation(summary = "撤回信息提交（公开接口）")
  public Result<Void> withdrawInfoSubmission(
      @PathVariable String taskId,
      @PathVariable String submissionId,
      @RequestParam(value = "submitterName", required = true) String submitterName) {

    log.info("Withdrawing info submission: taskId={}, submissionId={}, submitterName={}",
        taskId, submissionId, submitterName);

    // 验证任务存在
    CollectionTask task = taskService.getTaskPublic(taskId);
    if (task == null) {
      throw new BusinessException("任务不存在");
    }

    // 查询提交记录
    TaskSubmission submission = taskSubmissionMapper.selectById(submissionId);
    if (submission == null) {
      throw new BusinessException("提交记录不存在");
    }

    // 验证是否为同一提交者
    if (!submitterName.equals(submission.getSubmitterName())) {
      throw new BusinessException("只能撤回自己的提交");
    }

    // 验证是否已经撤回
    if (submission.getStatus() == 1) {
      throw new BusinessException("该提交已经撤回");
    }

    // 更新状态为已撤回
    submission.setStatus(1);
    submission.setUpdatedAt(LocalDateTime.now());
    taskSubmissionMapper.updateById(submission);

    log.info("Info submission withdrawn successfully: {}", submissionId);

    return Result.success(null);
  }

  @PostMapping("/{taskId}/submissions/{submissionId}/withdraw")
  @Operation(summary = "撤回提交（公开接口，支持文件和信息收集）")
  public Result<Void> withdrawSubmission(
      @PathVariable String taskId,
      @PathVariable String submissionId,
      @RequestParam(value = "submitterName", required = true) String submitterName) {

    log.info("Withdrawing submission: taskId={}, submissionId={}, submitterName={}",
        taskId, submissionId, submitterName);

    // 验证任务存在
    CollectionTask task = taskService.getTaskPublic(taskId);
    if (task == null) {
      throw new BusinessException("任务不存在");
    }

    // 根据任务类型处理撤回
    if ("FILE".equals(task.getCollectionType())) {
      // 文件收集任务：从 file_submission 表删除记录
      log.info("Withdrawing file submission from file_submission table");
      
      // 使用自定义方法查询，处理UUID类型转换
      com.idropin.domain.entity.FileSubmission fileSubmission = fileSubmissionMapper.selectByIdString(submissionId);
      
      if (fileSubmission == null) {
        throw new BusinessException("未找到可撤回的提交记录，可能已被撤回或不存在");
      }

      // 验证是否为同一提交者
      if (!submitterName.equals(fileSubmission.getSubmitterName())) {
        throw new BusinessException("只能撤回自己的提交");
      }

      // 使用自定义方法删除记录
      int deletedRows = fileSubmissionMapper.deleteByIdString(submissionId);
      
      if (deletedRows > 0) {
        log.info("File submission withdrawn successfully: {}", submissionId);
      } else {
        throw new BusinessException("撤回失败，请重试");
      }
      
    } else {
      // 信息收集任务：更新 task_submission 表的状态
      log.info("Withdrawing info submission from task_submission table");
      
      TaskSubmission taskSubmission = taskSubmissionMapper.selectById(submissionId);
      if (taskSubmission == null) {
        throw new BusinessException("未找到可撤回的提交记录，可能已被撤回或不存在");
      }

      // 验证是否为同一提交者
      if (!submitterName.equals(taskSubmission.getSubmitterName())) {
        throw new BusinessException("只能撤回自己的提交");
      }

      // 验证是否已经撤回
      if (taskSubmission.getStatus() == 1) {
        throw new BusinessException("该提交已经撤回");
      }

      // 更新状态为已撤回
      taskSubmission.setStatus(1);
      taskSubmission.setUpdatedAt(LocalDateTime.now());
      taskSubmissionMapper.updateById(taskSubmission);
      
      log.info("Info submission withdrawn successfully: {}", submissionId);
    }

    return Result.success(null);
  }

  @DeleteMapping("/{taskId}/submissions/{submissionId}/admin")
  @Operation(summary = "管理员删除提交记录")
  public Result<Void> adminDeleteSubmission(
      @PathVariable String taskId,
      @PathVariable String submissionId,
      @AuthenticationPrincipal UserDetails userDetails) {

    String userId = getUserId(userDetails);
    CollectionTask task = taskService.getTask(taskId, userId);
    if (task == null) {
      throw new BusinessException("无权操作");
    }

    TaskSubmission submission = taskSubmissionMapper.selectById(submissionId);
    if (submission == null) {
      throw new BusinessException("提交记录不存在");
    }

    taskSubmissionMapper.deleteById(submissionId);
    log.info("Admin deleted submission: {}", submissionId);
    return Result.success(null);
  }

  @PutMapping("/{taskId}/submissions/{submissionId}/admin")
  @Operation(summary = "管理员编辑提交记录")
  public Result<Void> adminEditSubmission(
      @PathVariable String taskId,
      @PathVariable String submissionId,
      @RequestBody Map<String, String> body,
      @AuthenticationPrincipal UserDetails userDetails) {

    String userId = getUserId(userDetails);
    CollectionTask task = taskService.getTask(taskId, userId);
    if (task == null) {
      throw new BusinessException("无权操作");
    }

    TaskSubmission submission = taskSubmissionMapper.selectById(submissionId);
    if (submission == null) {
      throw new BusinessException("提交记录不存在");
    }

    String infoData = body.get("infoData");
    if (infoData != null) {
      submission.setInfoData(infoData);
      submission.setUpdatedAt(LocalDateTime.now());
      taskSubmissionMapper.updateById(submission);
      log.info("Admin edited submission: {}", submissionId);
    }

    return Result.success(null);
  }

  private String getUserId(UserDetails userDetails) {
    if (userDetails == null) {
      log.error("UserDetails is null");
      throw new IllegalStateException("用户未登录");
    }
    if (userDetails instanceof CustomUserDetails) {
      return ((CustomUserDetails) userDetails).getUserId();
    }
    log.error("Invalid user details type: {}", userDetails.getClass().getName());
    throw new IllegalStateException("Invalid user details type: " + userDetails.getClass().getName());
  }

  private String getUserIdOrNull(UserDetails userDetails) {
    if (userDetails instanceof CustomUserDetails) {
      return ((CustomUserDetails) userDetails).getUserId();
    }
    return null;
  }
}
