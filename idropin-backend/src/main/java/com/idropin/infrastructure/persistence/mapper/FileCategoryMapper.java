package com.idropin.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.idropin.domain.entity.FileCategory;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 文件分类Mapper
 *
 * @author Idrop.in Team
 */
@Mapper
public interface FileCategoryMapper extends BaseMapper<FileCategory> {

    /**
     * 根据用户ID查询所有分类
     */
    @Select("SELECT * FROM file_category WHERE user_id = #{userId} ORDER BY sort_order, created_at")
    List<FileCategory> findByUserId(@Param("userId") String userId);

    /**
     * 根据父分类ID查询子分类
     */
    @Select("SELECT * FROM file_category WHERE parent_id = #{parentId} AND user_id = #{userId} ORDER BY sort_order")
    List<FileCategory> findByParentId(@Param("parentId") String parentId, @Param("userId") String userId);

    /**
     * 查询顶级分类（无父分类）
     */
    @Select("SELECT * FROM file_category WHERE parent_id IS NULL AND user_id = #{userId} ORDER BY sort_order")
    List<FileCategory> findRootCategories(@Param("userId") String userId);
}
