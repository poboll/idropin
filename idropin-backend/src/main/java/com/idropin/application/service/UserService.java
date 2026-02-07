package com.idropin.application.service;

import com.idropin.domain.dto.ChangePasswordRequest;
import com.idropin.domain.entity.User;
import com.idropin.domain.vo.UserVO;

/**
 * 用户服务接口
 *
 * @author Idrop.in Team
 */
public interface UserService {

    /**
     * 根据ID查询用户
     */
    User getUserById(String id);

    /**
     * 根据用户名查询用户
     */
    User getUserByUsername(String username);

    /**
     * 根据邮箱查询用户
     */
    User getUserByEmail(String email);

    /**
     * 检查用户名是否存在
     */
    boolean existsByUsername(String username);

    /**
     * 检查邮箱是否存在
     */
    boolean existsByEmail(String email);

    /**
     * 获取当前用户信息（不含密码）
     */
    UserVO getCurrentUserInfo(String username);

    /**
     * 修改密码
     */
    void changePassword(String userId, ChangePasswordRequest request);

    /**
     * 更新用户资料
     */
    UserVO updateProfile(String userId, String avatarUrl);

    /**
     * 绑定手机号
     */
    UserVO bindPhone(String userId, String phone);

    /**
     * 绑定邮箱
     */
    UserVO bindEmail(String userId, String email);
}
