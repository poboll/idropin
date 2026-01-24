package com.idropin.interfaces.rest;

import com.idropin.application.service.ChunkUploadService;
import com.idropin.common.vo.Result;
import com.idropin.domain.dto.ChunkUploadRequest;
import com.idropin.domain.entity.File;
import com.idropin.domain.vo.FileUploadResult;
import com.idropin.domain.vo.FileVO;
import com.idropin.infrastructure.security.CustomUserDetails;
import com.idropin.infrastructure.storage.StorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 分片上传控制器
 *
 * @author Idrop.in Team
 */
@Slf4j
@RestController
@RequestMapping("/chunks")
@RequiredArgsConstructor
@Tag(name = "分片上传", description = "大文件分片上传相关接口")
public class ChunkUploadController {

  private final ChunkUploadService chunkUploadService;
  private final StorageService storageService;

  @PostMapping("/init")
  @Operation(summary = "初始化分片上传")
  public Result<String> initChunkUpload(
      @RequestParam("fileName") String fileName,
      @RequestParam("fileSize") Long fileSize,
      @RequestParam("fileMd5") String fileMd5,
      @AuthenticationPrincipal UserDetails userDetails) {
    String userId = getUserId(userDetails);
    String uploadId = chunkUploadService.initChunkUpload(fileName, fileSize, fileMd5, userId);
    return Result.success(uploadId);
  }

  @PostMapping("/upload")
  @Operation(summary = "上传分片")
  public Result<FileUploadResult> uploadChunk(
      @RequestParam("file") MultipartFile chunk,
      @RequestParam("uploadId") String uploadId,
      @RequestParam("fileName") String fileName,
      @RequestParam("totalSize") Long totalSize,
      @RequestParam("fileMd5") String fileMd5,
      @RequestParam("chunkNumber") Integer chunkNumber,
      @RequestParam("totalChunks") Integer totalChunks,
      @RequestParam(value = "isLastChunk", defaultValue = "false") Boolean isLastChunk,
      @AuthenticationPrincipal UserDetails userDetails) {
    String userId = getUserId(userDetails);

    ChunkUploadRequest request = new ChunkUploadRequest();
    request.setUploadId(uploadId);
    request.setFileName(fileName);
    request.setTotalSize(totalSize);
    request.setFileMd5(fileMd5);
    request.setChunkNumber(chunkNumber);
    request.setTotalChunks(totalChunks);
    request.setChunkSize(chunk.getSize());
    request.setIsLastChunk(isLastChunk);

    FileUploadResult result = chunkUploadService.uploadChunk(request, chunk, userId);
    return Result.success(result);
  }

  @GetMapping("/check")
  @Operation(summary = "检查分片是否已上传")
  public Result<Boolean> checkChunkUploaded(
      @RequestParam("uploadId") String uploadId,
      @RequestParam("chunkNumber") Integer chunkNumber,
      @AuthenticationPrincipal UserDetails userDetails) {
    String userId = getUserId(userDetails);
    boolean uploaded = chunkUploadService.checkChunkUploaded(uploadId, chunkNumber, userId);
    return Result.success(uploaded);
  }

  @GetMapping("/list")
  @Operation(summary = "获取已上传的分片列表")
  public Result<List<Integer>> getUploadedChunks(
      @RequestParam("uploadId") String uploadId,
      @AuthenticationPrincipal UserDetails userDetails) {
    String userId = getUserId(userDetails);
    List<Integer> uploadedChunks = chunkUploadService.getUploadedChunks(uploadId, userId);
    return Result.success(uploadedChunks);
  }

  @PostMapping("/merge")
  @Operation(summary = "合并分片")
  public Result<FileVO> mergeChunks(
      @RequestParam("uploadId") String uploadId,
      @AuthenticationPrincipal UserDetails userDetails) {
    String userId = getUserId(userDetails);
    File file = chunkUploadService.mergeChunks(uploadId, userId);
    String url = storageService.getFileUrl(file.getStoragePath());
    return Result.success(FileVO.fromEntity(file, url));
  }

  @DeleteMapping("/cancel")
  @Operation(summary = "取消分片上传")
  public Result<Void> cancelChunkUpload(
      @RequestParam("uploadId") String uploadId,
      @AuthenticationPrincipal UserDetails userDetails) {
    String userId = getUserId(userDetails);
    chunkUploadService.cancelChunkUpload(uploadId, userId);
    return Result.success(null);
  }

  private String getUserId(UserDetails userDetails) {
    if (userDetails instanceof CustomUserDetails) {
      return ((CustomUserDetails) userDetails).getUserId();
    }
    throw new IllegalStateException("Invalid user details type");
  }
}
