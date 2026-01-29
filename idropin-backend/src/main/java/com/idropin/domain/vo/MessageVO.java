package com.idropin.domain.vo;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 消息视图对象
 *
 * @author Idrop.in Team
 */
@Data
public class MessageVO {
    
    private String id;
    
    /**
     * 消息标题
     */
    private String title;
    
    /**
     * 消息内容
     */
    private String content;
    
    /**
     * 发送者类型: admin-管理员, system-系统
     */
    private String senderType;
    
    /**
     * 发送者名称
     */
    private String senderName;
    
    /**
     * 是否已读
     */
    private Boolean isRead;
    
    /**
     * 创建时间
     */
    private LocalDateTime createdAt;
    
    /**
     * 阅读时间
     */
    private LocalDateTime readAt;
}
