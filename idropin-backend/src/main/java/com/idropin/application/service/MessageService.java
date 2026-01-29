package com.idropin.application.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.idropin.domain.dto.SendMessageRequest;
import com.idropin.domain.vo.MessageVO;

/**
 * 消息服务接口
 *
 * @author Idrop.in Team
 */
public interface MessageService {
    
    /**
     * 获取用户消息列表
     *
     * @param userId 用户ID
     * @param unreadOnly 是否只查询未读
     * @param page 页码
     * @param size 每页大小
     * @return 消息分页列表
     */
    IPage<MessageVO> getMessages(String userId, Boolean unreadOnly, Integer page, Integer size);
    
    /**
     * 获取未读消息数量
     *
     * @param userId 用户ID
     * @return 未读数量
     */
    Integer getUnreadCount(String userId);
    
    /**
     * 标记消息为已读
     *
     * @param userId 用户ID
     * @param messageId 消息ID
     */
    void markAsRead(String userId, String messageId);
    
    /**
     * 标记所有消息为已读
     *
     * @param userId 用户ID
     */
    void markAllAsRead(String userId);
    
    /**
     * 删除消息
     *
     * @param userId 用户ID
     * @param messageId 消息ID
     */
    void deleteMessage(String userId, String messageId);
    
    /**
     * 发送消息给指定用户
     *
     * @param senderId 发送者ID
     * @param recipientId 接收者ID
     * @param request 消息内容
     */
    void sendMessage(String senderId, String recipientId, SendMessageRequest request);
    
    /**
     * 发送系统消息
     *
     * @param recipientId 接收者ID
     * @param title 标题
     * @param content 内容
     */
    void sendSystemMessage(String recipientId, String title, String content);
    
    /**
     * 广播消息给所有用户
     *
     * @param senderId 发送者ID
     * @param request 消息内容
     */
    void broadcastMessage(String senderId, SendMessageRequest request);
}
