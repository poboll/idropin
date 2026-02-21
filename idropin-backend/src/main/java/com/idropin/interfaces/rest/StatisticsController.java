package com.idropin.interfaces.rest;

import com.idropin.application.service.AiGradingService;
import com.idropin.application.service.StatisticsService;
import java.util.Map;
import com.idropin.domain.vo.ArchitectureMetricsVO;
import com.idropin.domain.vo.FileStatisticsVO;
import com.idropin.infrastructure.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 统计控制器
 *
 * @author Idrop.in Team
 */
@Tag(name = "统计管理", description = "数据统计相关接口")
@RestController
@RequestMapping("/statistics")
@RequiredArgsConstructor
public class StatisticsController {

  private final StatisticsService statisticsService;
  private final AiGradingService aiGradingService;

  /**
   * 获取文件统计数据
   */
  @Operation(summary = "获取文件统计数据", description = "获取当前用户的文件统计数据")
  @GetMapping("/files")
  public ResponseEntity<FileStatisticsVO> getFileStatistics(
      @Parameter(description = "当前用户") @AuthenticationPrincipal CustomUserDetails userDetails) {
    FileStatisticsVO statistics = statisticsService.getFileStatistics(userDetails.getUserId());
    return ResponseEntity.ok(statistics);
  }

  /**
   * 获取系统统计数据（管理员）
   */
  @Operation(summary = "获取系统统计数据", description = "获取系统级别的统计数据，仅管理员可访问")
  @PreAuthorize("hasRole('ADMIN')")
  @GetMapping("/system")
  public ResponseEntity<FileStatisticsVO> getSystemStatistics() {
    FileStatisticsVO statistics = statisticsService.getSystemStatistics();
    return ResponseEntity.ok(statistics);
  }

  @PreAuthorize("hasRole('ADMIN')")
  @GetMapping("/architecture")
  public ResponseEntity<ArchitectureMetricsVO> getArchitectureMetrics() {
    return ResponseEntity.ok(statisticsService.getArchitectureMetrics());
  }

  @PreAuthorize("hasRole('ADMIN')")
  @PostMapping("/ai/retry-pending")
  public ResponseEntity<Map<String, Integer>> retryPendingAiGrading() {
    int triggered = aiGradingService.retryAllPending();
    return ResponseEntity.ok(Map.of("triggered", triggered));
  }
}
