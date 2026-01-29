package com.idropin.domain.vo;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 反馈视图对象
 *
 * @author Idrop.in Team
 */
@Data
public class FeedbackVO {
    
    private String id;
    
    /**
     * 用户ID
     */
    private String userId;
    
    /**
     * 用户名
     */
    private String username;
    
    /**
     * 反馈标题
     */
    private String title;
    
    /**
     * 反馈内容
     */
    private String content;
    
    /**
     * 联系方式
     */
    private String contact;
    
    /**
     * 状态
     */
    private String status;
    
    /**
     * 回复数量
     */
    private Integer replyCount;
    
    /**
     * 创建时间
     */
    private LocalDateTime createdAt;
    
    /**
     * 更新时间
     */
    private LocalDateTime updatedAt;
}
