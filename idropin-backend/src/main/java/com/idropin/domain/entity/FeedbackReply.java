package com.idropin.domain.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 反馈回复实体
 *
 * @author Idrop.in Team
 */
@Data
@TableName("sys_feedback_reply")
public class FeedbackReply {

    @TableId(type = IdType.ASSIGN_UUID)
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
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
