package com.idropin.application.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.idropin.application.service.PeopleListService;
import com.idropin.common.exception.BusinessException;
import com.idropin.domain.entity.PeopleList;
import com.idropin.infrastructure.persistence.mapper.PeopleListMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 人员名单服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PeopleListServiceImpl implements PeopleListService {

  private final PeopleListMapper peopleListMapper;

  @Override
  public List<String> addPeoples(String adminUsername, String parentName, String childName, List<String> names) {
    List<String> failNames = new ArrayList<>();

    for (String name : names) {
      try {
        // 检查是否已存在
        LambdaQueryWrapper<PeopleList> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(PeopleList::getPeopleName, name)
            .eq(PeopleList::getAdminUsername, adminUsername)
            .eq(PeopleList::getParentName, parentName)
            .eq(PeopleList::getChildName, childName);

        if (peopleListMapper.selectCount(wrapper) > 0) {
          failNames.add(name);
          continue;
        }

        // 添加新人员
        PeopleList record = new PeopleList();
        record.setPeopleName(name);
        record.setAdminUsername(adminUsername);
        record.setParentName(parentName);
        record.setChildName(childName);
        record.setStatus(0); // 默认未提交

        peopleListMapper.insert(record);
        log.info("成功添加人员：{}，管理员：{}，父类：{}，子类：{}", name, adminUsername, parentName, childName);
      } catch (Exception e) {
        log.error("添加人员失败：{}，管理员：{}，父类：{}，子类：{}", name, adminUsername, parentName, childName, e);
        failNames.add(name);
      }
    }

    return failNames;
  }

  @Override
  public boolean addPeople(String adminUsername, String parentName, String childName, String name) {
    try {
      // 检查是否已存在
      LambdaQueryWrapper<PeopleList> wrapper = new LambdaQueryWrapper<>();
      wrapper.eq(PeopleList::getPeopleName, name)
          .eq(PeopleList::getAdminUsername, adminUsername)
          .eq(PeopleList::getParentName, parentName)
          .eq(PeopleList::getChildName, childName);

      if (peopleListMapper.selectCount(wrapper) > 0) {
        return false; // 已存在
      }

      // 添加新人员
      PeopleList record = new PeopleList();
      record.setPeopleName(name);
      record.setAdminUsername(adminUsername);
      record.setParentName(parentName);
      record.setChildName(childName);
      record.setStatus(0); // 默认未提交

      peopleListMapper.insert(record);
      log.info("成功添加人员：{}，管理员：{}，父类：{}，子类：{}", name, adminUsername, parentName, childName);
      return true;
    } catch (Exception e) {
      log.error("添加人员失败：{}，管理员：{}，父类：{}，子类：{}", name, adminUsername, parentName, childName, e);
      return false;
    }
  }

  @Override
  public List<PeopleList> getAllDataByAdmin(String adminUsername, String parentName, String childName) {
    return peopleListMapper.selectByAdminAndCategory(adminUsername, parentName, childName);
  }

  @Override
  public PeopleList checkPeopleStatus(PeopleList record) {
    return peopleListMapper.selectByPeopleNameAndAdmin(
        record.getPeopleName(),
        record.getAdminUsername(),
        record.getParentName(),
        record.getChildName());
  }

  @Override
  public Boolean updatePeopleByPrimary(PeopleList record) {
    try {
      int result = peopleListMapper.updateById(record);
      log.info("更新人员状态：{}，状态：{}", record.getPeopleName(), record.getStatus());
      return result > 0;
    } catch (Exception e) {
      log.error("更新人员状态失败：{}", record.getPeopleName(), e);
      return false;
    }
  }

  @Override
  public Boolean deletePeopleByPrimaryKey(String id) {
    try {
      int result = peopleListMapper.deleteById(id);
      log.info("删除人员：{}", id);
      return result > 0;
    } catch (Exception e) {
      log.error("删除人员失败：{}", id, e);
      return false;
    }
  }
}
