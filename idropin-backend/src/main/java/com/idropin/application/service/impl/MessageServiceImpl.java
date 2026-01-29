package com.idropin.application.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.idropin.application.service.MessageService;
import com.idropin.common.exception.BusinessException;
import com.idropin.domain.dto.SendMessageRequest;
import com.idropin.domain.entity.Message;
import com.idropin.domain.entity.User;
import com.idropin.domain.vo.MessageVO;
import com.idropin.infrastructure.persistence.mapper.MessageMapper;
import com.idropin.infrastructure.persistence.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 消息服务实现
 *
 * @author Idrop.in Team
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MessageServiceImpl implements MessageService {

    private final MessageMapper messageMapper;
    private final UserMapper userMapper;

    @Override
    public IPage<MessageVO> getMessages(String userId, Boolean unreadOnly, Integer page, Integer size) {
        Page<MessageVO> pageParam = new Page<>(page, size);
        return messageMapper.selectMessagePage(pageParam, userId, unreadOnly);
    }

    @Override
    public Integer getUnreadCount(String userId) {
        return messageMapper.countUnread(userId);
    }

    @Override
    @Transactional
    public void markAsRead(String userId, String messageId) {
        Message message = messageMapper.selectById(messageId);
        if (message == null) {
            throw new BusinessException("消息不存在");
        }
        if (!message.getRecipientId().equals(userId)) {
            throw new BusinessException("无权操作此消息");
        }
        if (!message.getIsRead()) {
            LambdaUpdateWrapper<Message> updateWrapper = new LambdaUpdateWrapper<>();
            updateWrapper.eq(Message::getId, messageId)
                    .set(Message::getIsRead, true)
                    .set(Message::getReadAt, LocalDateTime.now());
            messageMapper.update(null, updateWrapper);
        }
    }

    @Override
    @Transactional
    public void markAllAsRead(String userId) {
        messageMapper.markAllAsRead(userId);
    }

    @Override
    @Transactional
    public void deleteMessage(String userId, String messageId) {
        Message message = messageMapper.selectById(messageId);
        if (message == null) {
            throw new BusinessException("消息不存在");
        }
        if (!message.getRecipientId().equals(userId)) {
            throw new BusinessException("无权操作此消息");
        }
        messageMapper.deleteById(messageId);
    }

    @Override
    @Transactional
    public void sendMessage(String senderId, String recipientId, SendMessageRequest request) {
        Message message = new Message();
        message.setTitle(request.getTitle());
        message.setContent(request.getContent());
        message.setSenderType("admin");
        message.setSenderId(senderId);
        message.setRecipientId(recipientId);
        message.setIsRead(false);
        message.setCreatedAt(LocalDateTime.now());
        messageMapper.insert(message);
        log.info("管理员 {} 向用户 {} 发送消息: {}", senderId, recipientId, request.getTitle());
    }

    @Override
    @Transactional
    public void sendSystemMessage(String recipientId, String title, String content) {
        Message message = new Message();
        message.setTitle(title);
        message.setContent(content);
        message.setSenderType("system");
        message.setSenderId(null);
        message.setRecipientId(recipientId);
        message.setIsRead(false);
        message.setCreatedAt(LocalDateTime.now());
        messageMapper.insert(message);
        log.info("系统向用户 {} 发送消息: {}", recipientId, title);
    }

    @Override
    @Transactional
    public void broadcastMessage(String senderId, SendMessageRequest request) {
        // 获取所有活跃用户
        LambdaQueryWrapper<User> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(User::getStatus, "ACTIVE");
        List<User> users = userMapper.selectList(queryWrapper);
        
        LocalDateTime now = LocalDateTime.now();
        for (User user : users) {
            Message message = new Message();
            message.setTitle(request.getTitle());
            message.setContent(request.getContent());
            message.setSenderType("admin");
            message.setSenderId(senderId);
            message.setRecipientId(user.getId());
            message.setIsRead(false);
            message.setCreatedAt(now);
            messageMapper.insert(message);
        }
        log.info("管理员 {} 广播消息给 {} 个用户: {}", senderId, users.size(), request.getTitle());
    }
}
