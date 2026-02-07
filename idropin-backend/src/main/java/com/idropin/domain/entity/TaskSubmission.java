package com.idropin.domain.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 任务提交记录实体
 */
@Data
@TableName("task_submission")
public class TaskSubmission {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    /**
     * 任务Key
     */
    private String taskKey;

    /**
     * 文件名
     */
    private String fileName;

    /**
     * 文件哈希
     */
    private String fileHash;

    /**
     * 文件大小
     */
    private Long fileSize;

    /**
     * 提交者姓名
     */
    private String submitterName;

    /**
     * 提交者邮箱
     */
    private String submitterEmail;

    /**
     * 提交信息（JSON格式）- 用于存储表单数据
     */
    private String submitInfo;

    /**
     * 信息数据（JSON格式）- 用于仅信息收集类型
     */
    private String infoData;

    /**
     * 提交时间
     */
    private LocalDateTime submittedAt;

    /**
     * 提交者ID（可选）
     */
    private String submitterId;

    /**
     * 提交者IP地址
     */
    private String submitterIp;

    /**
     * 状态：0-已提交，1-已撤回
     */
    private Integer status;

    /**
     * 提交时间
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
