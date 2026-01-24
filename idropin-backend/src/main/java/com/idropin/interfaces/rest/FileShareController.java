package com.idropin.interfaces.rest;

import com.idropin.application.service.FileShareService;
import com.idropin.common.vo.Result;
import com.idropin.domain.dto.CreateShareRequest;
import com.idropin.domain.entity.File;
import com.idropin.domain.entity.FileShare;
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

  @GetMapping("/access/{shareCode}")
  @Operation(summary = "访问分享链接（公开接口）")
  public Result<FileVO> accessShare(
      @PathVariable String shareCode,
      @RequestParam(value = "password", required = false) String password) {
    File file = shareService.accessShare(shareCode, password);
    String url = storageService.getFileUrl(file.getStoragePath());
    return Result.success(FileVO.fromEntity(file, url));
  }

  private String getUserId(UserDetails userDetails) {
    if (userDetails instanceof CustomUserDetails) {
      return ((CustomUserDetails) userDetails).getUserId();
    }
    throw new IllegalStateException("Invalid user details type");
  }
}
