package com.idropin.domain.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiEvaluationResult {

    private Integer score;

    private Map<String, Integer> dimensions;

    private String feedback;

    private String summary;

    private String evaluatedAt;
}
