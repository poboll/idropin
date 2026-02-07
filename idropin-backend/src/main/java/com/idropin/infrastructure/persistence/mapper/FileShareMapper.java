package com.idropin.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.idropin.domain.entity.FileShare;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;

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
   * 按 UUID 主键查询（显式 CAST，避免 uuid=varchar 比较报错）
   */
  FileShare selectByIdString(@Param("id") String id);

  /**
   * 更新分享设置（仅更新允许修改的字段）
   */
  int updateShareSettingsById(
      @Param("id") String id,
      @Param("password") String password,
      @Param("expireAt") LocalDateTime expireAt,
      @Param("downloadLimit") Integer downloadLimit,
      @Param("downloadCount") Integer downloadCount);

  /**
   * 仅更新下载次数（公开访问场景用，避免 MP updateById 触发 uuid=varchar）
   */
  int updateDownloadCountById(
      @Param("id") String id,
      @Param("downloadCount") Integer downloadCount);

  /**
   * 按 UUID 主键删除（显式 CAST，避免 uuid=varchar 比较报错）
   */
  int deleteByIdString(@Param("id") String id);

  /**
   * 根据创建者ID查询分享记录列表
   *
   * @param createdBy 创建者ID
   * @return 分享记录列表
   */
  List<FileShare> selectByCreatedBy(String createdBy);
}
