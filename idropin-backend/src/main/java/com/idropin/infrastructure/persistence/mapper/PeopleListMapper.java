package com.idropin.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.idropin.domain.entity.PeopleList;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 人员名单Mapper
 */
@Mapper
public interface PeopleListMapper extends BaseMapper<PeopleList> {

  /**
   * 根据管理员账号、父类名称、子类名称查询人员列表
   */
  @Select("SELECT * FROM people_list WHERE admin_username = #{adminUsername} AND parent_name = #{parentName} AND child_name = #{childName}")
  List<PeopleList> selectByAdminAndCategory(@Param("adminUsername") String adminUsername,
      @Param("parentName") String parentName,
      @Param("childName") String childName);

  /**
   * 根据管理员账号查询所有人员列表
   */
  @Select("SELECT * FROM people_list WHERE admin_username = #{adminUsername}")
  List<PeopleList> selectByAdminUsername(@Param("adminUsername") String adminUsername);

  /**
   * 根据人员姓名、管理员账号、父类名称、子类名称查询人员状态
   */
  @Select("SELECT * FROM people_list WHERE people_name = #{peopleName} AND admin_username = #{adminUsername} AND parent_name = #{parentName} AND child_name = #{childName}")
  PeopleList selectByPeopleNameAndAdmin(@Param("peopleName") String peopleName,
      @Param("adminUsername") String adminUsername,
      @Param("parentName") String parentName,
      @Param("childName") String childName);
}
