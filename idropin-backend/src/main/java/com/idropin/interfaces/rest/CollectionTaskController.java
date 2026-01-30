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

  @PostMapping("/{taskId}/submit")
  @Operation(summary = "提交文件到任务")
  public Result<FileSubmission> submitFile(
      @PathVariable String taskId,
      @RequestParam("file") MultipartFile file,
      @RequestParam(value = "submitterName", required = false) String submitterName,
      @RequestParam(value = "submitterEmail", required = false) String submitterEmail,
      @AuthenticationPrincipal UserDetails userDetails) {
    
    log.info("Received file submission for task: {}, file: {}, submitterName: {}", 
        taskId, file.getOriginalFilename(), submitterName);
    
    // 验证文件不为空
    if (file.isEmpty()) {
      log.error("File is empty");
      throw new BusinessException("文件不能为空");
    }
    
    String userId = getUserIdOrNull(userDetails);

    // 上传文件到存储
    com.idropin.domain.entity.File uploadedFile = fileService.uploadFile(file, userId);
    log.info("File uploaded successfully with ID: {}", uploadedFile.getId());

    // 创建提交记录
    FileSubmission submission = taskService.submitFile(
        taskId, uploadedFile.getId(), submitterName, submitterEmail, userId);
    
    log.info("File submission created successfully with ID: {}", submission.getId());

    return Result.success(submission);
  }

  @GetMapping("/{taskId}/submissions")
  @Operation(summary = "获取任务的提交记录")
  public Result<List<FileSubmission>> getTaskSubmissions(
      @PathVariable String taskId,
      @AuthenticationPrincipal UserDetails userDetails) {
    String userId = getUserId(userDetails);
    List<FileSubmission> submissions = taskService.getTaskSubmissions(taskId, userId);
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
    
    // 获取创建者用户名
    String creatorName = "";
    if (task.getCreatedBy() != null) {
      com.idropin.domain.entity.User creator = userMapper.selectById(task.getCreatedBy());
      if (creator != null) {
        creatorName = creator.getUsername();
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
