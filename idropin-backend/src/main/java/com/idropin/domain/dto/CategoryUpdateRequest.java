package com.idropin.domain.dto;

import lombok.Data;

/**
 * 分类更新请求
 *
 * @author Idrop.in Team
 */
@Data
public class CategoryUpdateRequest {

    /**
     * 分类名称
     */
    private String name;

    /**
     * 图标
     */
    private String icon;

    /**
     * 颜色
     */
    private String color;

    /**
     * 排序顺序
     */
    private Integer sortOrder;
}
