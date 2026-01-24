package com.idropin.domain.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 分类创建请求
 *
 * @author Idrop.in Team
 */
@Data
public class CategoryCreateRequest {

    /**
     * 分类名称
     */
    @NotBlank(message = "分类名称不能为空")
    private String name;

    /**
     * 父分类ID
     */
    private String parentId;

    /**
     * 图标
     */
    private String icon;

    /**
     * 颜色
     */
    private String color;
}
