package com.idropin.domain.vo;

import com.idropin.domain.entity.FileCategory;
import lombok.Data;

/**
 * 分类视图对象
 *
 * @author Idrop.in Team
 */
@Data
public class CategoryVO {

    private String id;
    private String name;
    private String parentId;
    private String icon;
    private String color;
    private Integer sortOrder;
    private Long fileCount;

    /**
     * 从实体转换为VO
     */
    public static CategoryVO fromEntity(FileCategory category) {
        CategoryVO vo = new CategoryVO();
        vo.setId(category.getId());
        vo.setName(category.getName());
        vo.setParentId(category.getParentId());
        vo.setIcon(category.getIcon());
        vo.setColor(category.getColor());
        vo.setSortOrder(category.getSortOrder());
        return vo;
    }

    /**
     * 从实体转换为VO（带文件数量）
     */
    public static CategoryVO fromEntity(FileCategory category, Long fileCount) {
        CategoryVO vo = fromEntity(category);
        vo.setFileCount(fileCount);
        return vo;
    }
}
