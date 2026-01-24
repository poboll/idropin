package com.idropin.application.service;

import com.idropin.domain.dto.CategoryCreateRequest;
import com.idropin.domain.dto.CategoryUpdateRequest;
import com.idropin.domain.entity.FileCategory;
import com.idropin.domain.vo.CategoryTreeVO;

import java.util.List;

/**
 * 分类服务接口
 *
 * @author Idrop.in Team
 */
public interface CategoryService {

    /**
     * 创建分类
     */
    FileCategory createCategory(CategoryCreateRequest request, String userId);

    /**
     * 获取分类树
     */
    List<CategoryTreeVO> getCategoryTree(String userId);

    /**
     * 获取分类详情
     */
    FileCategory getCategory(String categoryId, String userId);

    /**
     * 更新分类
     */
    FileCategory updateCategory(String categoryId, CategoryUpdateRequest request, String userId);

    /**
     * 删除分类
     */
    void deleteCategory(String categoryId, String userId);

    /**
     * 获取用户所有分类
     */
    List<FileCategory> getAllCategories(String userId);
}
