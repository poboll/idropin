package com.idropin.interfaces.rest;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.idropin.application.service.MessageService;
import com.idropin.common.vo.Result;
import com.idropin.domain.vo.MessageVO;
import com.idropin.infrastructure.security.CurrentUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 消息控制器
 *
 * @author Idrop.in Team
 */
@Tag(name = "消息管理", description = "站内消息相关接口")
@RestController
@RequestMapping("/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;
    private final CurrentUser currentUser;

    @Operation(summary = "获取消息列表")
    @GetMapping
    public Result<IPage<MessageVO>> getMessages(
            @RequestParam(required = false) Boolean unreadOnly,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer size) {
        String userId = currentUser.getUserId();
        IPage<MessageVO> messages = messageService.getMessages(userId, unreadOnly, page, size);
        return Result.success(messages);
    }

    @Operation(summary = "获取未读消息数量")
    @GetMapping("/unread-count")
    public Result<Integer> getUnreadCount() {
        String userId = currentUser.getUserId();
        Integer count = messageService.getUnreadCount(userId);
        return Result.success(count);
    }

    @Operation(summary = "标记消息为已读")
    @PutMapping("/{id}/read")
    public Result<Void> markAsRead(@PathVariable String id) {
        String userId = currentUser.getUserId();
        messageService.markAsRead(userId, id);
        return Result.success();
    }

    @Operation(summary = "标记所有消息为已读")
    @PutMapping("/read-all")
    public Result<Void> markAllAsRead() {
        String userId = currentUser.getUserId();
        messageService.markAllAsRead(userId);
        return Result.success();
    }

    @Operation(summary = "删除消息")
    @DeleteMapping("/{id}")
    public Result<Void> deleteMessage(@PathVariable String id) {
        String userId = currentUser.getUserId();
        messageService.deleteMessage(userId, id);
        return Result.success();
    }
}
