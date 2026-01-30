package com.idropin.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.idropin.domain.entity.User;
import com.idropin.domain.vo.AdminUserVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

/**
 * 用户Mapper
 *
 * @author Idrop.in Team
 */
@Mapper
public interface UserMapper extends BaseMapper<User> {

    /**
     * 根据用户名查找用户
     *
     * @param username 用户名
     * @return 用户实体
     */
    @Select("SELECT * FROM sys_user WHERE username = #{username}")
    User findByUsername(@Param("username") String username);

    /**
     * 根据邮箱查找用户
     *
     * @param email 邮箱
     * @return 用户实体
     */
    @Select("SELECT * FROM sys_user WHERE email = #{email}")
    User findByEmail(@Param("email") String email);

    /**
     * 检查用户名是否存在
     *
     * @param username 用户名
     * @return 是否存在
     */
    @Select("SELECT COUNT(*) > 0 FROM sys_user WHERE username = #{username}")
    boolean existsByUsername(@Param("username") String username);

    /**
     * 检查邮箱是否存在
     *
     * @param email 邮箱
     * @return 是否存在
     */
    @Select("SELECT COUNT(*) > 0 FROM sys_user WHERE email = #{email}")
    boolean existsByEmail(@Param("email") String email);
    
    /**
     * 分页查询管理员用户列表
     */
    IPage<AdminUserVO> selectAdminUserPage(Page<AdminUserVO> page, @Param("keyword") String keyword, @Param("status") String status);
    
    /**
     * 统计用户总数
     */
    @Select("SELECT COUNT(*) FROM sys_user")
    Long countUsers();
    
    /**
     * 统计活跃用户数
     */
    @Select("SELECT COUNT(*) FROM sys_user WHERE status = 'ACTIVE'")
    Long countActiveUsers();
    
    /**
     * 统计昨日新增用户数
     */
    @Select("SELECT COUNT(*) FROM sys_user WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' AND created_at < CURRENT_DATE")
    Long countUsersYesterday();
    
    /**
     * 统计文件总数
     */
    @Select("SELECT COUNT(*) FROM file")
    Long countFiles();
    
    /**
     * 统计昨日新增文件数
     */
    @Select("SELECT COUNT(*) FROM file WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' AND created_at < CURRENT_DATE")
    Long countFilesYesterday();
    
    /**
     * 统计文件总大小
     */
    @Select("SELECT COALESCE(SUM(file_size), 0) FROM file")
    Long sumFileSize();
    
    /**
     * 统计归档文件数
     */
    @Select("SELECT COUNT(*) FROM file WHERE status = 'ARCHIVED'")
    Long countArchivedFiles();
    
    /**
     * 统计归档文件大小
     */
    @Select("SELECT COALESCE(SUM(file_size), 0) FROM file WHERE status = 'ARCHIVED'")
    Long sumArchivedFileSize();
    
    /**
     * 统计无效文件数
     */
    @Select("SELECT COUNT(*) FROM file WHERE status = 'INVALID'")
    Long countInvalidFiles();
    
    /**
     * 统计无效文件大小
     */
    @Select("SELECT COALESCE(SUM(file_size), 0) FROM file WHERE status = 'INVALID'")
    Long sumInvalidFileSize();
    
    /**
     * 更新用户头像
     */
    @org.apache.ibatis.annotations.Update("UPDATE sys_user SET avatar_url = #{avatarUrl}, updated_at = #{updatedAt} WHERE id = #{id}")
    int updateAvatar(@Param("id") String id, @Param("avatarUrl") String avatarUrl, @Param("updatedAt") java.time.LocalDateTime updatedAt);
    
    /**
     * 更新用户密码
     */
    @org.apache.ibatis.annotations.Update("UPDATE sys_user SET password_hash = #{passwordHash}, updated_at = #{updatedAt} WHERE id = #{id}")
    int updatePassword(@Param("id") String id, @Param("passwordHash") String passwordHash, @Param("updatedAt") java.time.LocalDateTime updatedAt);
}
