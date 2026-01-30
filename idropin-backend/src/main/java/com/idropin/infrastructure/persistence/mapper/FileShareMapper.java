package com.idropin.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.idropin.domain.entity.FileShare;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

/**
 * 文件分享Mapper
 *
 * @author Idrop.in Team
 */
@Mapper
public interface FileShareMapper extends BaseMapper<FileShare> {

  /**
   * 根据分享码查询分享记录
   *
   * @param shareCode 分享码
   * @return 分享记录
   */
  FileShare findByShareCode(String shareCode);

  /**
   * 根据创建者ID查询分享记录列表
   *
   * @param createdBy 创建者ID
   * @return 分享记录列表
   */
  List<FileShare> selectByCreatedBy(String createdBy);
}
