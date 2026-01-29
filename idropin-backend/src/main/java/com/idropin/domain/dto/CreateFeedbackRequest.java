package com.idropin.domain.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 创建反馈请求
 *
 * @author Idrop.in Team
 */
@Data
public class CreateFeedbackRequest {
    
    /**
     * 反馈标题
     */
    @NotBlank(message = "标题不能为空")
    @Size(max = 200, message = "标题不能超过200个字符")
    private String title;
    
    /**
     * 反馈内容
     */
    @NotBlank(message = "内容不能为空")
    private String content;
    
    /**
     * 联系方式
     */
    @Size(max = 100, message = "联系方式不能超过100个字符")
    private String contact;
}
