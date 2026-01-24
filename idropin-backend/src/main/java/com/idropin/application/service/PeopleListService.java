package com.idropin.application.service;

import com.idropin.domain.entity.PeopleList;

import java.util.List;

/**
 * 人员名单服务接口
 */
public interface PeopleListService {

  /**
   * 批量添加人员名单
   * 
   * @param adminUsername 管理员账号
   * @param parentName    父类名称
   * @param childName     子类名称
   * @param names         人员姓名列表
   * @return 添加失败的人员名单
   */
  List<String> addPeoples(String adminUsername, String parentName, String childName, List<String> names);

  /**
   * 单个添加人员
   * 
   * @param adminUsername 管理员账号
   * @param parentName    父类名称
   * @param childName     子类名称
   * @param name          人员名称
   * @return 是否已经存在
   */
  boolean addPeople(String adminUsername, String parentName, String childName, String name);

  /**
   * 根据管理员账号、父类名称、子类名称查询人员列表
   * 
   * @param adminUsername 管理员账号
   * @param parentName    父类名称
   * @param childName     子类名称
   * @return 人员列表
   */
  List<PeopleList> getAllDataByAdmin(String adminUsername, String parentName, String childName);

  /**
   * 查询提交用户的状态
   * 
   * @param record 人员记录
   * @return 人员记录
   */
  PeopleList checkPeopleStatus(PeopleList record);

  /**
   * 通过主键更新提交者信息
   * 
   * @param record 最新的记录
   * @return 是否成功
   */
  Boolean updatePeopleByPrimary(PeopleList record);

  /**
   * 通过主键从名单中移除单个人员
   * 
   * @param id 人员ID
   * @return 是否成功
   */
  Boolean deletePeopleByPrimaryKey(String id);
}
