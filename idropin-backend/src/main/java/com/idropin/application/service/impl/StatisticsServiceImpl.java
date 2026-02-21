package com.idropin.application.service.impl;

import com.idropin.application.service.ConfigService;
import com.idropin.application.service.StatisticsService;
import com.idropin.domain.entity.File;
import com.idropin.domain.entity.FileCategory;
import com.idropin.domain.vo.ArchitectureMetricsVO;
import com.idropin.domain.vo.FileStatisticsVO;
import com.idropin.infrastructure.persistence.mapper.FileCategoryMapper;
import com.idropin.infrastructure.persistence.mapper.FileMapper;
import com.idropin.infrastructure.persistence.mapper.FileSubmissionMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.lang.management.ManagementFactory;
import java.sql.Connection;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StatisticsServiceImpl implements StatisticsService {

  private final FileMapper fileMapper;
  private final FileCategoryMapper categoryMapper;
  private final FileSubmissionMapper fileSubmissionMapper;
  private final StringRedisTemplate redisTemplate;
  private final DataSource dataSource;
  private final ConfigService configService;

  @Override
  @Cacheable(value = "statistics", key = "'user:' + #userId")
  public FileStatisticsVO getFileStatistics(String userId) {
    Long ownFiles = fileMapper.countByUploaderId(userId);
    Long taskFiles = fileMapper.countByTaskOwner(userId);
    Long totalFiles = ownFiles + taskFiles;

    Long ownStorageSize = fileMapper.sumFileSizeByUploaderId(userId);
    Long taskStorageSize = fileMapper.sumFileSizeByTaskOwner(userId);
    Long totalStorageSize = ownStorageSize + taskStorageSize;

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
  @Cacheable(value = "statistics", key = "'system'")
  public FileStatisticsVO getSystemStatistics() {
    Long totalFiles = fileMapper.countAllActive();
    Long totalStorageSize = fileMapper.sumAllActiveFileSize();

    LocalDateTime todayStart = LocalDate.now().atStartOfDay();
    LocalDateTime todayEnd = LocalDate.now().plusDays(1).atStartOfDay();
    Long todayUploads = fileMapper.countAllActiveByDateRange(todayStart, todayEnd);

    LocalDateTime weekStart = LocalDate.now().minusDays(7).atStartOfDay();
    Long weekUploads = fileMapper.countAllActiveByDateRange(weekStart, todayEnd);

    LocalDateTime monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay();
    Long monthUploads = fileMapper.countAllActiveByDateRange(monthStart, todayEnd);

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

  @Override
  @Cacheable(value = "statistics", key = "'architecture'")
  public ArchitectureMetricsVO getArchitectureMetrics() {
    return ArchitectureMetricsVO.builder()
        .cache(buildCacheMetrics())
        .kafka(buildKafkaMetrics())
        .ai(buildAiMetrics())
        .system(buildSystemOverview())
        .build();
  }

  @Scheduled(fixedDelay = 60000)
  @CacheEvict(value = "statistics", key = "'architecture'")
  public void evictArchitectureMetricsCache() {}

  private ArchitectureMetricsVO.CacheMetrics buildCacheMetrics() {
    try {
      Properties info = redisTemplate.getConnectionFactory()
          .getConnection().serverCommands().info("stats");
      Properties memInfo = redisTemplate.getConnectionFactory()
          .getConnection().serverCommands().info("memory");

      long hits = Long.parseLong(info.getProperty("keyspace_hits", "0"));
      long misses = Long.parseLong(info.getProperty("keyspace_misses", "0"));
      long total = hits + misses;
      double hitRate = total > 0 ? (hits * 100.0 / total) : 0;
      long memBytes = Long.parseLong(memInfo.getProperty("used_memory", "0"));
      String memHuman = memInfo.getProperty("used_memory_human", "0B");
      Long dbSize = redisTemplate.getConnectionFactory()
          .getConnection().serverCommands().dbSize();

      return ArchitectureMetricsVO.CacheMetrics.builder()
          .hits(hits).misses(misses).hitRate(hitRate)
          .totalKeys(dbSize != null ? dbSize : 0)
          .memoryUsedBytes(memBytes).memoryUsedHuman(memHuman)
          .build();
    } catch (Exception e) {
      log.warn("Failed to get cache metrics: {}", e.getMessage());
      return ArchitectureMetricsVO.CacheMetrics.builder().build();
    }
  }

  private ArchitectureMetricsVO.KafkaMetrics buildKafkaMetrics() {
    return ArchitectureMetricsVO.KafkaMetrics.builder()
        .connected(false).topic("N/A").build();
  }

  private ArchitectureMetricsVO.AiMetrics buildAiMetrics() {
    try {
      List<Map<String, Object>> rows = fileSubmissionMapper.countGroupByAiStatus();
      long pending = 0, processing = 0, completed = 0, failed = 0;
      for (Map<String, Object> row : rows) {
        int status = ((Number) row.get("ai_status")).intValue();
        long cnt = ((Number) row.get("cnt")).longValue();
        if (status == 0) pending = cnt;
        else if (status == 1) processing = cnt;
        else if (status == 2) completed = cnt;
        else if (status == -1) failed = cnt;
      }
      long total = pending + processing + completed + failed;
      double successRate = total > 0 ? (completed * 100.0 / total) : 0;

      String apiKey = null;
      try { apiKey = configService.getSystemConfigValue("ai.api_key"); } catch (Exception ignored) {}
      boolean serviceAvailable = apiKey != null && !apiKey.isBlank();

      return ArchitectureMetricsVO.AiMetrics.builder()
          .totalProcessed(total).pendingCount(pending + processing)
          .successCount(completed).failedCount(failed)
          .successRate(successRate).serviceAvailable(serviceAvailable)
          .modelProvider("SiliconFlow")
          .build();
    } catch (Exception e) {
      log.warn("Failed to get AI metrics: {}", e.getMessage());
      return ArchitectureMetricsVO.AiMetrics.builder()
          .serviceAvailable(false).build();
    }
  }

  private ArchitectureMetricsVO.SystemOverview buildSystemOverview() {
    boolean pgConnected = false;
    boolean pgvector = false;
    try (Connection conn = dataSource.getConnection()) {
      pgConnected = conn.isValid(2);
      var rs = conn.createStatement().executeQuery(
          "SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname='vector')");
      if (rs.next()) pgvector = rs.getBoolean(1);
    } catch (Exception e) {
      log.warn("PG check failed: {}", e.getMessage());
    }

    boolean redisOk = false;
    try {
      String pong = redisTemplate.getConnectionFactory()
          .getConnection().ping();
      redisOk = "PONG".equals(pong);
    } catch (Exception ignored) {}

    Runtime rt = Runtime.getRuntime();
    long uptimeMs = ManagementFactory.getRuntimeMXBean().getUptime();

    return ArchitectureMetricsVO.SystemOverview.builder()
        .postgresConnected(pgConnected).redisConnected(redisOk)
        .kafkaConnected(buildKafkaMetrics().isConnected())
        .minioConnected(true).pgvectorEnabled(pgvector)
        .uptimeSeconds(uptimeMs / 1000)
        .javaVersion(System.getProperty("java.version"))
        .heapUsedMB((rt.totalMemory() - rt.freeMemory()) / (1024 * 1024))
        .heapMaxMB(rt.maxMemory() / (1024 * 1024))
        .build();
  }

  private Long countFilesByDateRange(String userId, LocalDateTime start, LocalDateTime end) {
    return fileMapper.countByUploaderIdAndDateRange(userId, start, end);
  }

  private List<FileStatisticsVO.FileTypeDistribution> getFileTypeDistribution(String userId) {
    List<String> ownMimeTypes = fileMapper.findMimeTypesByUploaderId(userId);
    List<String> taskMimeTypes = fileMapper.findMimeTypesByTaskOwner(userId);
    
    List<String> allMimeTypes = new ArrayList<>();
    allMimeTypes.addAll(ownMimeTypes);
    allMimeTypes.addAll(taskMimeTypes);

    Map<String, Long> typeCountMap = allMimeTypes.stream()
        .collect(Collectors.groupingBy(
            this::getFileType,
            Collectors.counting()));

    Long totalCount = (long) allMimeTypes.size();

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
    List<String> mimeTypes = fileMapper.findAllActiveMimeTypes();
    Map<String, Long> typeCountMap = mimeTypes.stream()
        .collect(Collectors.groupingBy(this::getFileType, Collectors.counting()));
    long totalCount = mimeTypes.size();
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

      List<Long> ownFileSizes = fileMapper.findFileSizesByUploaderIdAndDateRange(userId, start, end);
      List<Long> taskFileSizes = fileMapper.findFileSizesByTaskOwnerAndDateRange(userId, start, end);

      Long count = (long) (ownFileSizes.size() + taskFileSizes.size());
      Long size = ownFileSizes.stream().mapToLong(Long::longValue).sum() 
                + taskFileSizes.stream().mapToLong(Long::longValue).sum();

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
      long count = fileMapper.countAllActiveByDateRange(start, end);
      trends.add(FileStatisticsVO.UploadTrend.builder()
          .date(date.toString())
          .count(count)
          .size(0L)
          .build());
    }
    return trends;
  }

  private List<FileStatisticsVO.CategoryStatistics> getCategoryStatistics(String userId) {
    List<File> ownFiles = fileMapper.findCategoryStatsByUploaderId(userId);
    List<File> taskFiles = fileMapper.findCategoryStatsByTaskOwner(userId);

    List<File> allFiles = new ArrayList<>();
    allFiles.addAll(ownFiles);
    allFiles.addAll(taskFiles);

    Map<String, List<File>> categoryFilesMap = allFiles.stream()
        .filter(file -> file.getCategoryId() != null)
        .collect(Collectors.groupingBy(File::getCategoryId));

    Map<String, FileCategory> categoryCache = categoryMapper.findAll().stream()
        .collect(Collectors.toMap(FileCategory::getId, c -> c));

    List<FileStatisticsVO.CategoryStatistics> statistics = new ArrayList<>();

    for (Map.Entry<String, List<File>> entry : categoryFilesMap.entrySet()) {
      FileCategory category = categoryCache.get(entry.getKey());
      if (category != null) {
        List<File> categoryFiles = entry.getValue();
        statistics.add(FileStatisticsVO.CategoryStatistics.builder()
            .categoryId(category.getId())
            .categoryName(category.getName())
            .fileCount((long) categoryFiles.size())
            .storageSize(categoryFiles.stream().mapToLong(File::getFileSize).sum())
            .build());
      }
    }

    return statistics.stream()
        .sorted((a, b) -> Long.compare(b.getFileCount(), a.getFileCount()))
        .collect(Collectors.toList());
  }

  private List<FileStatisticsVO.CategoryStatistics> getSystemCategoryStatistics() {
    List<File> files = fileMapper.findAllActiveCategoryStats();
    Map<String, List<File>> categoryFilesMap = files.stream()
        .filter(f -> f.getCategoryId() != null)
        .collect(Collectors.groupingBy(File::getCategoryId));
    Map<String, FileCategory> categoryCache = categoryMapper.findAll().stream()
        .collect(Collectors.toMap(FileCategory::getId, c -> c));
    List<FileStatisticsVO.CategoryStatistics> statistics = new ArrayList<>();
    for (Map.Entry<String, List<File>> entry : categoryFilesMap.entrySet()) {
      FileCategory category = categoryCache.get(entry.getKey());
      if (category != null) {
        List<File> catFiles = entry.getValue();
        statistics.add(FileStatisticsVO.CategoryStatistics.builder()
            .categoryId(category.getId())
            .categoryName(category.getName())
            .fileCount((long) catFiles.size())
            .storageSize(catFiles.stream().mapToLong(File::getFileSize).sum())
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
