package com.idropin.interfaces.rest;

import com.idropin.application.service.FileShareService;
import com.idropin.common.vo.Result;
import com.idropin.domain.dto.CreateShareRequest;
import com.idropin.domain.entity.File;
import com.idropin.domain.entity.FileShare;
import com.idropin.domain.vo.FileVO;
import com.idropin.domain.vo.ShareInfoVO;
import com.idropin.infrastructure.security.CustomUserDetails;
import com.idropin.infrastructure.storage.StorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 文件分享控制器
 *
 * @author Idrop.in Team
 */
@Slf4j
@RestController
@RequestMapping("/shares")
@RequiredArgsConstructor
@Tag(name = "文件分享", description = "文件分享相关接口")
public class FileShareController {

  private final FileShareService shareService;
  private final StorageService storageService;

  @PostMapping
  @Operation(summary = "创建文件分享")
  public Result<FileShare> createShare(
      @RequestBody CreateShareRequest request,
      @AuthenticationPrincipal UserDetails userDetails) {
    String userId = getUserId(userDetails);
    FileShare share = shareService.createShare(request, userId);
    return Result.success(share);
  }

  @GetMapping
  @Operation(summary = "获取用户的分享列表")
  public Result<List<FileShare>> getUserShares(
      @AuthenticationPrincipal UserDetails userDetails) {
    String userId = getUserId(userDetails);
    List<FileShare> shares = shareService.getUserShares(userId);
    return Result.success(shares);
  }

  @GetMapping("/{id}")
  @Operation(summary = "获取分享详情")
  public Result<FileShare> getShare(
      @PathVariable String id,
      @AuthenticationPrincipal UserDetails userDetails) {
    String userId = getUserId(userDetails);
    FileShare share = shareService.getShare(id, userId);
    return Result.success(share);
  }

  @PutMapping("/{id}")
  @Operation(summary = "更新分享设置")
  public Result<FileShare> updateShare(
      @PathVariable String id,
      @RequestBody CreateShareRequest request,
      @AuthenticationPrincipal UserDetails userDetails) {
    String userId = getUserId(userDetails);
    FileShare share = shareService.updateShare(id, request, userId);
    return Result.success(share);
  }

  @DeleteMapping("/{id}")
  @Operation(summary = "取消分享")
  public Result<Void> cancelShare(
      @PathVariable String id,
      @AuthenticationPrincipal UserDetails userDetails) {
    String userId = getUserId(userDetails);
    shareService.cancelShare(id, userId);
    return Result.success(null);
  }

  @GetMapping("/{shareCode}/info")
  @Operation(summary = "获取分享信息（公开接口）")
  public Result<ShareInfoVO> getShareInfo(@PathVariable String shareCode) {
    ShareInfoVO info = shareService.getShareInfo(shareCode);
    return Result.success(info);
  }

  @PostMapping("/{shareCode}/download")
  @Operation(summary = "下载分享文件（公开接口）")
  public Result<FileDownloadVO> downloadShare(
      @PathVariable String shareCode,
      @RequestBody(required = false) SharePasswordRequest request) {
    String password = request != null ? request.getPassword() : null;
    File file = shareService.accessShare(shareCode, password);
    String url = storageService.getFileUrl(file.getStoragePath());
    
    FileDownloadVO downloadVO = new FileDownloadVO();
    downloadVO.setDownloadUrl(url);
    downloadVO.setFileName(file.getOriginalName());
    downloadVO.setFileSize(file.getFileSize());
    
    return Result.success(downloadVO);
  }

  @GetMapping("/access/{shareCode}")
  @Operation(summary = "访问分享链接（公开接口）")
  public Result<FileVO> accessShare(
      @PathVariable String shareCode,
      @RequestParam(value = "password", required = false) String password) {
    File file = shareService.accessShare(shareCode, password);
    String url = storageService.getFileUrl(file.getStoragePath());
    return Result.success(FileVO.fromEntity(file, url));
  }
  
  // DTO classes
  static class SharePasswordRequest {
    private String password;
    
    public String getPassword() {
      return password;
    }
    
    public void setPassword(String password) {
      this.password = password;
    }
  }
  
  static class FileDownloadVO {
    private String downloadUrl;
    private String fileName;
    private Long fileSize;
    
    public String getDownloadUrl() {
      return downloadUrl;
    }
    
    public void setDownloadUrl(String downloadUrl) {
      this.downloadUrl = downloadUrl;
    }
    
    public String getFileName() {
      return fileName;
    }
    
    public void setFileName(String fileName) {
      this.fileName = fileName;
    }
    
    public Long getFileSize() {
      return fileSize;
    }
    
    public void setFileSize(Long fileSize) {
      this.fileSize = fileSize;
    }
  }

  private String getUserId(UserDetails userDetails) {
    if (userDetails instanceof CustomUserDetails) {
      return ((CustomUserDetails) userDetails).getUserId();
    }
    throw new IllegalStateException("Invalid user details type");
  }
}
