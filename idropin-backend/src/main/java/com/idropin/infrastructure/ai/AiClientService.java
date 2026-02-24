package com.idropin.infrastructure.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.idropin.application.service.ConfigService;
import com.idropin.domain.vo.AiEvaluationResult;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
public class AiClientService {

    private final ConfigService configService;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    public AiClientService(ConfigService configService, ObjectMapper objectMapper) {
        this.configService = configService;
        this.objectMapper = objectMapper;
        org.springframework.http.client.SimpleClientHttpRequestFactory factory =
                new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(15_000); // 15s
        factory.setReadTimeout(90_000);    // 90s — AI inference can be slow
        this.restTemplate = new RestTemplate(factory);
    }


    private static final String JSON_SCHEMA_CONSTRAINT = """

            无论采用何种评价标准，必须严格按照以下JSON格式返回，不要包含其他文字：
            {
              "score": <0-100的整数总分>,
              "dimensions": {
                "完整性": <0-100整数>,
                "准确性": <0-100整数>,
                "规范性": <0-100整数>,
                "创新性": <0-100整数>
              },
              "feedback": "<200字以内的详细评语字符串>",
              "summary": "<50字以内的一句话总结字符串>"
            }
            """;

    private static final String DEFAULT_SYSTEM_PROMPT = """
            你是一位严格且经验丰富的专业作业批阅助手。请根据以下评分规范对提交内容进行客观评估。

            ■ 评分校准要求（极其重要）：
            - 你必须使用完整的 0-100 分数区间，严禁集中在 70-90 分段
            - 优秀提交（内容完整、准确、规范、有独到见解）：90-100分
            - 良好提交（总体达标，少量不足）：75-89分
            - 一般提交（基本完成但存在明显问题）：60-74分
            - 较差提交（大量缺失、错误或敷衍）：40-59分
            - 极差提交（几乎无有效内容或完全跑题）：0-39分

            ■ 四维度评分标准：
            【完整性】覆盖了任务要求的多少内容？
              90+：全面覆盖所有要求 | 70-89：覆盖多数要求 | 50-69：仅部分覆盖 | <50：严重缺失
            【准确性】内容是否正确、有据可依？
              90+：无事实错误 | 70-89：少量小错 | 50-69：有明显错误 | <50：大量错误
            【规范性】格式、结构、语言是否专业？
              90+：格式完美 | 70-89：格式较好 | 50-69：格式粗糙 | <50：毫无章法
            【创新性】是否有独到观点或创造性思考？
              90+：见解深刻独到 | 70-89：有自己思考 | 50-69：照搬常见内容 | <50：纯粹复制

            ■ 总分计算：
            总分 = 完整性×0.3 + 准确性×0.3 + 规范性×0.2 + 创新性×0.2（四舍五入取整）
            各维度分数必须独立评估，可以出现较大差异（如创新性20分但完整性85分）。

            ■ 反馈要求：
            - feedback 必须指出具体的优点和不足，引用提交内容中的具体段落或表述
            - summary 需一句话概括整体质量等级

            仅返回JSON，不要包含其他文字。
            """;

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

    public AiEvaluationResult evaluate(String text, String taskTitle, String customPrompt,
                                        java.util.List<java.util.Map<String, Object>> customDimensions) {
        String baseUrl = configService.getSystemConfigValue("ai.base_url");
        String apiKey = configService.getSystemConfigValue("ai.api_key");
        String model = configService.getSystemConfigValue("ai.chat_model");
        HttpHeaders headers = buildHeaders(apiKey);
        String systemPrompt = buildSystemPrompt(customPrompt, customDimensions);
        String userPrompt = String.format("任务标题：%s\n\n提交内容：\n%s", taskTitle, text);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", model);
        body.put("messages", List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", userPrompt)
        ));
        body.put("response_format", Map.of("type", "json_object"));
        body.put("temperature", 0.5);
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

    private String buildSystemPrompt(String customPrompt, java.util.List<java.util.Map<String, Object>> customDimensions) {
        if (customDimensions != null && !customDimensions.isEmpty()) {
            return buildDimensionPrompt(customDimensions);
        }
        if (customPrompt != null && !customPrompt.isBlank()) {
            return customPrompt + JSON_SCHEMA_CONSTRAINT;
        }
        return DEFAULT_SYSTEM_PROMPT;
    }

    private String buildDimensionPrompt(java.util.List<java.util.Map<String, Object>> dims) {
        StringBuilder sb = new StringBuilder();
        sb.append("你是一位严格且经验丰富的专业作业批阅助手。请根据以下自定义评分维度对提交内容进行客观评估。\n\n");
        sb.append("■ 评分校准要求（极其重要）：\n");
        sb.append("- 你必须使用完整的 0-100 分数区间，严禁集中在 70-90 分段\n");
        sb.append("- 优秀提交：90-100分 | 良好：75-89分 | 一般：60-74分 | 较差：40-59分 | 极差：0-39分\n\n");
        sb.append("■ 评分维度：\n");
        StringBuilder dimJson = new StringBuilder();
        for (var dim : dims) {
            String name = String.valueOf(dim.get("name"));
            Object weightObj = dim.get("weight");
            int weight = weightObj instanceof Number ? ((Number) weightObj).intValue() : 25;
            sb.append(String.format("【%s】权重: %d%%\n", name, weight));
            if (!dimJson.isEmpty()) dimJson.append(",\n    ");
            dimJson.append(String.format("\"%s\": <0-100整数>", name));
        }
        sb.append("\n■ 总分计算：总分 = 各维度加权平均（四舍五入取整）\n");
        sb.append("各维度分数必须独立评估，可以出现较大差异。\n\n");
        sb.append("■ 反馈要求：\n");
        sb.append("- feedback 必须指出具体的优点和不足\n");
        sb.append("- summary 需一句话概括整体质量等级\n\n");
        sb.append("无论采用何种评价标准，必须严格按照以下JSON格式返回，不要包含其他文字：\n");
        sb.append("{\n");
        sb.append("  \"score\": <0-100的整数总分>,\n");
        sb.append("  \"dimensions\": {\n    ");
        sb.append(dimJson);
        sb.append("\n  },\n");
        sb.append("  \"feedback\": \"<200字以内的详细评语字符串>\",\n");
        sb.append("  \"summary\": \"<50字以内的一句话总结字符串>\"\n");
        sb.append("}\n");
        return sb.toString();
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
