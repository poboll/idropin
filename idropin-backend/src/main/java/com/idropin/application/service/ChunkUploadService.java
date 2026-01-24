package com.idropin.application.service;

import com.idropin.domain.dto.ChunkUploadRequest;
import com.idropin.domain.entity.File;
import com.idropin.domain.vo.FileUploadResult;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 分片上传服务接口
 *
 * @author Idrop.in Team
 */
public interface ChunkUploadService {

  /**
   * 初始化分片上传
   */
  String initChunkUpload(String fileName, Long fileSize, String fileMd5, String userId);

  /**
   * 上传分片
   */
  FileUploadResult uploadChunk(ChunkUploadRequest request, MultipartFile chunk, String userId);

  /**
   * 检查分片是否已上传
   */
  boolean checkChunkUploaded(String uploadId, Integer chunkNumber, String userId);

  /**
   * 获取已上传的分片列表
   */
  List<Integer> getUploadedChunks(String uploadId, String userId);

  /**
   * 合并分片
   */
  File mergeChunks(String uploadId, String userId);

  /**
   * 取消分片上传
   */
  void cancelChunkUpload(String uploadId, String userId);
}
