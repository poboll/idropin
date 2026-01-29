package com.idropin.domain.vo;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 管理员用户视图对象
 *
 * @author Idrop.in Team
 */
@Data
public class AdminUserVO {
    
    private String id;
    
    /**
     * 用户名
     */
    private String username;
    
    /**
     * 邮箱
     */
    private String email;
    
    /**
     * 手机号
     */
    private String phone;
    
    /**
     * 用户状态
     */
    private String status;
    
    /**
     * 用户角色
     */
    private String role;
    
    /**
     * 已使用存储(字节)
     */
    private Long storageUsed;
    
    /**
     * 存储配额(字节)
     */
    private Long storageLimit;
    
    /**
     * 任务数量
     */
    private Integer taskCount;
    
    /**
     * 任务数量限制
     */
    private Integer taskLimit;
    
    /**
     * 创建时间
     */
    private LocalDateTime createdAt;
    
    /**
     * 最后登录时间
     */
    private LocalDateTime lastLoginAt;
    
    /**
     * 最后登录IP
     */
    private String lastLoginIp;
}
