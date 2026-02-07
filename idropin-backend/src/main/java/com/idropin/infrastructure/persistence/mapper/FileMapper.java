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
     * 覆盖 BaseMapper#selectById：file.id 为 uuid，但领域层使用 String 承载。
     * PostgreSQL 对 uuid = varchar 不做隐式转换，所以这里显式用 ::text 比较。
     */
    @Select("SELECT * FROM file WHERE id::text = #{id} AND (deleted IS NULL OR deleted = false)")
    File selectById(@Param("id") String id);

    /**
     * 根据上传者ID查询文件列表
     */
    @Select("SELECT * FROM file WHERE uploader_id::text = #{uploaderId} AND status = 'ACTIVE' AND (deleted IS NULL OR deleted = false) ORDER BY created_at DESC")
    List<File> findByUploaderId(@Param("uploaderId") String uploaderId);

    /**
     * 根据分类ID查询文件列表
     */
    @Select("SELECT * FROM file WHERE category_id::text = #{categoryId} AND status = 'ACTIVE' AND (deleted IS NULL OR deleted = false) ORDER BY created_at DESC")
    List<File> findByCategoryId(@Param("categoryId") String categoryId);

    /**
     * 根据存储路径查询文件
     */
    @Select("SELECT * FROM file WHERE storage_path = #{storagePath}")
    File findByStoragePath(@Param("storagePath") String storagePath);

    /**
     * 统计用户文件数量
     */
    @Select("SELECT COUNT(*) FROM file WHERE uploader_id::text = #{uploaderId} AND status = 'ACTIVE' AND (deleted IS NULL OR deleted = false)")
    long countByUploaderId(@Param("uploaderId") String uploaderId);

    /**
     * 统计用户文件总大小
     */
    @Select("SELECT COALESCE(SUM(file_size), 0) FROM file WHERE uploader_id::text = #{uploaderId} AND status = 'ACTIVE' AND (deleted IS NULL OR deleted = false)")
    long sumFileSizeByUploaderId(@Param("uploaderId") String uploaderId);

    /**
     * 统计分类下的文件数量
     */
    @Select("SELECT COUNT(*) FROM file WHERE category_id::text = #{categoryId} AND status = 'ACTIVE' AND (deleted IS NULL OR deleted = false)")
    long countByCategoryId(@Param("categoryId") String categoryId);

    /**
     * 根据用户ID和日期范围统计文件数量
     */
    @Select("SELECT COUNT(*) FROM file WHERE uploader_id::text = #{uploaderId} AND status = 'ACTIVE' AND (deleted IS NULL OR deleted = false) AND created_at >= #{startDate} AND created_at < #{endDate}")
    long countByUploaderIdAndDateRange(@Param("uploaderId") String uploaderId, @Param("startDate") java.time.LocalDateTime startDate, @Param("endDate") java.time.LocalDateTime endDate);

    /**
     * 根据用户ID查询文件类型分布
     */
    @Select("SELECT mime_type FROM file WHERE uploader_id::text = #{uploaderId} AND status = 'ACTIVE' AND (deleted IS NULL OR deleted = false)")
    List<String> findMimeTypesByUploaderId(@Param("uploaderId") String uploaderId);

    /**
     * 根据用户ID和日期范围查询文件大小
     */
    @Select("SELECT file_size FROM file WHERE uploader_id::text = #{uploaderId} AND status = 'ACTIVE' AND (deleted IS NULL OR deleted = false) AND created_at >= #{startDate} AND created_at < #{endDate}")
    List<Long> findFileSizesByUploaderIdAndDateRange(@Param("uploaderId") String uploaderId, @Param("startDate") java.time.LocalDateTime startDate, @Param("endDate") java.time.LocalDateTime endDate);

    /**
     * 根据用户ID查询分类统计
     */
    @Select("SELECT category_id, file_size FROM file WHERE uploader_id::text = #{uploaderId} AND status = 'ACTIVE' AND (deleted IS NULL OR deleted = false) AND category_id IS NOT NULL")
    List<File> findCategoryStatsByUploaderId(@Param("uploaderId") String uploaderId);

    /**
     * 分页查询用户文件
     */
    @Select("<script>" +
            "SELECT * FROM file WHERE uploader_id::text = #{uploaderId} AND status = 'ACTIVE' AND (deleted IS NULL OR deleted = false) " +
            "<if test='categoryId != null'>AND category_id::text = #{categoryId}</if> " +
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
            "SELECT COUNT(*) FROM file WHERE uploader_id::text = #{uploaderId} AND status = 'ACTIVE' AND (deleted IS NULL OR deleted = false) " +
            "<if test='categoryId != null'>AND category_id::text = #{categoryId}</if> " +
            "<if test='keyword != null and keyword != \"\"'>AND (name LIKE CONCAT('%', #{keyword}, '%') OR original_name LIKE CONCAT('%', #{keyword}, '%'))</if>" +
            "</script>")
    long countByUploaderIdWithCondition(@Param("uploaderId") String uploaderId, 
                                        @Param("categoryId") String categoryId,
                                        @Param("keyword") String keyword);

    /**
     * 插入文件记录
     */
    @Insert("INSERT INTO file (id, name, original_name, file_size, mime_type, storage_path, storage_provider, uploader_id, status, created_at, updated_at) " +
            "VALUES (#{id}::uuid, #{name}, #{originalName}, #{fileSize}, #{mimeType}, #{storagePath}, #{storageProvider}, #{uploaderId}::uuid, #{status}, #{createdAt}, #{updatedAt})")
    int insertFile(File file);

    /**
     * 根据存储路径查询最新插入的文件
     */
    @Select("SELECT * FROM file WHERE storage_path = #{storagePath} ORDER BY created_at DESC LIMIT 1")
    File findLatestByStoragePath(@Param("storagePath") String storagePath);

    /**
     * 查询用户任务提交文件的mimeType
     */
    @Select("SELECT f.mime_type FROM file f " +
            "INNER JOIN file_submission fs ON f.id::text = fs.file_id::text " +
            "INNER JOIN collection_task ct ON fs.task_id::text = ct.id::text " +
            "WHERE ct.created_by = #{userId} AND f.status = 'ACTIVE' " +
            "AND (f.deleted IS NULL OR f.deleted = false)")
    List<String> findMimeTypesByTaskOwner(@Param("userId") String userId);

    /**
     * 统计用户任务提交的文件数量
     */
    @Select("SELECT COUNT(*) FROM file f " +
            "INNER JOIN file_submission fs ON f.id::text = fs.file_id::text " +
            "INNER JOIN collection_task ct ON fs.task_id::text = ct.id::text " +
            "WHERE ct.created_by = #{userId} AND f.status = 'ACTIVE' " +
            "AND (f.deleted IS NULL OR f.deleted = false)")
    long countByTaskOwner(@Param("userId") String userId);

    /**
     * 统计用户任务提交的文件总大小
     */
    @Select("SELECT COALESCE(SUM(f.file_size), 0) FROM file f " +
            "INNER JOIN file_submission fs ON f.id::text = fs.file_id::text " +
            "INNER JOIN collection_task ct ON fs.task_id::text = ct.id::text " +
            "WHERE ct.created_by = #{userId} AND f.status = 'ACTIVE' " +
            "AND (f.deleted IS NULL OR f.deleted = false)")
    long sumFileSizeByTaskOwner(@Param("userId") String userId);

    /**
     * 查询用户任务提交文件（用于分类统计）
     */
    @Select("SELECT f.category_id, f.file_size FROM file f " +
            "INNER JOIN file_submission fs ON f.id::text = fs.file_id::text " +
            "INNER JOIN collection_task ct ON fs.task_id::text = ct.id::text " +
            "WHERE ct.created_by = #{userId} AND f.status = 'ACTIVE' " +
            "AND (f.deleted IS NULL OR f.deleted = false) " +
            "AND f.category_id IS NOT NULL")
    List<File> findCategoryStatsByTaskOwner(@Param("userId") String userId);

    /**
     * 按日期范围���计用户任务提交的文件
     */
    @Select("SELECT f.file_size FROM file f " +
            "INNER JOIN file_submission fs ON f.id::text = fs.file_id::text " +
            "INNER JOIN collection_task ct ON fs.task_id::text = ct.id::text " +
            "WHERE ct.created_by = #{userId} AND f.status = 'ACTIVE' " +
            "AND (f.deleted IS NULL OR f.deleted = false) " +
            "AND f.created_at >= #{startDate} AND f.created_at < #{endDate}")
    List<Long> findFileSizesByTaskOwnerAndDateRange(@Param("userId") String userId, 
            @Param("startDate") java.time.LocalDateTime startDate, 
            @Param("endDate") java.time.LocalDateTime endDate);

    @Select("SELECT * FROM file WHERE uploader_id::text = #{uploaderId} AND deleted = true ORDER BY deleted_at DESC")
    List<File> findDeletedByUploaderId(@Param("uploaderId") String uploaderId);

    @Select("<script>" +
            "SELECT * FROM file WHERE uploader_id::text = #{uploaderId} AND deleted = true " +
            "ORDER BY deleted_at DESC " +
            "LIMIT #{size} OFFSET #{offset}" +
            "</script>")
    List<File> findDeletedByUploaderIdWithPagination(@Param("uploaderId") String uploaderId,
                                                      @Param("size") int size,
                                                      @Param("offset") int offset);

    @Select("SELECT COUNT(*) FROM file WHERE uploader_id::text = #{uploaderId} AND deleted = true")
    long countDeletedByUploaderId(@Param("uploaderId") String uploaderId);

    @Update("UPDATE file SET deleted = true, deleted_at = #{deletedAt}, updated_at = #{deletedAt} WHERE id::text = #{fileId}")
    int softDeleteById(@Param("fileId") String fileId, @Param("deletedAt") java.time.LocalDateTime deletedAt);

    @Update("UPDATE file SET deleted = false, deleted_at = NULL, updated_at = #{updatedAt} WHERE id::text = #{fileId}")
    int restoreById(@Param("fileId") String fileId, @Param("updatedAt") java.time.LocalDateTime updatedAt);

    @Select("SELECT * FROM file WHERE uploader_id::text = #{uploaderId} AND deleted = true AND deleted_at < #{threshold}")
    List<File> findExpiredDeletedFiles(@Param("uploaderId") String uploaderId, @Param("threshold") java.time.LocalDateTime threshold);
}
