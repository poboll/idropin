package com.idropin.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.idropin.domain.entity.FileShare;
import org.apache.ibatis.annotations.Mapper;

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
}
