package com.idropin.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.idropin.domain.entity.File;
import org.apache.ibatis.annotations.*;

import java.util.List;

/**
 * 文件Mapper
 *
 * @author Idrop.in Team
 */
@Mapper
public interface FileMapper extends BaseMapper<File> {

    /**
     * 根据上传者ID查询文件列表
     */
    @Select("SELECT * FROM file WHERE uploader_id = CAST(#{uploaderId} AS UUID) AND status = 'ACTIVE' ORDER BY created_at DESC")
    List<File> findByUploaderId(@Param("uploaderId") String uploaderId);

    /**
     * 根据分类ID查询文件列表
     */
    @Select("SELECT * FROM file WHERE category_id = CAST(#{categoryId} AS UUID) AND status = 'ACTIVE' ORDER BY created_at DESC")
    List<File> findByCategoryId(@Param("categoryId") String categoryId);

    /**
     * 根据存储路径查询文件
     */
    @Select("SELECT * FROM file WHERE storage_path = #{storagePath}")
    File findByStoragePath(@Param("storagePath") String storagePath);

    /**
     * 统计用户文件数量
     */
    @Select("SELECT COUNT(*) FROM file WHERE uploader_id = CAST(#{uploaderId} AS UUID) AND status = 'ACTIVE'")
    long countByUploaderId(@Param("uploaderId") String uploaderId);

    /**
     * 统计用户文件总大小
     */
    @Select("SELECT COALESCE(SUM(file_size), 0) FROM file WHERE uploader_id = CAST(#{uploaderId} AS UUID) AND status = 'ACTIVE'")
    long sumFileSizeByUploaderId(@Param("uploaderId") String uploaderId);

    /**
     * 统计分类下的文件数量
     */
    @Select("SELECT COUNT(*) FROM file WHERE category_id = CAST(#{categoryId} AS UUID) AND status = 'ACTIVE'")
    long countByCategoryId(@Param("categoryId") String categoryId);

    /**
     * 根据用户ID和日期范围统计文件数量
     */
    @Select("SELECT COUNT(*) FROM file WHERE uploader_id = CAST(#{uploaderId} AS UUID) AND status = 'ACTIVE' AND created_at >= #{startDate} AND created_at < #{endDate}")
    long countByUploaderIdAndDateRange(@Param("uploaderId") String uploaderId, @Param("startDate") java.time.LocalDateTime startDate, @Param("endDate") java.time.LocalDateTime endDate);

    /**
     * 根据用户ID查询文件类型分布
     */
    @Select("SELECT mime_type FROM file WHERE uploader_id = CAST(#{uploaderId} AS UUID) AND status = 'ACTIVE'")
    List<String> findMimeTypesByUploaderId(@Param("uploaderId") String uploaderId);

    /**
     * 根据用户ID和日期范围查询文件大小
     */
    @Select("SELECT file_size FROM file WHERE uploader_id = CAST(#{uploaderId} AS UUID) AND status = 'ACTIVE' AND created_at >= #{startDate} AND created_at < #{endDate}")
    List<Long> findFileSizesByUploaderIdAndDateRange(@Param("uploaderId") String uploaderId, @Param("startDate") java.time.LocalDateTime startDate, @Param("endDate") java.time.LocalDateTime endDate);

    /**
     * 根据用户ID查询分类统计
     */
    @Select("SELECT category_id, file_size FROM file WHERE uploader_id = CAST(#{uploaderId} AS UUID) AND status = 'ACTIVE' AND category_id IS NOT NULL")
    List<File> findCategoryStatsByUploaderId(@Param("uploaderId") String uploaderId);

    /**
     * 分页查询用户文件
     */
    @Select("<script>" +
            "SELECT * FROM file WHERE uploader_id = CAST(#{uploaderId} AS UUID) AND status = 'ACTIVE' " +
            "<if test='categoryId != null'>AND category_id = CAST(#{categoryId} AS UUID)</if> " +
            "<if test='keyword != null and keyword != \"\"'>AND (name LIKE CONCAT('%', #{keyword}, '%') OR original_name LIKE CONCAT('%', #{keyword}, '%'))</if> " +
            "ORDER BY created_at DESC " +
            "LIMIT #{size} OFFSET #{offset}" +
            "</script>")
    List<File> findByUploaderIdWithPagination(@Param("uploaderId") String uploaderId, 
                                               @Param("categoryId") String categoryId,
                                               @Param("keyword") String keyword,
                                               @Param("size") int size, 
                                               @Param("offset") int offset);

    /**
     * 统计用户文件数量（带条件）
     */
    @Select("<script>" +
            "SELECT COUNT(*) FROM file WHERE uploader_id = CAST(#{uploaderId} AS UUID) AND status = 'ACTIVE' " +
            "<if test='categoryId != null'>AND category_id = CAST(#{categoryId} AS UUID)</if> " +
            "<if test='keyword != null and keyword != \"\"'>AND (name LIKE CONCAT('%', #{keyword}, '%') OR original_name LIKE CONCAT('%', #{keyword}, '%'))</if>" +
            "</script>")
    long countByUploaderIdWithCondition(@Param("uploaderId") String uploaderId, 
                                        @Param("categoryId") String categoryId,
                                        @Param("keyword") String keyword);

    /**
     * 插入文件记录（使用数据库生成UUID）
     */
    @Insert("INSERT INTO file (name, original_name, file_size, mime_type, storage_path, storage_provider, uploader_id, status, created_at, updated_at) " +
            "VALUES (#{name}, #{originalName}, #{fileSize}, #{mimeType}, #{storagePath}, #{storageProvider}, CAST(#{uploaderId} AS UUID), #{status}, #{createdAt}, #{updatedAt})")
    int insertFile(File file);

    /**
     * 根据存储路径查询最新插入的文件
     */
    @Select("SELECT * FROM file WHERE storage_path = #{storagePath} ORDER BY created_at DESC LIMIT 1")
    File findLatestByStoragePath(@Param("storagePath") String storagePath);
}
