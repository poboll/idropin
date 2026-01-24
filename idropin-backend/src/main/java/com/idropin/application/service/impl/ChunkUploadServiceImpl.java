package com.idropin.application.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.idropin.application.service.ChunkUploadService;
import com.idropin.common.exception.BusinessException;
import com.idropin.domain.dto.ChunkUploadRequest;
import com.idropin.domain.entity.File;
import com.idropin.domain.entity.FileChunk;
import com.idropin.domain.vo.FileUploadResult;
import com.idropin.domain.vo.FileVO;
import com.idropin.infrastructure.persistence.mapper.FileChunkMapper;
import com.idropin.infrastructure.persistence.mapper.FileMapper;
import com.idropin.infrastructure.storage.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 分片上传服务实现类
 *
 * @author Idrop.in Team
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ChunkUploadServiceImpl implements ChunkUploadService {

  private final FileChunkMapper fileChunkMapper;
  private final FileMapper fileMapper;
  private final StorageService storageService;
  private final ObjectMapper objectMapper;

  @Value("${file.upload.chunk-size:5242880}")
  private long defaultChunkSize;

  @Value("${file.upload.max-size:1073741824}")
  private long maxFileSize;

  @Override
  @Transactional
  public String initChunkUpload(String fileName, Long fileSize, String fileMd5, String userId) {
    if (fileSize > maxFileSize) {
      throw new BusinessException("文件大小超过限制（最大 " + (maxFileSize / 1024 / 1024) + "MB）");
    }

    LambdaQueryWrapper<File> wrapper = new LambdaQueryWrapper<>();
    wrapper.eq(File::getUploaderId, userId)
        .eq(File::getStatus, "ACTIVE");
    List<File> existingFiles = fileMapper.selectList(wrapper);

    for (File existingFile : existingFiles) {
      String existingMd5 = null;
      if (existingFile.getMetadata() != null) {
        try {
          JsonNode metadataNode = objectMapper.readTree(existingFile.getMetadata());
          if (metadataNode.has("md5")) {
            existingMd5 = metadataNode.get("md5").asText();
          }
        } catch (Exception e) {
          log.warn("Failed to parse metadata for file: {}", existingFile.getId(), e);
        }
      }

      if (existingFile.getFileSize().equals(fileSize) && fileMd5.equals(existingMd5)) {
        log.info("File already exists, enabling instant upload: {}", fileName);
        return "INSTANT:" + existingFile.getId();
      }
    }

    String uploadId = UUID.randomUUID().toString().replace("-", "");

    log.info("Initialized chunk upload: uploadId={}, fileName={}, fileSize={}, userId={}",
        uploadId, fileName, fileSize, userId);

    return uploadId;
  }

  @Override
  @Transactional
  public FileUploadResult uploadChunk(ChunkUploadRequest request, MultipartFile chunk, String userId) {
    validateChunkRequest(request, chunk);

    if (request.getUploadId().startsWith("INSTANT:")) {
      String fileId = request.getUploadId().substring("INSTANT:".length());
      File existingFile = fileMapper.selectById(fileId);
      String url = storageService.getFileUrl(existingFile.getStoragePath());
      return FileUploadResult.success(request.getFileName(), FileVO.fromEntity(existingFile, url));
    }

    FileChunk existingChunk = fileChunkMapper.findByUploadIdAndChunkNumber(
        request.getUploadId(), request.getChunkNumber());

    if (existingChunk != null && "COMPLETED".equals(existingChunk.getStatus())) {
      log.info("Chunk already uploaded: uploadId={}, chunkNumber={}",
          request.getUploadId(), request.getChunkNumber());
      return FileUploadResult.success(request.getFileName() + " - 分片 " + request.getChunkNumber(), null);
    }

    try {
      String chunkStoragePath = generateChunkStoragePath(
          request.getUploadId(), request.getChunkNumber());

      storageService.uploadFile(
          chunkStoragePath,
          chunk.getInputStream(),
          "application/octet-stream",
          chunk.getSize());

      FileChunk fileChunk = new FileChunk();
      fileChunk.setId(UUID.randomUUID().toString());
      fileChunk.setUploadId(request.getUploadId());
      fileChunk.setFileName(request.getFileName());
      fileChunk.setTotalSize(request.getTotalSize());
      fileChunk.setFileMd5(request.getFileMd5());
      fileChunk.setChunkNumber(request.getChunkNumber());
      fileChunk.setChunkSize(chunk.getSize());
      fileChunk.setStoragePath(chunkStoragePath);
      fileChunk.setUploaderId(userId);
      fileChunk.setStatus("COMPLETED");
      fileChunk.setCreatedAt(LocalDateTime.now());
      fileChunk.setUpdatedAt(LocalDateTime.now());

      if (existingChunk != null) {
        fileChunk.setId(existingChunk.getId());
        fileChunkMapper.updateById(fileChunk);
      } else {
        fileChunkMapper.insert(fileChunk);
      }

      log.info("Chunk uploaded successfully: uploadId={}, chunkNumber={}, size={}",
          request.getUploadId(), request.getChunkNumber(), chunk.getSize());

      if (Boolean.TRUE.equals(request.getIsLastChunk())) {
        log.info("Last chunk uploaded, initiating merge: uploadId={}", request.getUploadId());
        File mergedFile = mergeChunks(request.getUploadId(), userId);
        String url = storageService.getFileUrl(mergedFile.getStoragePath());
        return FileUploadResult.success(request.getFileName(), FileVO.fromEntity(mergedFile, url));
      }

      return FileUploadResult.success(request.getFileName() + " - 分片 " + request.getChunkNumber(), null);

    } catch (Exception e) {
      log.error("Failed to upload chunk: uploadId={}, chunkNumber={}",
          request.getUploadId(), request.getChunkNumber(), e);
      throw new BusinessException("分片上传失败: " + e.getMessage());
    }
  }

  @Override
  public boolean checkChunkUploaded(String uploadId, Integer chunkNumber, String userId) {
    FileChunk chunk = fileChunkMapper.findByUploadIdAndChunkNumber(uploadId, chunkNumber);
    return chunk != null && "COMPLETED".equals(chunk.getStatus());
  }

  @Override
  public List<Integer> getUploadedChunks(String uploadId, String userId) {
    List<FileChunk> chunks = fileChunkMapper.findByUploadId(uploadId);
    return chunks.stream()
        .filter(chunk -> "COMPLETED".equals(chunk.getStatus()))
        .map(FileChunk::getChunkNumber)
        .sorted()
        .collect(Collectors.toList());
  }

  @Override
  @Transactional
  public File mergeChunks(String uploadId, String userId) {
    List<FileChunk> chunks = fileChunkMapper.findByUploadId(uploadId);

    if (chunks.isEmpty()) {
      throw new BusinessException("没有找到可合并的分片");
    }

    chunks.sort(Comparator.comparing(FileChunk::getChunkNumber));

    for (FileChunk chunk : chunks) {
      if (!"COMPLETED".equals(chunk.getStatus())) {
        throw new BusinessException("分片 " + chunk.getChunkNumber() + " 未上传完成");
      }
    }

    try {
      ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
      for (FileChunk chunk : chunks) {
        try (InputStream inputStream = storageService.downloadFile(chunk.getStoragePath())) {
          byte[] buffer = new byte[8192];
          int bytesRead;
          while ((bytesRead = inputStream.read(buffer)) != -1) {
            outputStream.write(buffer, 0, bytesRead);
          }
        }
      }

      byte[] mergedData = outputStream.toByteArray();
      String md5 = calculateMD5(mergedData);

      FileChunk firstChunk = chunks.get(0);
      if (!md5.equals(firstChunk.getFileMd5())) {
        throw new BusinessException("文件MD5校验失败，文件可能损坏");
      }

      String extension = getFileExtension(firstChunk.getFileName());
      String finalStoragePath = generateFinalStoragePath(userId, extension);

      storageService.uploadFile(
          finalStoragePath,
          new java.io.ByteArrayInputStream(mergedData),
          "application/octet-stream",
          mergedData.length);

      File file = new File();
      file.setName(firstChunk.getFileName());
      file.setOriginalName(firstChunk.getFileName());
      file.setFileSize(firstChunk.getTotalSize());
      file.setMimeType("application/octet-stream");
      file.setStoragePath(finalStoragePath);
      file.setStorageProvider("MINIO");
      file.setUploaderId(userId);
      file.setStatus("ACTIVE");
      file.setCreatedAt(LocalDateTime.now());
      file.setUpdatedAt(LocalDateTime.now());

      try {
        java.util.Map<String, String> metadataMap = new java.util.HashMap<>();
        metadataMap.put("md5", md5);
        file.setMetadata(objectMapper.writeValueAsString(metadataMap));
      } catch (Exception e) {
        log.error("Failed to serialize metadata", e);
      }

      fileMapper.insert(file);

      for (FileChunk chunk : chunks) {
        chunk.setFileId(file.getId());
        chunk.setStatus("MERGED");
        chunk.setUpdatedAt(LocalDateTime.now());
        fileChunkMapper.updateById(chunk);
      }

      log.info("Chunks merged successfully: uploadId={}, fileId={}", uploadId, file.getId());

      return file;

    } catch (Exception e) {
      log.error("Failed to merge chunks: uploadId={}", uploadId, e);
      throw new BusinessException("合并分片失败: " + e.getMessage());
    }
  }

  @Override
  @Transactional
  public void cancelChunkUpload(String uploadId, String userId) {
    List<FileChunk> chunks = fileChunkMapper.findByUploadId(uploadId);

    List<String> storagePaths = new ArrayList<>();
    for (FileChunk chunk : chunks) {
      storagePaths.add(chunk.getStoragePath());
    }

    if (!storagePaths.isEmpty()) {
      try {
        storageService.deleteFiles(storagePaths);
      } catch (Exception e) {
        log.error("Failed to delete chunk files", e);
      }
    }

    fileChunkMapper.deleteByUploadId(uploadId);

    log.info("Chunk upload cancelled: uploadId={}, userId={}", uploadId, userId);
  }

  private void validateChunkRequest(ChunkUploadRequest request, MultipartFile chunk) {
    if (chunk == null || chunk.isEmpty()) {
      throw new BusinessException("分片数据不能为空");
    }

    if (request.getChunkNumber() == null || request.getChunkNumber() < 0) {
      throw new BusinessException("分片序号无效");
    }

    if (request.getTotalChunks() == null || request.getTotalChunks() <= 0) {
      throw new BusinessException("分片总数无效");
    }

    if (request.getChunkNumber() >= request.getTotalChunks()) {
      throw new BusinessException("分片序号超出范围");
    }
  }

  private String generateChunkStoragePath(String uploadId, Integer chunkNumber) {
    return String.format("chunks/%s/%d", uploadId, chunkNumber);
  }

  private String generateFinalStoragePath(String userId, String extension) {
    String uuid = UUID.randomUUID().toString().replace("-", "");
    String datePath = LocalDateTime.now().toString().substring(0, 10).replace("-", "/");
    return String.format("%s/%s/%s%s", userId, datePath, uuid, extension);
  }

  private String getFileExtension(String filename) {
    if (filename == null || !filename.contains(".")) {
      return "";
    }
    return filename.substring(filename.lastIndexOf("."));
  }

  private String calculateMD5(byte[] data) {
    try {
      MessageDigest md = MessageDigest.getInstance("MD5");
      byte[] hash = md.digest(data);
      StringBuilder hexString = new StringBuilder();
      for (byte b : hash) {
        String hex = Integer.toHexString(0xff & b);
        if (hex.length() == 1) {
          hexString.append('0');
        }
        hexString.append(hex);
      }
      return hexString.toString();
    } catch (Exception e) {
      throw new BusinessException("计算MD5失败: " + e.getMessage());
    }
  }
}
