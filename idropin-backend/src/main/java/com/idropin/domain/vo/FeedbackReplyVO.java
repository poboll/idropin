package com.idropin.domain.vo;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 反馈回复视图对象
 *
 * @author Idrop.in Team
 */
@Data
public class FeedbackReplyVO {
    
    private String id;
    
    /**
     * 反馈ID
     */
    private String feedbackId;
    
    /**
     * 用户ID
     */
    private String userId;
    
    /**
     * 用户名
     */
    private String username;
    
    /**
     * 回复内容
     */
    private String content;
    
    /**
     * 是否为管理员回复
     */
    private Boolean isAdmin;
    
    /**
     * 创建时间
     */
    private LocalDateTime createdAt;
}
