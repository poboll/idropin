package com.idropin.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.idropin.domain.entity.FileChunk;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

/**
 * 文件分片Mapper接口
 *
 * @author Idrop.in Team
 */
@Mapper
public interface FileChunkMapper extends BaseMapper<FileChunk> {

  /**
   * 根据上传任务ID查询所有分片
   */
  List<FileChunk> findByUploadId(String uploadId);

  /**
   * 根据上传任务ID和分片序号查询分片
   */
  FileChunk findByUploadIdAndChunkNumber(String uploadId, Integer chunkNumber);

  /**
   * 根据上传任务ID删除所有分片
   */
  int deleteByUploadId(String uploadId);
}
