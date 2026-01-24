package com.idropin.interfaces.rest;

import com.idropin.application.service.SearchService;
import com.idropin.domain.dto.SearchRequest;
import com.idropin.domain.vo.SearchResult;
import com.idropin.infrastructure.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 搜索控制器
 *
 * @author Idrop.in Team
 */
@Tag(name = "搜索管理", description = "文件搜索相关接口")
@RestController
@RequestMapping("/search")
@RequiredArgsConstructor
public class SearchController {

  private final SearchService searchService;

  /**
   * 搜索文件
   */
  @Operation(summary = "搜索文件", description = "根据关键字、类型、分类、标签等条件搜索文件")
  @PostMapping
  public ResponseEntity<SearchResult> searchFiles(
      @Parameter(description = "搜索条件") @RequestBody SearchRequest request,
      @Parameter(description = "当前用户") @AuthenticationPrincipal CustomUserDetails userDetails) {
    SearchResult result = searchService.searchFiles(request, userDetails.getUserId());
    return ResponseEntity.ok(result);
  }

  /**
   * 获取搜索建议
   */
  @Operation(summary = "获取搜索建议", description = "根据输入关键字获取搜索建议")
  @GetMapping("/suggestions")
  public ResponseEntity<Map<String, Object>> getSearchSuggestions(
      @Parameter(description = "搜索关键字") @RequestParam String keyword) {
    // 简化实现，实际应该从缓存或数据库获取
    List<String> suggestions = searchService.generateSearchSuggestions(keyword);

    return ResponseEntity.ok(Map.of(
        "keyword", keyword,
        "suggestions", suggestions));
  }
}
