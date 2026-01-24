package com.idropin.application.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.idropin.domain.dto.SearchRequest;
import com.idropin.domain.entity.File;
import com.idropin.domain.entity.FileCategory;
import com.idropin.domain.vo.SearchResult;
import com.idropin.infrastructure.persistence.mapper.FileCategoryMapper;
import com.idropin.infrastructure.persistence.mapper.FileMapper;
import com.idropin.infrastructure.storage.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 搜索服务
 *
 * @author Idrop.in Team
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SearchService {

  private final FileMapper fileMapper;
  private final FileCategoryMapper categoryMapper;
  private final StorageService storageService;
  private final FileService fileService;

  public SearchResult searchFiles(SearchRequest request, String userId) {
    long startTime = System.currentTimeMillis();

    LambdaQueryWrapper<File> wrapper = new LambdaQueryWrapper<>();
    wrapper.eq(File::getUploaderId, userId)
        .eq(File::getStatus, "ACTIVE");

    if (StringUtils.hasText(request.getKeyword())) {
      String keyword = request.getKeyword().trim();
      wrapper.and(w -> w
          .like(File::getName, keyword)
          .or()
          .like(File::getOriginalName, keyword));
    }

    if (StringUtils.hasText(request.getMimeType())) {
      wrapper.eq(File::getMimeType, request.getMimeType());
    }

    if (StringUtils.hasText(request.getCategoryId())) {
      wrapper.eq(File::getCategoryId, request.getCategoryId());
    }

    if (request.getTags() != null && !request.getTags().isEmpty()) {
      for (String tag : request.getTags()) {
        wrapper.apply("array_to_string(tags, ',') LIKE CONCAT('%', ?, '%')", tag);
      }
    }

    if (request.getMinFileSize() != null) {
      wrapper.ge(File::getFileSize, request.getMinFileSize());
    }
    if (request.getMaxFileSize() != null) {
      wrapper.le(File::getFileSize, request.getMaxFileSize());
    }

    if (StringUtils.hasText(request.getStartDate())) {
      try {
        LocalDateTime start = LocalDateTime.parse(request.getStartDate());
        wrapper.ge(File::getCreatedAt, start);
      } catch (Exception e) {
        log.warn("Invalid start date format: {}", request.getStartDate());
      }
    }
    if (StringUtils.hasText(request.getEndDate())) {
      try {
        LocalDateTime end = LocalDateTime.parse(request.getEndDate());
        wrapper.le(File::getCreatedAt, end);
      } catch (Exception e) {
        log.warn("Invalid end date format: {}", request.getEndDate());
      }
    }

    int page = request.getPage() != null ? request.getPage() : 0;
    int size = request.getSize() != null ? request.getSize() : 20;
    Page<File> pageObj = new Page<>(page, size);

    String sortBy = StringUtils.hasText(request.getSortBy()) ? request.getSortBy() : "createdAt";
    boolean isAsc = !"desc".equalsIgnoreCase(request.getSortOrder());

    switch (sortBy) {
      case "fileSize":
        wrapper.orderBy(true, isAsc, File::getFileSize);
        break;
      case "name":
        wrapper.orderBy(true, isAsc, File::getName);
        break;
      case "createdAt":
      default:
        wrapper.orderBy(true, isAsc, File::getCreatedAt);
        break;
    }

    IPage<File> filePage = fileMapper.selectPage(pageObj, wrapper);

    List<SearchResult.FileSearchItem> items = filePage.getRecords().stream()
        .map(file -> {
          String url = storageService.getFileUrl(file.getStoragePath());
          return SearchResult.FileSearchItem.builder()
              .id(file.getId())
              .name(file.getName())
              .originalName(file.getOriginalName())
              .fileSize(file.getFileSize())
              .mimeType(file.getMimeType())
              .categoryId(file.getCategoryId())
              .categoryName(getCategoryName(file.getCategoryId()))
              .tags(file.getTags())
              .storagePath(file.getStoragePath())
              .url(url)
              .createdAt(file.getCreatedAt().toString())
              .build();
        })
        .collect(Collectors.toList());

    List<String> suggestions = generateSearchSuggestions(request.getKeyword());

    long duration = System.currentTimeMillis() - startTime;

    return SearchResult.builder()
        .total(filePage.getTotal())
        .files(items)
        .duration(duration)
        .suggestions(suggestions)
        .build();
  }

  private String getCategoryName(String categoryId) {
    if (categoryId == null) {
      return null;
    }
    FileCategory category = categoryMapper.selectById(categoryId);
    return category != null ? category.getName() : null;
  }

  public List<String> generateSearchSuggestions(String keyword) {
    if (!StringUtils.hasText(keyword)) {
      return Collections.emptyList();
    }

    List<String> suggestions = new ArrayList<>();

    String lowerKeyword = keyword.toLowerCase();
    if (lowerKeyword.contains("doc")) {
      suggestions.add("文档");
    }
    if (lowerKeyword.contains("pdf")) {
      suggestions.add("PDF");
    }
    if (lowerKeyword.contains("图片") || lowerKeyword.contains("image")) {
      suggestions.add("图片");
    }
    if (lowerKeyword.contains("视频") || lowerKeyword.contains("video")) {
      suggestions.add("视频");
    }
    if (lowerKeyword.contains("音频") || lowerKeyword.contains("audio")) {
      suggestions.add("音频");
    }
    if (lowerKeyword.contains("压缩") || lowerKeyword.contains("zip")) {
      suggestions.add("压缩包");
    }

    return suggestions.stream().distinct().limit(5).collect(Collectors.toList());
  }
}
