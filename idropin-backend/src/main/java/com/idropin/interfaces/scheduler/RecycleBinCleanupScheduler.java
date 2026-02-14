package com.idropin.interfaces.scheduler;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.idropin.domain.entity.CollectionTask;
import com.idropin.infrastructure.persistence.mapper.CollectionTaskMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class RecycleBinCleanupScheduler {

  private final CollectionTaskMapper collectionTaskMapper;

  @Scheduled(cron = "0 0 2 * * ?")
  public void cleanupExpiredRecycleBinItems() {
    try {
      LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
      
      LambdaQueryWrapper<CollectionTask> wrapper = new LambdaQueryWrapper<>();
      wrapper.eq(CollectionTask::getDeleted, true)
             .lt(CollectionTask::getDeletedAt, thirtyDaysAgo);
      
      List<CollectionTask> expiredTasks = collectionTaskMapper.selectList(wrapper);
      
      if (expiredTasks != null && !expiredTasks.isEmpty()) {
        for (CollectionTask task : expiredTasks) {
          collectionTaskMapper.deleteById(task.getId());
        }
        log.info("Cleaned up {} expired tasks from recycle bin", expiredTasks.size());
      }
    } catch (Exception e) {
      log.error("Failed to cleanup recycle bin", e);
    }
  }
}
