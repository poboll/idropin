package com.idropin.application.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.idropin.application.service.FeedbackService;
import com.idropin.application.service.MessageService;
import com.idropin.common.exception.BusinessException;
import com.idropin.domain.dto.CreateFeedbackRequest;
import com.idropin.domain.dto.ReplyFeedbackRequest;
import com.idropin.domain.dto.UpdateFeedbackStatusRequest;
import com.idropin.domain.entity.Feedback;
import com.idropin.domain.entity.FeedbackReply;
import com.idropin.domain.entity.User;
import com.idropin.domain.vo.FeedbackDetailVO;
import com.idropin.domain.vo.FeedbackReplyVO;
import com.idropin.domain.vo.FeedbackVO;
import com.idropin.infrastructure.persistence.mapper.FeedbackMapper;
import com.idropin.infrastructure.persistence.mapper.FeedbackReplyMapper;
import com.idropin.infrastructure.persistence.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 反馈服务实现
 *
 * @author Idrop.in Team
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FeedbackServiceImpl implements FeedbackService {

    private final FeedbackMapper feedbackMapper;
    private final FeedbackReplyMapper feedbackReplyMapper;
    private final UserMapper userMapper;
    private final MessageService messageService;

    @Override
    @Transactional
    public FeedbackVO submitFeedback(String userId, CreateFeedbackRequest request) {
        Feedback feedback = new Feedback();
        feedback.setUserId(userId);
        feedback.setTitle(request.getTitle());
        feedback.setContent(request.getContent());
        feedback.setContact(request.getContact());
        feedback.setStatus("pending");
        feedback.setCreatedAt(LocalDateTime.now());
        feedback.setUpdatedAt(LocalDateTime.now());
        feedbackMapper.insert(feedback);
        
        User user = userMapper.selectById(userId);
        
        FeedbackVO vo = new FeedbackVO();
        BeanUtils.copyProperties(feedback, vo);
        vo.setUsername(user != null ? user.getUsername() : null);
        vo.setReplyCount(0);
        
        log.info("用户 {} 提交反馈: {}", userId, request.getTitle());
        return vo;
    }

    @Override
    public IPage<FeedbackVO> getMyFeedback(String userId, Integer page, Integer size) {
        Page<FeedbackVO> pageParam = new Page<>(page, size);
        return feedbackMapper.selectUserFeedbackPage(pageParam, userId);
    }

    @Override
    public FeedbackDetailVO getFeedbackDetail(String userId, String feedbackId) {
        Feedback feedback = feedbackMapper.selectById(feedbackId);
        if (feedback == null) {
            throw new BusinessException("反馈不存在");
        }
        
        // 检查权限：只能查看自己的反馈或管理员可以查看所有
        User user = userMapper.selectById(userId);
        boolean isAdmin = user != null && ("ADMIN".equals(user.getRole()) || "SUPER_ADMIN".equals(user.getRole()));
        if (!feedback.getUserId().equals(userId) && !isAdmin) {
            throw new BusinessException("无权查看此反馈");
        }
        
        User feedbackUser = userMapper.selectById(feedback.getUserId());
        List<FeedbackReplyVO> replies = feedbackReplyMapper.selectRepliesByFeedbackId(feedbackId);
        
        FeedbackDetailVO vo = new FeedbackDetailVO();
        BeanUtils.copyProperties(feedback, vo);
        vo.setUsername(feedbackUser != null ? feedbackUser.getUsername() : null);
        vo.setReplies(replies);
        
        return vo;
    }

    @Override
    public IPage<FeedbackVO> getAllFeedback(String status, Integer page, Integer size) {
        Page<FeedbackVO> pageParam = new Page<>(page, size);
        return feedbackMapper.selectAllFeedbackPage(pageParam, status);
    }

    @Override
    @Transactional
    public FeedbackReplyVO replyFeedback(String adminId, String feedbackId, ReplyFeedbackRequest request) {
        Feedback feedback = feedbackMapper.selectById(feedbackId);
        if (feedback == null) {
            throw new BusinessException("反馈不存在");
        }
        
        FeedbackReply reply = new FeedbackReply();
        reply.setFeedbackId(feedbackId);
        reply.setUserId(adminId);
        reply.setContent(request.getContent());
        reply.setIsAdmin(true);
        reply.setCreatedAt(LocalDateTime.now());
        feedbackReplyMapper.insert(reply);
        
        // 更新反馈状态为处理中
        if ("pending".equals(feedback.getStatus())) {
            LambdaUpdateWrapper<Feedback> updateWrapper = new LambdaUpdateWrapper<>();
            updateWrapper.eq(Feedback::getId, feedbackId)
                    .set(Feedback::getStatus, "in_progress")
                    .set(Feedback::getUpdatedAt, LocalDateTime.now());
            feedbackMapper.update(null, updateWrapper);
        }
        
        // 发送消息通知用户
        messageService.sendSystemMessage(feedback.getUserId(), 
                "您的反馈有新回复", 
                "您提交的反馈「" + feedback.getTitle() + "」收到了管理员的回复，请查看。");
        
        User admin = userMapper.selectById(adminId);
        
        FeedbackReplyVO vo = new FeedbackReplyVO();
        BeanUtils.copyProperties(reply, vo);
        vo.setUsername(admin != null ? admin.getUsername() : null);
        
        log.info("管理员 {} 回复反馈 {}", adminId, feedbackId);
        return vo;
    }

    @Override
    @Transactional
    public void updateFeedbackStatus(String feedbackId, UpdateFeedbackStatusRequest request) {
        Feedback feedback = feedbackMapper.selectById(feedbackId);
        if (feedback == null) {
            throw new BusinessException("反馈不存在");
        }
        
        String oldStatus = feedback.getStatus();
        String newStatus = request.getStatus();
        
        LambdaUpdateWrapper<Feedback> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.eq(Feedback::getId, feedbackId)
                .set(Feedback::getStatus, newStatus)
                .set(Feedback::getUpdatedAt, LocalDateTime.now());
        feedbackMapper.update(null, updateWrapper);
        
        // 发送状态变更通知
        String statusText = getStatusText(newStatus);
        messageService.sendSystemMessage(feedback.getUserId(),
                "反馈状态已更新",
                "您提交的反馈「" + feedback.getTitle() + "」状态已更新为：" + statusText);
        
        log.info("反馈 {} 状态从 {} 更新为 {}", feedbackId, oldStatus, newStatus);
    }

    @Override
    @Transactional
    public void deleteFeedback(String feedbackId) {
        Feedback feedback = feedbackMapper.selectById(feedbackId);
        if (feedback == null) {
            throw new BusinessException("反馈不存在");
        }

        feedbackReplyMapper.delete(
                new LambdaQueryWrapper<FeedbackReply>().eq(FeedbackReply::getFeedbackId, feedbackId));
        feedbackMapper.deleteById(feedbackId);

        log.info("反馈 {} 已删除", feedbackId);
    }

    @Override
    @Transactional
    public void editFeedback(String feedbackId, CreateFeedbackRequest request) {
        Feedback feedback = feedbackMapper.selectById(feedbackId);
        if (feedback == null) {
            throw new BusinessException("反馈不存在");
        }

        LambdaUpdateWrapper<Feedback> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.eq(Feedback::getId, feedbackId)
                .set(Feedback::getTitle, request.getTitle())
                .set(Feedback::getContent, request.getContent())
                .set(Feedback::getContact, request.getContact())
                .set(Feedback::getUpdatedAt, LocalDateTime.now());
        feedbackMapper.update(null, updateWrapper);

        log.info("反馈 {} 已编辑", feedbackId);
    }
    
    private String getStatusText(String status) {
        return switch (status) {
            case "pending" -> "待处理";
            case "in_progress" -> "处理中";
            case "resolved" -> "已解决";
            case "closed" -> "已关闭";
            default -> status;
        };
    }
}
