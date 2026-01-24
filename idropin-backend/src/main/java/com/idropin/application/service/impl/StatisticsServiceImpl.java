package com.idropin.application.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.idropin.application.service.StatisticsService;
import com.idropin.domain.entity.File;
import com.idropin.domain.entity.FileCategory;
import com.idropin.domain.vo.FileStatisticsVO;
import com.idropin.infrastructure.persistence.mapper.FileCategoryMapper;
import com.idropin.infrastructure.persistence.mapper.FileMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 统计服务实现
 *
 * @author Idrop.in Team
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StatisticsServiceImpl implements StatisticsService {

  private final FileMapper fileMapper;
  private final FileCategoryMapper categoryMapper;

  @Override
  public FileStatisticsVO getFileStatistics(String userId) {
    // 使用原生SQL查询，避免UUID类型转换问题
    Long totalFiles = fileMapper.countByUploaderId(userId);

    Long totalStorageSize = fileMapper.sumFileSizeByUploaderId(userId);

    LocalDateTime todayStart = LocalDate.now().atStartOfDay();
    LocalDateTime todayEnd = LocalDate.now().plusDays(1).atStartOfDay();
    Long todayUploads = countFilesByDateRange(userId, todayStart, todayEnd);

    LocalDateTime weekStart = LocalDate.now().minusDays(7).atStartOfDay();
    Long weekUploads = countFilesByDateRange(userId, weekStart, todayEnd);

    LocalDateTime monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay();
    Long monthUploads = countFilesByDateRange(userId, monthStart, todayEnd);

    List<FileStatisticsVO.FileTypeDistribution> fileTypeDistribution = getFileTypeDistribution(userId);
    List<FileStatisticsVO.UploadTrend> uploadTrend = getUploadTrend(userId);
    List<FileStatisticsVO.CategoryStatistics> categoryStatistics = getCategoryStatistics(userId);
    FileStatisticsVO.StorageUsage storageUsage = getStorageUsage(totalStorageSize);

    return FileStatisticsVO.builder()
        .totalFiles(totalFiles)
        .totalStorageSize(totalStorageSize)
        .todayUploads(todayUploads)
        .weekUploads(weekUploads)
        .monthUploads(monthUploads)
        .fileTypeDistribution(fileTypeDistribution)
        .uploadTrend(uploadTrend)
        .categoryStatistics(categoryStatistics)
        .storageUsage(storageUsage)
        .build();
  }

  @Override
  public FileStatisticsVO getSystemStatistics() {
    LambdaQueryWrapper<File> wrapper = new LambdaQueryWrapper<>();
    wrapper.eq(File::getStatus, "ACTIVE");

    Long totalFiles = fileMapper.selectCount(wrapper);

    wrapper.clear();
    wrapper.eq(File::getStatus, "ACTIVE")
        .select(File::getFileSize);
    List<File> files = fileMapper.selectList(wrapper);
    Long totalStorageSize = files.stream()
        .mapToLong(File::getFileSize)
        .sum();

    LocalDateTime todayStart = LocalDate.now().atStartOfDay();
    LocalDateTime todayEnd = LocalDate.now().plusDays(1).atStartOfDay();
    Long todayUploads = countSystemFilesByDateRange(todayStart, todayEnd);

    LocalDateTime weekStart = LocalDate.now().minusDays(7).atStartOfDay();
    Long weekUploads = countSystemFilesByDateRange(weekStart, todayEnd);

    LocalDateTime monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay();
    Long monthUploads = countSystemFilesByDateRange(monthStart, todayEnd);

    List<FileStatisticsVO.FileTypeDistribution> fileTypeDistribution = getSystemFileTypeDistribution();
    List<FileStatisticsVO.UploadTrend> uploadTrend = getSystemUploadTrend();
    List<FileStatisticsVO.CategoryStatistics> categoryStatistics = getSystemCategoryStatistics();
    FileStatisticsVO.StorageUsage storageUsage = getStorageUsage(totalStorageSize);

    return FileStatisticsVO.builder()
        .totalFiles(totalFiles)
        .totalStorageSize(totalStorageSize)
        .todayUploads(todayUploads)
        .weekUploads(weekUploads)
        .monthUploads(monthUploads)
        .fileTypeDistribution(fileTypeDistribution)
        .uploadTrend(uploadTrend)
        .categoryStatistics(categoryStatistics)
        .storageUsage(storageUsage)
        .build();
  }

  private Long countFilesByDateRange(String userId, LocalDateTime start, LocalDateTime end) {
    return fileMapper.countByUploaderIdAndDateRange(userId, start, end);
  }

  private Long countSystemFilesByDateRange(LocalDateTime start, LocalDateTime end) {
    LambdaQueryWrapper<File> wrapper = new LambdaQueryWrapper<>();
    wrapper.eq(File::getStatus, "ACTIVE")
        .ge(File::getCreatedAt, start)
        .lt(File::getCreatedAt, end);
    return fileMapper.selectCount(wrapper);
  }

  private List<FileStatisticsVO.FileTypeDistribution> getFileTypeDistribution(String userId) {
    List<String> mimeTypes = fileMapper.findMimeTypesByUploaderId(userId);

    Map<String, Long> typeCountMap = mimeTypes.stream()
        .collect(Collectors.groupingBy(
            this::getFileType,
            Collectors.counting()));

    Long totalCount = (long) mimeTypes.size();

    return typeCountMap.entrySet().stream()
        .map(entry -> FileStatisticsVO.FileTypeDistribution.builder()
            .type(entry.getKey())
            .typeName(getTypeName(entry.getKey()))
            .count(entry.getValue())
            .percentage(totalCount > 0 ? (entry.getValue() * 100.0 / totalCount) : 0.0)
            .build())
        .sorted((a, b) -> Long.compare(b.getCount(), a.getCount()))
        .collect(Collectors.toList());
  }

  private List<FileStatisticsVO.FileTypeDistribution> getSystemFileTypeDistribution() {
    LambdaQueryWrapper<File> wrapper = new LambdaQueryWrapper<>();
    wrapper.eq(File::getStatus, "ACTIVE")
        .select(File::getMimeType);
    List<File> files = fileMapper.selectList(wrapper);

    Map<String, Long> typeCountMap = files.stream()
        .collect(Collectors.groupingBy(
            file -> getFileType(file.getMimeType()),
            Collectors.counting()));

    Long totalCount = (long) files.size();

    return typeCountMap.entrySet().stream()
        .map(entry -> FileStatisticsVO.FileTypeDistribution.builder()
            .type(entry.getKey())
            .typeName(getTypeName(entry.getKey()))
            .count(entry.getValue())
            .percentage(totalCount > 0 ? (entry.getValue() * 100.0 / totalCount) : 0.0)
            .build())
        .sorted((a, b) -> Long.compare(b.getCount(), a.getCount()))
        .collect(Collectors.toList());
  }

  private List<FileStatisticsVO.UploadTrend> getUploadTrend(String userId) {
    List<FileStatisticsVO.UploadTrend> trends = new ArrayList<>();
    LocalDate today = LocalDate.now();

    for (int i = 6; i >= 0; i--) {
      LocalDate date = today.minusDays(i);
      LocalDateTime start = date.atStartOfDay();
      LocalDateTime end = date.plusDays(1).atStartOfDay();

      List<Long> fileSizes = fileMapper.findFileSizesByUploaderIdAndDateRange(userId, start, end);

      Long count = (long) fileSizes.size();
      Long size = fileSizes.stream().mapToLong(Long::longValue).sum();

      trends.add(FileStatisticsVO.UploadTrend.builder()
          .date(date.toString())
          .count(count)
          .size(size)
          .build());
    }

    return trends;
  }

  private List<FileStatisticsVO.UploadTrend> getSystemUploadTrend() {
    List<FileStatisticsVO.UploadTrend> trends = new ArrayList<>();
    LocalDate today = LocalDate.now();

    for (int i = 6; i >= 0; i--) {
      LocalDate date = today.minusDays(i);
      LocalDateTime start = date.atStartOfDay();
      LocalDateTime end = date.plusDays(1).atStartOfDay();

      LambdaQueryWrapper<File> wrapper = new LambdaQueryWrapper<>();
      wrapper.eq(File::getStatus, "ACTIVE")
          .ge(File::getCreatedAt, start)
          .lt(File::getCreatedAt, end)
          .select(File::getFileSize);
      List<File> files = fileMapper.selectList(wrapper);

      Long count = (long) files.size();
      Long size = files.stream().mapToLong(File::getFileSize).sum();

      trends.add(FileStatisticsVO.UploadTrend.builder()
          .date(date.toString())
          .count(count)
          .size(size)
          .build());
    }

    return trends;
  }

  private List<FileStatisticsVO.CategoryStatistics> getCategoryStatistics(String userId) {
    List<File> files = fileMapper.findCategoryStatsByUploaderId(userId);

    Map<String, List<File>> categoryFilesMap = files.stream()
        .filter(file -> file.getCategoryId() != null)
        .collect(Collectors.groupingBy(File::getCategoryId));

    List<FileStatisticsVO.CategoryStatistics> statistics = new ArrayList<>();

    for (Map.Entry<String, List<File>> entry : categoryFilesMap.entrySet()) {
      FileCategory category = categoryMapper.selectById(entry.getKey());
      if (category != null) {
        List<File> categoryFiles = entry.getValue();
        Long fileCount = (long) categoryFiles.size();
        Long storageSize = categoryFiles.stream().mapToLong(File::getFileSize).sum();

        statistics.add(FileStatisticsVO.CategoryStatistics.builder()
            .categoryId(category.getId())
            .categoryName(category.getName())
            .fileCount(fileCount)
            .storageSize(storageSize)
            .build());
      }
    }

    return statistics.stream()
        .sorted((a, b) -> Long.compare(b.getFileCount(), a.getFileCount()))
        .collect(Collectors.toList());
  }

  private List<FileStatisticsVO.CategoryStatistics> getSystemCategoryStatistics() {
    LambdaQueryWrapper<File> wrapper = new LambdaQueryWrapper<>();
    wrapper.eq(File::getStatus, "ACTIVE")
        .select(File::getCategoryId, File::getFileSize);
    List<File> files = fileMapper.selectList(wrapper);

    Map<String, List<File>> categoryFilesMap = files.stream()
        .filter(file -> file.getCategoryId() != null)
        .collect(Collectors.groupingBy(File::getCategoryId));

    List<FileStatisticsVO.CategoryStatistics> statistics = new ArrayList<>();

    for (Map.Entry<String, List<File>> entry : categoryFilesMap.entrySet()) {
      FileCategory category = categoryMapper.selectById(entry.getKey());
      if (category != null) {
        List<File> categoryFiles = entry.getValue();
        Long fileCount = (long) categoryFiles.size();
        Long storageSize = categoryFiles.stream().mapToLong(File::getFileSize).sum();

        statistics.add(FileStatisticsVO.CategoryStatistics.builder()
            .categoryId(category.getId())
            .categoryName(category.getName())
            .fileCount(fileCount)
            .storageSize(storageSize)
            .build());
      }
    }

    return statistics.stream()
        .sorted((a, b) -> Long.compare(b.getFileCount(), a.getFileCount()))
        .collect(Collectors.toList());
  }

  private FileStatisticsVO.StorageUsage getStorageUsage(Long used) {
    Long total = 10L * 1024 * 1024 * 1024;
    Long remaining = total - used;
    Double percentage = (used * 100.0) / total;

    return FileStatisticsVO.StorageUsage.builder()
        .used(used)
        .total(total)
        .percentage(percentage)
        .remaining(remaining)
        .build();
  }

  private String getFileType(String mimeType) {
    if (mimeType == null) return "OTHER";
    if (mimeType.startsWith("image/")) return "IMAGE";
    if (mimeType.startsWith("video/")) return "VIDEO";
    if (mimeType.startsWith("audio/")) return "AUDIO";
    if (mimeType.contains("pdf")) return "PDF";
    if (mimeType.contains("word") || mimeType.contains("document")) return "DOCUMENT";
    if (mimeType.contains("excel") || mimeType.contains("spreadsheet")) return "SPREADSHEET";
    if (mimeType.contains("zip") || mimeType.contains("rar") || mimeType.contains("archive")) return "ARCHIVE";
    return "OTHER";
  }

  private String getTypeName(String type) {
    switch (type) {
      case "IMAGE": return "图片";
      case "VIDEO": return "视频";
      case "AUDIO": return "音频";
      case "PDF": return "PDF";
      case "DOCUMENT": return "文档";
      case "SPREADSHEET": return "表格";
      case "ARCHIVE": return "压缩包";
      default: return "其他";
    }
  }
}
