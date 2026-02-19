package com.idropin.infrastructure.scheduler;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.idropin.domain.entity.FileChunk;
import com.idropin.infrastructure.persistence.mapper.FileChunkMapper;
import com.idropin.infrastructure.storage.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class ChunkCleanupScheduler {

    private final FileChunkMapper fileChunkMapper;
    private final StorageService storageService;

    @Scheduled(fixedDelay = 3600000)
    public void cleanOrphanedChunks() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(24);
        LambdaQueryWrapper<FileChunk> wrapper = new LambdaQueryWrapper<>();
        wrapper.isNull(FileChunk::getFileId).lt(FileChunk::getCreatedAt, cutoff);
        List<FileChunk> orphans = fileChunkMapper.selectList(wrapper);
        if (orphans.isEmpty()) return;
        for (FileChunk chunk : orphans) {
            try {
                if (chunk.getStoragePath() != null) storageService.deleteFile(chunk.getStoragePath());
                fileChunkMapper.deleteById(chunk.getId());
            } catch (Exception e) {
                log.warn("Failed to clean orphaned chunk: {}", chunk.getId(), e);
            }
        }
        log.info("Cleaned {} orphaned chunks", orphans.size());
    }
}
