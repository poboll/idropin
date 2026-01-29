package com.idropin.domain.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;

/**
 * 回复反馈请求
 *
 * @author Idrop.in Team
 */
@Data
public class ReplyFeedbackRequest {
    
    /**
     * 回复内容
     */
    @NotBlank(message = "回复内容不能为空")
    private String content;
}
