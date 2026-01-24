package com.idropin.domain.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 人员名单实体
 */
@Data
@TableName("people_list")
public class PeopleList {

  @TableId(type = IdType.ASSIGN_UUID)
  private String id;

  /**
   * 允许人员姓名
   */
  private String peopleName;

  /**
   * 管理员账号
   */
  private String adminUsername;

  /**
   * 所属父类
   */
  private String parentName;

  /**
   * 所属子类
   */
  private String childName;

  /**
   * 是否提交：0-未提交，1-已提交
   */
  private Integer status;

  /**
   * 最后提交时间
   */
  private LocalDateTime lastDate;

  /**
   * 创建时间
   */
  @TableField(fill = FieldFill.INSERT)
  private LocalDateTime createdAt;

  /**
   * 更新时间
   */
  @TableField(fill = FieldFill.INSERT_UPDATE)
  private LocalDateTime updatedAt;
}
