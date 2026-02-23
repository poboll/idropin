package com.idropin.interfaces.rest;

import com.idropin.application.service.AiGradingService;
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
import org.springframework.beans.factory.annotation.Value;
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
  private final AiGradingService aiGradingService;
  private final com.idropin.infrastructure.persistence.mapper.CollectionTaskMapper collectionTaskMapper;
  private final com.idropin.infrastructure.persistence.mapper.AiEvaluationHistoryMapper aiEvaluationHistoryMapper;

  @Value("${app.backend-url:http://localhost:8081/api}")
  private String backendUrl;

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
    
    String newFilename = file.getOriginalFilename();
    String originalFilename = file.getOriginalFilename();
    String infoString = "";

    if (infoData != null && !infoData.isEmpty()) {
      try {
        com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();
        java.util.LinkedHashMap<String, String> infoMap = objectMapper.readValue(infoData,
            new com.fasterxml.jackson.core.type.TypeReference<java.util.LinkedHashMap<String, String>>() {});
        java.util.List<String> infoValues = new java.util.ArrayList<>();
        for (String value : infoMap.values()) {
          if (value != null && !value.trim().isEmpty()) {
            infoValues.add(value.trim().replaceAll("[\\\\/:*?\"<>|]", "_"));
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

    if (!infoString.isEmpty()) {
      String ext = (originalFilename != null && originalFilename.contains("."))
          ? originalFilename.substring(originalFilename.lastIndexOf('.')) : "";
      newFilename = infoString + ext;
      log.info("File renamed from '{}' to '{}'", originalFilename, newFilename);
    }

    com.idropin.domain.entity.File uploadedFile = fileService.uploadFileForTask(file, userId, taskId, newFilename);
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
        creatorAvatarUrl = (creator.getAvatarUrl() != null && !creator.getAvatarUrl().isBlank())
            ? backendUrl + "/user/avatar/" + creator.getId()
            : null;
        log.info("Creator found: username={}, avatarUrl={}", creatorName, creatorAvatarUrl);
      } else {
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
    result.put("collectionType", task.getCollectionType());
    result.put("requireLogin", task.getRequireLogin() != null && task.getRequireLogin());
    
    log.info("Returning public task info: taskId={}, creatorAvatarUrl={}", taskId, creatorAvatarUrl);
    
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
        item.put("aiStatus", sub.getAiStatus());
        item.put("aiEvaluation", sub.getAiEvaluation());
        item.put("isPlagiarized", sub.getIsPlagiarized());
        item.put("similarToId", sub.getSimilarToId());
        
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

        // AI 批阅字段
        item.put("aiStatus", sub.getAiStatus());
        item.put("aiEvaluation", sub.getAiEvaluation());
        item.put("isPlagiarized", sub.getIsPlagiarized());
        item.put("similarToId", sub.getSimilarToId());
        
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
  @Operation(summary = "导出任务的提交记录（CSV格式，支持AI字段）")
  public void exportInfoSubmissions(
      @PathVariable String taskId,
      @RequestParam(value = "format", defaultValue = "csv") String format,
      @AuthenticationPrincipal UserDetails userDetails,
      jakarta.servlet.http.HttpServletResponse response) throws java.io.IOException {

    String userId = getUserId(userDetails);
    CollectionTask task = taskService.getTask(taskId, userId);

    String dateStr = java.time.LocalDate.now().toString();
    String filename = task.getTitle() + "_提交记录_" + dateStr + ".csv";
    response.setContentType("text/csv;charset=UTF-8");
    response.setHeader("Content-Disposition", "attachment; filename=\"" +
        java.net.URLEncoder.encode(filename, "UTF-8") + "\"");
    response.setCharacterEncoding("UTF-8");

    java.io.PrintWriter writer = response.getWriter();
    writer.write('\uFEFF');

    boolean isFileTask = "FILE".equals(task.getCollectionType());

    if (isFileTask) {
      // FILE类型：导出file_submission，包含AI字段
      List<com.idropin.domain.entity.FileSubmission> fileSubmissions =
        fileSubmissionMapper.selectList(
          new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<com.idropin.domain.entity.FileSubmission>()
            .eq("task_id", taskId)
            .orderByDesc("submitted_at")
        );

      writer.println("提交者,提交时间,文件名,AI评分,完整性,准确性,规范性,创新性,抄袭状态,AI摘要,AI评语");

      com.fasterxml.jackson.databind.ObjectMapper om = new com.fasterxml.jackson.databind.ObjectMapper();
      for (com.idropin.domain.entity.FileSubmission sub : fileSubmissions) {
        java.util.List<String> row = new java.util.ArrayList<>();
        row.add(escapeCsv(sub.getSubmitterName() != null ? sub.getSubmitterName() : ""));
        row.add(escapeCsv(sub.getSubmittedAt() != null ? sub.getSubmittedAt().toString() : ""));

        // 查文件名
        String fname = "";
        if (sub.getFileId() != null) {
          com.idropin.domain.entity.File file = fileMapper.selectById(sub.getFileId());
          if (file != null) fname = file.getOriginalName();
        }
        row.add(escapeCsv(fname));

        // AI字段
        com.idropin.domain.vo.AiEvaluationResult eval = sub.getAiEvaluation();
        if (eval != null && sub.getAiStatus() != null && sub.getAiStatus() == 2) {
          row.add(String.valueOf(eval.getScore() != null ? eval.getScore() : ""));
          java.util.Map<String, Integer> dims = eval.getDimensions();
          row.add(dims != null ? String.valueOf(dims.getOrDefault("完整性", 0)) : "");
          row.add(dims != null ? String.valueOf(dims.getOrDefault("准确性", 0)) : "");
          row.add(dims != null ? String.valueOf(dims.getOrDefault("规范性", 0)) : "");
          row.add(dims != null ? String.valueOf(dims.getOrDefault("创新性", 0)) : "");
          row.add(Boolean.TRUE.equals(sub.getIsPlagiarized()) ? "涉嫌抄袭" : "正常");
          row.add(escapeCsv(eval.getSummary() != null ? eval.getSummary() : ""));
          row.add(escapeCsv(eval.getFeedback() != null ? eval.getFeedback() : ""));
        } else {
          String aiLabel = sub.getAiStatus() != null && sub.getAiStatus() == -1 ? "评估失败" : "待评估";
          row.add(aiLabel);
          row.add(""); row.add(""); row.add(""); row.add("");
          row.add(""); row.add(""); row.add("");
        }
        writer.println(String.join(",", row));
      }
    } else {
      // INFO类型：原有逻辑
      List<TaskSubmission> submissions = taskSubmissionMapper.findAllByTaskKey(taskId);

      java.util.Set<String> allFields = new java.util.LinkedHashSet<>();
      allFields.add("提交者");
      allFields.add("提交时间");
      allFields.add("状态");

      com.fasterxml.jackson.databind.ObjectMapper om = new com.fasterxml.jackson.databind.ObjectMapper();
      for (TaskSubmission sub : submissions) {
        if (sub.getInfoData() != null && !sub.getInfoData().isEmpty()) {
          try {
            java.util.Map<String, String> infoMap = om.readValue(sub.getInfoData(),
                new com.fasterxml.jackson.core.type.TypeReference<java.util.Map<String, String>>() {});
            allFields.addAll(infoMap.keySet());
          } catch (Exception e) {
            log.warn("Failed to parse infoData: {}", e.getMessage());
          }
        }
      }

      writer.println(String.join(",", allFields));

      for (TaskSubmission sub : submissions) {
        java.util.List<String> row = new java.util.ArrayList<>();
        java.util.Map<String, String> infoMap = new java.util.HashMap<>();

        if (sub.getInfoData() != null && !sub.getInfoData().isEmpty()) {
          try {
            infoMap = om.readValue(sub.getInfoData(),
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
          row.add(escapeCsv(value));
        }
        writer.println(String.join(",", row));
      }
    }

    writer.flush();
  }

  private String escapeCsv(String value) {
    if (value == null) return "";
    if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
      return "\"" + value.replace("\"", "\"\"") + "\"";
    }
    return value;
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

  @PutMapping("/{taskId}/submissions/{submissionId}/ai-score")
  @Operation(summary = "教师微调AI评分")
  public Result<Void> overrideAiScore(
      @PathVariable String taskId,
      @PathVariable String submissionId,
      @RequestBody Map<String, Object> body,
      @AuthenticationPrincipal UserDetails userDetails) {

    String userId = getUserId(userDetails);
    CollectionTask task = taskService.getTask(taskId, userId);
    if (task == null) {
      throw new BusinessException("无权操作");
    }

    FileSubmission submission = fileSubmissionMapper.selectByIdString(submissionId);
    if (submission == null || submission.getAiEvaluation() == null) {
      throw new BusinessException("提交记录或AI评估不存在");
    }

    Integer overrideScore = (Integer) body.get("score");
    if (overrideScore == null || overrideScore < 0 || overrideScore > 100) {
      throw new BusinessException("分数需在 0-100 之间");
    }

    com.idropin.domain.vo.AiEvaluationResult eval = submission.getAiEvaluation();
    eval.setScore(overrideScore);

    submission.setAiEvaluation(eval);
    fileSubmissionMapper.updateById(submission);

    log.info("Teacher {} overrode AI score for submission {} to {}", userId, submissionId, overrideScore);
    return Result.success(null);
  }

  @PostMapping("/{taskId}/submissions/{submissionId}/regrade")
  @Operation(summary = "重新AI评分（单条）")
  public Result<Void> regradeSubmission(
      @PathVariable String taskId,
      @PathVariable String submissionId,
      @RequestBody(required = false) Map<String, String> body,
      @AuthenticationPrincipal UserDetails userDetails) {
    String userId = getUserId(userDetails);
    taskService.getTask(taskId, userId);
    String customPrompt = body != null ? body.get("prompt") : null;
    aiGradingService.regradeSubmission(submissionId, customPrompt);
    return Result.success(null);
  }

  @PostMapping("/{taskId}/submissions/batch-regrade")
  @Operation(summary = "批量重新AI评分")
  public Result<Void> batchRegradeSubmissions(
      @PathVariable String taskId,
      @RequestBody Map<String, Object> body,
      @AuthenticationPrincipal UserDetails userDetails) {
    String userId = getUserId(userDetails);
    taskService.getTask(taskId, userId);
    @SuppressWarnings("unchecked")
    List<String> submissionIds = (List<String>) body.get("submissionIds");
    String customPrompt = (String) body.get("prompt");
    if (submissionIds != null) {
      for (String id : submissionIds) {
        aiGradingService.regradeSubmission(id, customPrompt);
      }
    }
    return Result.success(null);
  }

  @GetMapping("/{taskId}/ai-prompt")
  @Operation(summary = "获取任务自定义AI提示词")
  public Result<Map<String, String>> getAiPrompt(
      @PathVariable String taskId,
      @AuthenticationPrincipal UserDetails userDetails) {
    String userId = getUserId(userDetails);
    CollectionTask task = taskService.getTask(taskId, userId);
    return Result.success(Map.of("prompt", task.getAiPrompt() != null ? task.getAiPrompt() : ""));
  }

  @PutMapping("/{taskId}/ai-prompt")
  @Operation(summary = "保存任务自定义AI提示词")
  public Result<Void> saveAiPrompt(
      @PathVariable String taskId,
      @RequestBody Map<String, String> body,
      @AuthenticationPrincipal UserDetails userDetails) {
    String userId = getUserId(userDetails);
    taskService.getTask(taskId, userId);
    com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper<CollectionTask> wrapper =
        new com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper<>();
    wrapper.eq(CollectionTask::getId, taskId).set(CollectionTask::getAiPrompt, body.get("prompt"));
    collectionTaskMapper.update(null, wrapper);
    return Result.success(null);
  }


  @GetMapping("/{taskId}/submissions/{submissionId}/ai-history")
  @Operation(summary = "获取提交的AI评估历史")
  public Result<List<com.idropin.domain.entity.AiEvaluationHistory>> getAiHistory(
      @PathVariable String taskId,
      @PathVariable String submissionId,
      @AuthenticationPrincipal UserDetails userDetails) {
    String userId = getUserId(userDetails);
    taskService.getTask(taskId, userId);
    List<com.idropin.domain.entity.AiEvaluationHistory> history =
        aiEvaluationHistoryMapper.findBySubmissionId(submissionId);
    return Result.success(history);
  }

  @GetMapping("/{taskId}/custom-dimensions")
  @Operation(summary = "获取任务自定义评估维度")
  public Result<List<Map<String, Object>>> getCustomDimensions(
      @PathVariable String taskId,
      @AuthenticationPrincipal UserDetails userDetails) {
    String userId = getUserId(userDetails);
    CollectionTask task = taskService.getTask(taskId, userId);
    return Result.success(task.getCustomDimensions());
  }

  @PutMapping("/{taskId}/custom-dimensions")
  @Operation(summary = "保存任务自定义评估维度")
  public Result<Void> saveCustomDimensions(
      @PathVariable String taskId,
      @RequestBody List<Map<String, Object>> dimensions,
      @AuthenticationPrincipal UserDetails userDetails) {
    String userId = getUserId(userDetails);
    taskService.getTask(taskId, userId);
    String json = dimensions == null || dimensions.isEmpty() ? null
        : new com.fasterxml.jackson.databind.ObjectMapper().valueToTree(dimensions).toString();
    com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper<CollectionTask> wrapper =
        new com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper<>();
    wrapper.eq("id", taskId);
    if (json == null) {
      wrapper.set("custom_dimensions", null);
    } else {
      wrapper.setSql("custom_dimensions = '" + json.replace("'", "''") + "'::jsonb");
    }
    collectionTaskMapper.update(null, wrapper);
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
