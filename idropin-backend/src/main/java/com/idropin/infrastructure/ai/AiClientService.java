package com.idropin.infrastructure.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.idropin.application.service.ConfigService;
import com.idropin.domain.vo.AiEvaluationResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiClientService {

    private final ConfigService configService;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    public float[] generateEmbedding(String text) {
        String baseUrl = configService.getSystemConfigValue("ai.base_url");
        String apiKey = configService.getSystemConfigValue("ai.api_key");
        String model = configService.getSystemConfigValue("ai.embedding_model");
        String dimStr = configService.getSystemConfigValue("ai.embedding_dimensions");
        int dimensions = dimStr != null ? Integer.parseInt(dimStr) : 1024;

        HttpHeaders headers = buildHeaders(apiKey);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", model);
        body.put("input", text);
        body.put("dimensions", dimensions);

        try {
            ResponseEntity<JsonNode> resp = restTemplate.exchange(
                    baseUrl + "/embeddings",
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    JsonNode.class
            );

            JsonNode data = resp.getBody().get("data").get(0).get("embedding");
            float[] embedding = new float[data.size()];
            for (int i = 0; i < data.size(); i++) {
                embedding[i] = data.get(i).floatValue();
            }
            return embedding;
        } catch (Exception e) {
            log.error("Embedding API call failed: {}", e.getMessage());
            throw new AiServiceException("Embedding generation failed", e);
        }
    }

    public AiEvaluationResult evaluate(String text, String taskTitle, String customPrompt) {
        String baseUrl = configService.getSystemConfigValue("ai.base_url");
        String apiKey = configService.getSystemConfigValue("ai.api_key");
        String model = configService.getSystemConfigValue("ai.chat_model");

        HttpHeaders headers = buildHeaders(apiKey);

        String defaultPrompt = """
                你是一个专业的作业批阅助手。请对以下提交内容进行评估，返回严格的JSON格式：
                {
                  "score": <0-100的整数总分>,
                  "dimensions": {
                    "完整性": <0-100>,
                    "准确性": <0-100>,
                    "规范性": <0-100>,
                    "创新性": <0-100>
                  },
                  "feedback": "<200字以内的详细评语>",
                  "summary": "<50字以内的一句话总结>"
                }
                仅返回JSON，不要包含其他文字。
                """;
        String systemPrompt = (customPrompt != null && !customPrompt.isBlank()) ? customPrompt : defaultPrompt;

        String userPrompt = String.format("任务标题：%s\n\n提交内容：\n%s", taskTitle, text);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", model);
        body.put("messages", List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", userPrompt)
        ));
        body.put("response_format", Map.of("type", "json_object"));
        body.put("temperature", 0.3);

        try {
            ResponseEntity<JsonNode> resp = restTemplate.exchange(
                    baseUrl + "/chat/completions",
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    JsonNode.class
            );

            String content = resp.getBody()
                    .get("choices").get(0)
                    .get("message").get("content")
                    .asText();

            AiEvaluationResult result = objectMapper.readValue(content, AiEvaluationResult.class);
            result.setEvaluatedAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            return result;
        } catch (Exception e) {
            log.error("Chat completions API call failed: {}", e.getMessage());
            throw new AiServiceException("AI evaluation failed", e);
        }
    }

    private HttpHeaders buildHeaders(String apiKey) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);
        return headers;
    }

    public static class AiServiceException extends RuntimeException {
        public AiServiceException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
