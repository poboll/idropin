package com.idropin.domain.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 发送消息请求
 *
 * @author Idrop.in Team
 */
@Data
public class SendMessageRequest {
    
    /**
     * 消息标题
     */
    @NotBlank(message = "消息标题不能为空")
    @Size(max = 200, message = "消息标题不能超过200个字符")
    private String title;
    
    /**
     * 消息内容
     */
    @NotBlank(message = "消息内容不能为空")
    private String content;
}
