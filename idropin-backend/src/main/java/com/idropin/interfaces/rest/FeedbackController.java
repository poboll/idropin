package com.idropin.interfaces.rest;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.idropin.application.service.FeedbackService;
import com.idropin.common.vo.Result;
import com.idropin.domain.dto.CreateFeedbackRequest;
import com.idropin.domain.dto.ReplyFeedbackRequest;
import com.idropin.domain.dto.UpdateFeedbackStatusRequest;
import com.idropin.domain.vo.FeedbackDetailVO;
import com.idropin.domain.vo.FeedbackReplyVO;
import com.idropin.domain.vo.FeedbackVO;
import com.idropin.infrastructure.security.CurrentUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * 反馈控制器
 *
 * @author Idrop.in Team
 */
@Tag(name = "需求反馈", description = "需求反馈相关接口")
@RestController
@RequestMapping("/feedback")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;
    private final CurrentUser currentUser;

    @Operation(summary = "提交反馈")
    @PostMapping
    public Result<FeedbackVO> submitFeedback(@Valid @RequestBody CreateFeedbackRequest request) {
        String userId = currentUser.getUserId();
        FeedbackVO feedback = feedbackService.submitFeedback(userId, request);
        return Result.success(feedback);
    }

    @Operation(summary = "获取我的反馈列表")
    @GetMapping("/my")
    public Result<IPage<FeedbackVO>> getMyFeedback(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer size) {
        String userId = currentUser.getUserId();
        IPage<FeedbackVO> feedbacks = feedbackService.getMyFeedback(userId, page, size);
        return Result.success(feedbacks);
    }

    @Operation(summary = "获取反馈详情")
    @GetMapping("/{id}")
    public Result<FeedbackDetailVO> getFeedbackDetail(@PathVariable String id) {
        String userId = currentUser.getUserId();
        FeedbackDetailVO detail = feedbackService.getFeedbackDetail(userId, id);
        return Result.success(detail);
    }

    @Operation(summary = "获取所有反馈（管理员）")
    @GetMapping("/admin/list")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public Result<IPage<FeedbackVO>> getAllFeedback(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer size) {
        IPage<FeedbackVO> feedbacks = feedbackService.getAllFeedback(status, page, size);
        return Result.success(feedbacks);
    }

    @Operation(summary = "回复反馈（管理员）")
    @PostMapping("/{id}/reply")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public Result<FeedbackReplyVO> replyFeedback(
            @PathVariable String id,
            @Valid @RequestBody ReplyFeedbackRequest request) {
        String adminId = currentUser.getUserId();
        FeedbackReplyVO reply = feedbackService.replyFeedback(adminId, id, request);
        return Result.success(reply);
    }

    @Operation(summary = "更新反馈状态（管理员）")
    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public Result<Void> updateFeedbackStatus(
            @PathVariable String id,
            @Valid @RequestBody UpdateFeedbackStatusRequest request) {
        feedbackService.updateFeedbackStatus(id, request);
        return Result.success();
    }

    @Operation(summary = "删除反馈（管理员）")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public Result<Void> deleteFeedback(@PathVariable String id) {
        feedbackService.deleteFeedback(id);
        return Result.success();
    }

    @Operation(summary = "编辑反馈（管理员）")
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public Result<Void> editFeedback(
            @PathVariable String id,
            @Valid @RequestBody CreateFeedbackRequest request) {
        feedbackService.editFeedback(id, request);
        return Result.success();
    }
}
