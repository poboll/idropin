package com.idropin.domain.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * 更新反馈状态请求
 *
 * @author Idrop.in Team
 */
@Data
public class UpdateFeedbackStatusRequest {
    
    /**
     * 状态: pending-待处理, in_progress-处理中, resolved-已解决, closed-已关闭
     */
    @NotBlank(message = "状态不能为空")
    @Pattern(regexp = "^(pending|in_progress|resolved|closed)$", message = "状态值无效")
    private String status;
}
