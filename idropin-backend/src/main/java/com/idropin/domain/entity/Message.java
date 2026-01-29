package com.idropin.domain.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 站内消息实体
 *
 * @author Idrop.in Team
 */
@Data
@TableName("sys_message")
public class Message {

    @TableId(type = IdType.ASSIGN_UUID)
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
     * 发送者ID（管理员ID，系统消息为NULL）
     */
    private String senderId;

    /**
     * 接收者ID
     */
    private String recipientId;

    /**
     * 是否已读
     */
    private Boolean isRead;

    /**
     * 创建时间
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    /**
     * 阅读时间
     */
    private LocalDateTime readAt;
}
