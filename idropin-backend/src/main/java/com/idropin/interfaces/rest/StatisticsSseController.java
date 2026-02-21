package com.idropin.interfaces.rest;

import com.idropin.application.service.StatisticsService;
import com.idropin.domain.vo.FileStatisticsVO;
import com.idropin.infrastructure.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@RestController
@RequestMapping("/statistics")
@RequiredArgsConstructor
public class StatisticsSseController {

    private final StatisticsService statisticsService;

    private final ConcurrentHashMap<String, SseEmitter> userEmitters = new ConcurrentHashMap<>();

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@AuthenticationPrincipal CustomUserDetails user) {
        if (user == null) {
            SseEmitter emitter = new SseEmitter(0L);
            emitter.complete();
            return emitter;
        }

        String userId = user.getUserId();
        SseEmitter emitter = new SseEmitter(300_000L);

        SseEmitter old = userEmitters.put(userId, emitter);
        if (old != null) old.complete();

        emitter.onCompletion(() -> userEmitters.remove(userId, emitter));
        emitter.onTimeout(() -> userEmitters.remove(userId, emitter));

        try {
            FileStatisticsVO stats = statisticsService.getFileStatistics(userId);
            emitter.send(SseEmitter.event().data(stats));
        } catch (IOException e) {
            userEmitters.remove(userId, emitter);
        }

        return emitter;
    }

    @Scheduled(fixedRate = 30_000)
    public void broadcast() {
        if (userEmitters.isEmpty()) return;

        for (Map.Entry<String, SseEmitter> entry : userEmitters.entrySet()) {
            String userId = entry.getKey();
            SseEmitter emitter = entry.getValue();
            try {
                FileStatisticsVO stats = statisticsService.getFileStatistics(userId);
                emitter.send(SseEmitter.event().data(stats));
            } catch (IOException e) {
                userEmitters.remove(userId, emitter);
            } catch (Exception e) {
                log.error("SSE broadcast failed for user {}: {}", userId, e.getMessage());
            }
        }
    }
}
