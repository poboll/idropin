package com.idropin.application.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.idropin.domain.dto.BindPhoneRequest;
import com.idropin.domain.dto.SendMessageRequest;
import com.idropin.domain.dto.UpdateQuotaRequest;
import com.idropin.domain.dto.UpdateRoleRequest;
import com.idropin.domain.dto.UpdateStatusRequest;
import com.idropin.domain.vo.AdminUserVO;
import com.idropin.domain.vo.OverviewStatsVO;

/**
 * 管理服务接口
 *
 * @author Idrop.in Team
 */
public interface AdminService {
    
    /**
     * 获取平台概况统计
     *
     * @return 概况统计
     */
    OverviewStatsVO getOverviewStats();
    
    /**
     * 获取用户列表
     *
     * @param keyword 搜索关键词
     * @param status 状态筛选
     * @param page 页码
     * @param size 每页大小
     * @return 用户分页列表
     */
    IPage<AdminUserVO> getUsers(String keyword, String status, Integer page, Integer size);
    
    /**
     * 更新用户状态
     *
     * @param adminId 管理员ID
     * @param userId 用户ID
     * @param request 状态请求
     * @param ipAddress IP地址
     */
    void updateUserStatus(String adminId, String userId, UpdateStatusRequest request, String ipAddress);
    
    /**
     * 重置用户密码
     *
     * @param adminId 管理员ID
     * @param userId 用户ID
     * @param ipAddress IP地址
     * @return 新密码
     */
    String resetUserPassword(String adminId, String userId, String ipAddress);
    
    /**
     * 绑定用户手机号
     *
     * @param adminId 管理员ID
     * @param userId 用户ID
     * @param request 手机号请求
     * @param ipAddress IP地址
     */
    void bindUserPhone(String adminId, String userId, BindPhoneRequest request, String ipAddress);
    
    /**
     * 发送消息给用户
     *
     * @param adminId 管理员ID
     * @param userId 用户ID
     * @param request 消息请求
     */
    void sendMessageToUser(String adminId, String userId, SendMessageRequest request);
    
    /**
     * 更新用户配额
     *
     * @param adminId 管理员ID
     * @param userId 用户ID
     * @param request 配额请求
     * @param ipAddress IP地址
     */
    void updateUserQuota(String adminId, String userId, UpdateQuotaRequest request, String ipAddress);
    
    /**
     * 强制用户下线
     *
     * @param adminId 管理员ID
     * @param userId 用户ID
     * @param ipAddress IP地址
     */
    void forceUserLogout(String adminId, String userId, String ipAddress);
    
    /**
     * 广播消息
     *
     * @param adminId 管理员ID
     * @param request 消息请求
     */
    void broadcastMessage(String adminId, SendMessageRequest request);
    
    /**
     * 更新用户角色
     *
     * @param adminId 管理员ID
     * @param userId 用户ID
     * @param request 角色请求
     * @param ipAddress IP地址
     */
    void updateUserRole(String adminId, String userId, UpdateRoleRequest request, String ipAddress);
}
