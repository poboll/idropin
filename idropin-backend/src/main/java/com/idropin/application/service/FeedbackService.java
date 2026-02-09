package com.idropin.application.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.idropin.domain.dto.CreateFeedbackRequest;
import com.idropin.domain.dto.ReplyFeedbackRequest;
import com.idropin.domain.dto.UpdateFeedbackStatusRequest;
import com.idropin.domain.vo.FeedbackDetailVO;
import com.idropin.domain.vo.FeedbackReplyVO;
import com.idropin.domain.vo.FeedbackVO;

/**
 * 反馈服务接口
 *
 * @author Idrop.in Team
 */
public interface FeedbackService {
    
    /**
     * 提交反馈
     *
     * @param userId 用户ID
     * @param request 反馈请求
     * @return 反馈信息
     */
    FeedbackVO submitFeedback(String userId, CreateFeedbackRequest request);
    
    /**
     * 获取用户自己的反馈列表
     *
     * @param userId 用户ID
     * @param page 页码
     * @param size 每页大小
     * @return 反馈分页列表
     */
    IPage<FeedbackVO> getMyFeedback(String userId, Integer page, Integer size);
    
    /**
     * 获取反馈详情
     *
     * @param userId 用户ID
     * @param feedbackId 反馈ID
     * @return 反馈详情
     */
    FeedbackDetailVO getFeedbackDetail(String userId, String feedbackId);
    
    /**
     * 获取所有反馈（管理员）
     *
     * @param status 状态筛选
     * @param page 页码
     * @param size 每页大小
     * @return 反馈分页列表
     */
    IPage<FeedbackVO> getAllFeedback(String status, Integer page, Integer size);
    
    /**
     * 回复反馈（管理员）
     *
     * @param adminId 管理员ID
     * @param feedbackId 反馈ID
     * @param request 回复请求
     * @return 回复信息
     */
    FeedbackReplyVO replyFeedback(String adminId, String feedbackId, ReplyFeedbackRequest request);
    
    /**
     * 更新反馈状态（管理员）
     *
     * @param feedbackId 反馈ID
     * @param request 状态请求
     */
    void updateFeedbackStatus(String feedbackId, UpdateFeedbackStatusRequest request);

    /**
     * 删除反馈（管理员）
     *
     * @param feedbackId 反馈ID
     */
    void deleteFeedback(String feedbackId);

    /**
     * 编辑反馈（管理员）
     *
     * @param feedbackId 反馈ID
     * @param request 编辑请求
     */
    void editFeedback(String feedbackId, CreateFeedbackRequest request);
}
