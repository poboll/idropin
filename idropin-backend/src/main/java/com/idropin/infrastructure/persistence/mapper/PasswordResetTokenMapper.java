package com.idropin.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.idropin.domain.entity.PasswordResetToken;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

/**
 * 密码重置令牌 Mapper
 *
 * @author Idropin.in Team
 */
@Mapper
public interface PasswordResetTokenMapper extends BaseMapper<PasswordResetToken> {

    /**
     * 根据令牌查找
     */
    @Select("SELECT * FROM password_reset_token WHERE token = #{token} AND used = false")
    PasswordResetToken findByToken(String token);

    /**
     * 根据用户ID查找最新的令牌
     */
    @Select("SELECT * FROM password_reset_token WHERE user_id = #{userId} ORDER BY created_at DESC LIMIT 1")
    PasswordResetToken findLatestByUserId(String userId);
}
