package com.idropin.domain.vo;

import com.idropin.domain.entity.FileCategory;
import lombok.Data;
import java.util.ArrayList;
import java.util.List;

/**
 * 分类树视图对象
 *
 * @author Idrop.in Team
 */
@Data
public class CategoryTreeVO {

    private String id;
    private String name;
    private String icon;
    private String color;
    private Integer sortOrder;
    private Long fileCount;
    private List<CategoryTreeVO> children = new ArrayList<>();

    /**
     * 从实体转换为树节点VO
     */
    public static CategoryTreeVO fromEntity(FileCategory category) {
        CategoryTreeVO vo = new CategoryTreeVO();
        vo.setId(category.getId());
        vo.setName(category.getName());
        vo.setIcon(category.getIcon());
        vo.setColor(category.getColor());
        vo.setSortOrder(category.getSortOrder());
        return vo;
    }

    /**
     * 从实体转换为树节点VO（带文件数量）
     */
    public static CategoryTreeVO fromEntity(FileCategory category, Long fileCount) {
        CategoryTreeVO vo = fromEntity(category);
        vo.setFileCount(fileCount);
        return vo;
    }
}
