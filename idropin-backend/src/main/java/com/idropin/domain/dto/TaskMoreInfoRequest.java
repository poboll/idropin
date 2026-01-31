package com.idropin.domain.dto;

import lombok.Data;

/**
 * 任务更多信息请求
 *
 * @author Idrop.in Team
 */
@Data
public class TaskMoreInfoRequest {
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
     * 是否使用提交信息自动更新文件名
     */
    private Boolean autoRename;
}
