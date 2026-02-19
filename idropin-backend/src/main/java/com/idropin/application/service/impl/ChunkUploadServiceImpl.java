package com.idropin.application.service.impl;

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

import java.io.InputStream;
import java.io.SequenceInputStream;
import java.security.DigestInputStream;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
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

  @Value("${storage.root-prefix:}")
  private String rootPrefix;

  @Override
  @Transactional
  public String initChunkUpload(String fileName, Long fileSize, String fileMd5, String userId) {
    if (fileSize > maxFileSize) {
      throw new BusinessException("文件大小超过限制（最大 " + (maxFileSize / 1024 / 1024) + "MB）");
    }

    File existing = fileMapper.findByUploaderIdAndMd5AndSize(userId, fileMd5, fileSize);
    if (existing != null) {
      log.info("File already exists, enabling instant upload: {}", fileName);
      return "INSTANT:" + existing.getId();
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

    FileChunk firstChunk = chunks.get(0);
    String extension = getFileExtension(firstChunk.getFileName());
    String finalStoragePath = generateFinalStoragePath(userId, extension);

    try {
      long totalSize = chunks.stream().mapToLong(FileChunk::getChunkSize).sum();
      String md5;

      boolean serverSideComposed = false;
      try {
        List<String> chunkPaths = chunks.stream()
            .map(FileChunk::getStoragePath)
            .collect(Collectors.toList());
        storageService.composeObjects(chunkPaths, finalStoragePath);
        md5 = firstChunk.getFileMd5();
        serverSideComposed = true;
        log.info("Server-side compose succeeded for uploadId={}", uploadId);
      } catch (UnsupportedOperationException ignored) {
        List<InputStream> streams = chunks.stream()
            .map(c -> storageService.downloadFile(c.getStoragePath()))
            .collect(Collectors.toList());
        MessageDigest digest = MessageDigest.getInstance("MD5");
        try (SequenceInputStream sis = new SequenceInputStream(Collections.enumeration(streams));
             DigestInputStream dis = new DigestInputStream(sis, digest)) {
          storageService.uploadFile(finalStoragePath, dis, "application/octet-stream", totalSize);
        }
        md5 = toHex(digest.digest());
      }

      if (!serverSideComposed && !md5.equals(firstChunk.getFileMd5())) {
        try { storageService.deleteFile(finalStoragePath); } catch (Exception ignored) {}
        throw new BusinessException("文件MD5校验失败，文件可能损坏");
      }

      File file = new File();
      file.setId(UUID.randomUUID().toString());
      file.setName(firstChunk.getFileName());
      file.setOriginalName(firstChunk.getFileName());
      file.setFileSize(firstChunk.getTotalSize());
      file.setMimeType("application/octet-stream");
      file.setStoragePath(finalStoragePath);
      file.setStorageProvider(storageService.getActiveStorageType().toUpperCase());
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
    String prefix = (rootPrefix == null || rootPrefix.isEmpty()) ? "" : rootPrefix + "/";
    return String.format("%susers/%s/%s%s", prefix, userId, uuid, extension);
  }

  private String getFileExtension(String filename) {
    if (filename == null || !filename.contains(".")) {
      return "";
    }
    return filename.substring(filename.lastIndexOf("."));
  }

  private static String toHex(byte[] bytes) {
    StringBuilder sb = new StringBuilder(bytes.length * 2);
    for (byte b : bytes) sb.append(String.format("%02x", b));
    return sb.toString();
  }
}
