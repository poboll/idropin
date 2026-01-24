package com.idropin.domain.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 任务更多信息实体
 *
 * @author Idrop.in Team
 */
@Data
@TableName("task_more_info")
public class TaskMoreInfo {
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 任务ID (存储为字符串，数据库为UUID)
     */
    private String taskId;

    /**
     * 截止时间提示
     */
    private String ddl;

    /**
     * 任务提示信息
     */
    private String tip;

    /**
     * 任务详细信息
     */
    private String info;

    /**
     * 是否需要填写人员信息
     */
    private Boolean people;

    /**
     * 文件格式要求
     */
    private String format;

    /**
     * 模板文件路径
     */
    private String template;

    /**
     * 绑定字段
     */
    private String bindField;

    /**
     * 是否允许重写
     */
    private Boolean rewrite;

    /**
     * 创建时间
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
