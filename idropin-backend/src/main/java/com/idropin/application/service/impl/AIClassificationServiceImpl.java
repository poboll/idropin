package com.idropin.application.service.impl;

import com.idropin.application.service.AIClassificationService;
import com.idropin.application.service.CategoryService;
import com.idropin.application.service.FileService;
import com.idropin.domain.dto.AIClassificationRequest;
import com.idropin.domain.entity.File;
import com.idropin.domain.entity.FileCategory;
import com.idropin.domain.vo.AIClassificationResult;
import com.idropin.infrastructure.persistence.mapper.FileCategoryMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * AI分类服务实现类
 *
 * @author Idrop.in Team
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AIClassificationServiceImpl implements AIClassificationService {

  private final FileService fileService;
  private final FileCategoryMapper categoryMapper;
  private final CategoryService categoryService;

  @Value("${ai.classification.enabled:false}")
  private Boolean aiClassificationEnabled;

  @Override
  public AIClassificationResult classifyFile(AIClassificationRequest request) {
    if (!Boolean.TRUE.equals(aiClassificationEnabled)) {
      log.info("AI classification is disabled, returning default result");
      return AIClassificationResult.builder()
          .success(true)
          .categoryId(null)
          .categoryName("未分类")
          .confidence(0.0)
          .build();
    }

    try {
      File file = fileService.getFileById(request.getFileId());

      String categoryId = classifyByMimeType(file.getMimeType(), file.getOriginalName());

      if (categoryId != null) {
        FileCategory category = categoryMapper.selectById(categoryId);
        return AIClassificationResult.builder()
            .success(true)
            .categoryId(categoryId)
            .categoryName(category != null ? category.getName() : "未分类")
            .confidence(0.95)
            .build();
      }

      return AIClassificationResult.builder()
          .success(true)
          .categoryId(null)
          .categoryName("其他")
          .confidence(0.0)
          .build();

    } catch (Exception e) {
      log.error("Failed to classify file: {}", request.getFileId(), e);
      return AIClassificationResult.builder()
          .success(false)
          .categoryId(null)
          .categoryName("分类失败")
          .confidence(0.0)
          .errorMessage("AI分类失败: " + e.getMessage())
          .build();
    }
  }

  private String classifyByMimeType(String mimeType, String fileName) {
    if (mimeType == null) {
      return null;
    }

    if (mimeType.startsWith("image/")) {
      return findCategoryByName("图片");
    }

    if (isDocumentType(mimeType, fileName)) {
      return findCategoryByName("文档");
    }

    if (mimeType.startsWith("video/")) {
      return findCategoryByName("视频");
    }

    if (mimeType.startsWith("audio/")) {
      return findCategoryByName("音频");
    }

    if (isArchiveType(mimeType, fileName)) {
      return findCategoryByName("压缩包");
    }

    return null;
  }

  private boolean isDocumentType(String mimeType, String fileName) {
    if (mimeType.startsWith("text/")) {
      return true;
    }

    if (fileName != null) {
      String lowerName = fileName.toLowerCase();
      return lowerName.endsWith(".doc") || lowerName.endsWith(".docx") ||
          lowerName.endsWith(".pdf") || lowerName.endsWith(".txt") ||
          lowerName.endsWith(".xls") || lowerName.endsWith(".xlsx") ||
          lowerName.endsWith(".ppt") || lowerName.endsWith(".pptx");
    }

    return false;
  }

  private boolean isArchiveType(String mimeType, String fileName) {
    if (mimeType != null && mimeType.contains("zip") || mimeType.contains("rar") ||
        mimeType.contains("7z") || mimeType.contains("tar")) {
      return true;
    }

    if (fileName != null) {
      String lowerName = fileName.toLowerCase();
      return lowerName.endsWith(".zip") || lowerName.endsWith(".rar") ||
          lowerName.endsWith(".7z") || lowerName.endsWith(".tar") ||
          lowerName.endsWith(".gz");
    }

    return false;
  }

  private String findCategoryByName(String name) {
    List<FileCategory> categories = categoryMapper.selectList(null);
    return categories.stream()
        .filter(c -> c.getName().equals(name))
        .findFirst()
        .map(FileCategory::getId)
        .orElse(null);
  }
}
