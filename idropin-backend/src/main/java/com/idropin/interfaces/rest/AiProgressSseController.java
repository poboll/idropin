package com.idropin.interfaces.rest;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

@Slf4j
@RestController
@RequestMapping("/tasks")
public class AiProgressSseController {

    private static final ConcurrentHashMap<String, Set<SseEmitter>> taskEmitters = new ConcurrentHashMap<>();

    @GetMapping(value = "/{taskId}/ai-progress", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@PathVariable String taskId) {
        SseEmitter emitter = new SseEmitter(300_000L);
        taskEmitters.computeIfAbsent(taskId, k -> new CopyOnWriteArraySet<>()).add(emitter);

        Runnable cleanup = () -> {
            Set<SseEmitter> set = taskEmitters.get(taskId);
            if (set != null) {
                set.remove(emitter);
                if (set.isEmpty()) taskEmitters.remove(taskId);
            }
        };
        emitter.onCompletion(cleanup);
        emitter.onTimeout(cleanup);

        try {
            emitter.send(SseEmitter.event().name("connected").data(Map.of("taskId", taskId)));
        } catch (IOException e) {
            cleanup.run();
        }
        return emitter;
    }

    public static void broadcast(String taskId, String submissionId, int status, Integer score) {
        Set<SseEmitter> emitters = taskEmitters.get(taskId);
        if (emitters == null || emitters.isEmpty()) return;

        Map<String, Object> payload = new java.util.LinkedHashMap<>();
        payload.put("submissionId", submissionId);
        payload.put("status", status);
        if (score != null) payload.put("score", score);
        payload.put("timestamp", System.currentTimeMillis());

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name("ai-progress").data(payload));
            } catch (IOException e) {
                emitters.remove(emitter);
            }
        }
    }
}
