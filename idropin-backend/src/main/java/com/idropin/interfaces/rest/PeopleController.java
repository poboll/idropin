package com.idropin.interfaces.rest;

import com.idropin.application.service.PeopleListService;
import com.idropin.common.vo.Result;
import com.idropin.domain.entity.PeopleList;
import com.idropin.domain.entity.CollectionTask;
import com.idropin.infrastructure.persistence.mapper.CollectionTaskMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 人员名单控制器
 */
@Slf4j
@RestController
@RequestMapping("/people")
@RequiredArgsConstructor
public class PeopleController {

    private final PeopleListService peopleListService;
    private final CollectionTaskMapper collectionTaskMapper;

    /**
     * 检查人员是否在名单中
     */
    @GetMapping("/check")
    public Result<Map<String, Object>> checkPeople(
            @RequestParam("key") String taskKey,
            @RequestParam("name") String name) {
        log.info("检查人员是否在名单中: taskKey={}, name={}", taskKey, name);
        
        // 根据任务key获取任务信息
        CollectionTask task = collectionTaskMapper.selectByIdString(taskKey);
        if (task == null) {
            return Result.error(404, "任务不存在");
        }
        
        // 获取任务创建者作为管理员用户名
        String adminUsername = task.getCreatedBy();
        String parentName = task.getTitle(); // 使用任务标题作为父类名称
        String childName = taskKey; // 使用任务key作为子类名称
        
        // 检查人员状态
        PeopleList record = new PeopleList();
        record.setPeopleName(name);
        record.setAdminUsername(adminUsername);
        record.setParentName(parentName);
        record.setChildName(childName);
        
        PeopleList result = peopleListService.checkPeopleStatus(record);
        
        Map<String, Object> data = new HashMap<>();
        if (result != null) {
            data.put("exist", true);
            data.put("status", result.getStatus());
            data.put("lastDate", result.getLastDate());
        } else {
            data.put("exist", false);
        }
        
        return Result.success(data);
    }

    /**
     * 获取人员名单列表
     */
    @GetMapping
    public Result<List<PeopleList>> getPeopleList(
            @RequestParam("key") String taskKey,
            @RequestParam(value = "detail", required = false) String detail) {
        log.info("获取人员名单: taskKey={}", taskKey);
        
        // 根据任务key获取任务信息
        CollectionTask task = collectionTaskMapper.selectByIdString(taskKey);
        if (task == null) {
            return Result.error(404, "任务不存在");
        }
        
        String adminUsername = task.getCreatedBy();
        String parentName = task.getTitle();
        String childName = taskKey;
        
        List<PeopleList> list = peopleListService.getAllDataByAdmin(adminUsername, parentName, childName);
        return Result.success(list);
    }

    /**
     * 删除人员
     */
    @DeleteMapping
    public Result<Void> deletePeople(
            @RequestParam("key") String taskKey,
            @RequestParam("id") String id) {
        log.info("删除人员: taskKey={}, id={}", taskKey, id);
        
        Boolean success = peopleListService.deletePeopleByPrimaryKey(id);
        if (success) {
            return Result.success(null);
        } else {
            return Result.error(500, "删除失败");
        }
    }

    /**
     * 更新人员提交状态
     */
    @PostMapping("/status")
    public Result<Void> updatePeopleStatus(@RequestBody Map<String, String> request) {
        String taskKey = request.get("key");
        String name = request.get("name");
        String filename = request.get("filename");
        String hash = request.get("hash");
        
        log.info("更新人员提交状态: taskKey={}, name={}", taskKey, name);
        
        // 根据任务key获取任务信息
        CollectionTask task = collectionTaskMapper.selectByIdString(taskKey);
        if (task == null) {
            return Result.error(404, "任务不存在");
        }
        
        String adminUsername = task.getCreatedBy();
        String parentName = task.getTitle();
        String childName = taskKey;
        
        // 查找人员记录
        PeopleList record = new PeopleList();
        record.setPeopleName(name);
        record.setAdminUsername(adminUsername);
        record.setParentName(parentName);
        record.setChildName(childName);
        
        PeopleList existing = peopleListService.checkPeopleStatus(record);
        if (existing != null) {
            existing.setStatus(1); // 已提交
            existing.setLastDate(java.time.LocalDateTime.now());
            peopleListService.updatePeopleByPrimary(existing);
        }
        
        return Result.success(null);
    }

    /**
     * 添加人员到名单
     */
    @PostMapping("/add")
    public Result<PeopleList> addPeople(@RequestBody Map<String, String> request) {
        String taskKey = request.get("key");
        String name = request.get("name");
        
        log.info("添加人员到名单: taskKey={}, name={}", taskKey, name);
        
        // 根据任务key获取任务信息
        CollectionTask task = collectionTaskMapper.selectByIdString(taskKey);
        if (task == null) {
            return Result.error(404, "任务不存在");
        }
        
        String adminUsername = task.getCreatedBy();
        String parentName = task.getTitle();
        String childName = taskKey;
        
        boolean success = peopleListService.addPeople(adminUsername, parentName, childName, name);
        if (success) {
            // 返回新添加的人员信息
            PeopleList record = new PeopleList();
            record.setPeopleName(name);
            record.setAdminUsername(adminUsername);
            record.setParentName(parentName);
            record.setChildName(childName);
            PeopleList result = peopleListService.checkPeopleStatus(record);
            return Result.success(result);
        } else {
            return Result.error(400, "人员已存在");
        }
    }
}
