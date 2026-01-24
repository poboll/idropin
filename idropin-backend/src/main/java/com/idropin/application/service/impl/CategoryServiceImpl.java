package com.idropin.application.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.idropin.application.service.CategoryService;
import com.idropin.common.exception.BusinessException;
import com.idropin.domain.dto.CategoryCreateRequest;
import com.idropin.domain.dto.CategoryUpdateRequest;
import com.idropin.domain.entity.File;
import com.idropin.domain.entity.FileCategory;
import com.idropin.domain.vo.CategoryTreeVO;
import com.idropin.infrastructure.persistence.mapper.FileCategoryMapper;
import com.idropin.infrastructure.persistence.mapper.FileMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 分类服务实现类
 *
 * @author Idrop.in Team
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final FileCategoryMapper categoryMapper;
    private final FileMapper fileMapper;

    @Override
    @Transactional
    public FileCategory createCategory(CategoryCreateRequest request, String userId) {
        if (request.getParentId() != null) {
            FileCategory parent = categoryMapper.selectById(request.getParentId());
            if (parent == null || !parent.getUserId().equals(userId)) {
                throw new BusinessException("父分类不存在");
            }
        }

        FileCategory category = new FileCategory();
        category.setName(request.getName());
        category.setParentId(request.getParentId());
        category.setUserId(userId);
        category.setIcon(request.getIcon());
        category.setColor(request.getColor());
        category.setSortOrder(0);
        category.setCreatedAt(LocalDateTime.now());

        categoryMapper.insert(category);
        log.info("Category created: {} by user {}", category.getName(), userId);

        return category;
    }

    @Override
    public List<CategoryTreeVO> getCategoryTree(String userId) {
        List<FileCategory> allCategories = categoryMapper.findByUserId(userId);
        
        Map<String, Long> fileCountMap = new HashMap<>();
        for (FileCategory category : allCategories) {
            long count = fileMapper.countByCategoryId(category.getId());
            fileCountMap.put(category.getId(), count);
        }

        return buildCategoryTree(allCategories, fileCountMap);
    }

    @Override
    public FileCategory getCategory(String categoryId, String userId) {
        FileCategory category = categoryMapper.selectById(categoryId);
        if (category == null) {
            throw new BusinessException("分类不存在");
        }
        if (!category.getUserId().equals(userId)) {
            throw new BusinessException("无权限访问此分类");
        }
        return category;
    }

    @Override
    @Transactional
    public FileCategory updateCategory(String categoryId, CategoryUpdateRequest request, String userId) {
        FileCategory category = getCategory(categoryId, userId);

        if (StringUtils.hasText(request.getName())) {
            category.setName(request.getName());
        }
        if (request.getIcon() != null) {
            category.setIcon(request.getIcon());
        }
        if (request.getColor() != null) {
            category.setColor(request.getColor());
        }
        if (request.getSortOrder() != null) {
            category.setSortOrder(request.getSortOrder());
        }

        categoryMapper.updateById(category);
        log.info("Category updated: {} by user {}", categoryId, userId);

        return category;
    }

    @Override
    @Transactional
    public void deleteCategory(String categoryId, String userId) {
        FileCategory category = getCategory(categoryId, userId);

        List<FileCategory> children = categoryMapper.findByParentId(categoryId, userId);
        if (!children.isEmpty()) {
            throw new BusinessException("请先删除子分类");
        }

        LambdaQueryWrapper<File> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(File::getCategoryId, categoryId);
        List<File> files = fileMapper.selectList(wrapper);
        for (File file : files) {
            file.setCategoryId(null);
            fileMapper.updateById(file);
        }

        categoryMapper.deleteById(categoryId);
        log.info("Category deleted: {} by user {}", categoryId, userId);
    }

    @Override
    public List<FileCategory> getAllCategories(String userId) {
        return categoryMapper.findByUserId(userId);
    }

    private List<CategoryTreeVO> buildCategoryTree(List<FileCategory> categories, Map<String, Long> fileCountMap) {
        Map<String, List<FileCategory>> childrenMap = categories.stream()
                .filter(c -> c.getParentId() != null)
                .collect(Collectors.groupingBy(FileCategory::getParentId));

        List<FileCategory> rootCategories = categories.stream()
                .filter(c -> c.getParentId() == null)
                .sorted(Comparator.comparing(FileCategory::getSortOrder, Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());

        return rootCategories.stream()
                .map(root -> buildTreeNode(root, childrenMap, fileCountMap))
                .collect(Collectors.toList());
    }

    private CategoryTreeVO buildTreeNode(FileCategory category, Map<String, List<FileCategory>> childrenMap, 
                                         Map<String, Long> fileCountMap) {
        CategoryTreeVO node = CategoryTreeVO.fromEntity(category, fileCountMap.getOrDefault(category.getId(), 0L));

        List<FileCategory> children = childrenMap.get(category.getId());
        if (children != null && !children.isEmpty()) {
            List<CategoryTreeVO> childNodes = children.stream()
                    .sorted(Comparator.comparing(FileCategory::getSortOrder, Comparator.nullsLast(Comparator.naturalOrder())))
                    .map(child -> buildTreeNode(child, childrenMap, fileCountMap))
                    .collect(Collectors.toList());
            node.setChildren(childNodes);
        }

        return node;
    }
}
