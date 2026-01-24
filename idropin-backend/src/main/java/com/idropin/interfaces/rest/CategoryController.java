package com.idropin.interfaces.rest;

import com.idropin.application.service.CategoryService;
import com.idropin.common.vo.Result;
import com.idropin.domain.dto.CategoryCreateRequest;
import com.idropin.domain.dto.CategoryUpdateRequest;
import com.idropin.domain.entity.FileCategory;
import com.idropin.domain.vo.CategoryTreeVO;
import com.idropin.domain.vo.CategoryVO;
import com.idropin.infrastructure.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 分类控制器
 *
 * @author Idrop.in Team
 */
@Slf4j
@RestController
@RequestMapping("/categories")
@RequiredArgsConstructor
@Tag(name = "文件分类", description = "文件分类管理相关接口")
public class CategoryController {

    private final CategoryService categoryService;

    @PostMapping
    @Operation(summary = "创建分类")
    public Result<CategoryVO> createCategory(
            @Valid @RequestBody CategoryCreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String userId = getUserId(userDetails);
        FileCategory category = categoryService.createCategory(request, userId);
        return Result.success(CategoryVO.fromEntity(category));
    }

    @GetMapping("/tree")
    @Operation(summary = "获取分类树")
    public Result<List<CategoryTreeVO>> getCategoryTree(
            @AuthenticationPrincipal UserDetails userDetails) {
        String userId = getUserId(userDetails);
        List<CategoryTreeVO> tree = categoryService.getCategoryTree(userId);
        return Result.success(tree);
    }

    @GetMapping
    @Operation(summary = "获取所有分类")
    public Result<List<CategoryVO>> getAllCategories(
            @AuthenticationPrincipal UserDetails userDetails) {
        String userId = getUserId(userDetails);
        List<FileCategory> categories = categoryService.getAllCategories(userId);
        List<CategoryVO> vos = categories.stream()
                .map(CategoryVO::fromEntity)
                .collect(Collectors.toList());
        return Result.success(vos);
    }

    @GetMapping("/{id}")
    @Operation(summary = "获取分类详情")
    public Result<CategoryVO> getCategory(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails userDetails) {
        String userId = getUserId(userDetails);
        FileCategory category = categoryService.getCategory(id, userId);
        return Result.success(CategoryVO.fromEntity(category));
    }

    @PutMapping("/{id}")
    @Operation(summary = "更新分类")
    public Result<CategoryVO> updateCategory(
            @PathVariable String id,
            @RequestBody CategoryUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String userId = getUserId(userDetails);
        FileCategory category = categoryService.updateCategory(id, request, userId);
        return Result.success(CategoryVO.fromEntity(category));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除分类")
    public Result<Void> deleteCategory(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails userDetails) {
        String userId = getUserId(userDetails);
        categoryService.deleteCategory(id, userId);
        return Result.success(null);
    }

    private String getUserId(UserDetails userDetails) {
        if (userDetails instanceof CustomUserDetails) {
            return ((CustomUserDetails) userDetails).getUserId();
        }
        throw new IllegalStateException("Invalid user details type");
    }
}
