package com.idropin.interfaces.rest;

import com.idropin.application.service.AIClassificationService;
import com.idropin.common.vo.Result;
import com.idropin.domain.dto.AIClassificationRequest;
import com.idropin.domain.vo.AIClassificationResult;
import com.idropin.infrastructure.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * AI分类控制器
 *
 * @author Idrop.in Team
 */
@Slf4j
@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
@Tag(name = "AI分类", description = "AI智能分类相关接口")
public class AIClassificationController {

  private final AIClassificationService aiClassificationService;

  @PostMapping("/classify")
  @Operation(summary = "AI分类文件")
  public Result<AIClassificationResult> classifyFile(
      @RequestBody AIClassificationRequest request,
      @AuthenticationPrincipal UserDetails userDetails) {
    String userId = getUserId(userDetails);
    AIClassificationResult result = aiClassificationService.classifyFile(request);
    log.info("AI classification result for file {}: {}", request.getFileId(), result);
    return Result.success(result);
  }

  @PostMapping("/batch-classify")
  @Operation(summary = "批量AI分类文件")
  public Result<Void> batchClassifyFiles(
      @RequestBody java.util.List<AIClassificationRequest> requests,
      @AuthenticationPrincipal UserDetails userDetails) {
    for (AIClassificationRequest request : requests) {
      try {
        aiClassificationService.classifyFile(request);
      } catch (Exception e) {
        log.error("Failed to classify file: {}", request.getFileId(), e);
      }
    }
    return Result.success(null);
  }

  private String getUserId(UserDetails userDetails) {
    if (userDetails instanceof CustomUserDetails) {
      return ((CustomUserDetails) userDetails).getUserId();
    }
    throw new IllegalStateException("Invalid user details type");
  }
}
