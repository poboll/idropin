package com.idropin.interfaces.rest;

import com.idropin.application.service.AccessLogService;
import com.idropin.common.vo.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 访问日志控制器
 *
 * @author Idrop.in Team
 */
@Slf4j
@RestController
@RequestMapping("/access")
@RequiredArgsConstructor
@Tag(name = "访问日志", description = "访问日志相关接口")
public class AccessLogController {

    private final AccessLogService accessLogService;

    @Operation(summary = "记录页面访问")
    @PostMapping("/log")
    public Result<Void> logPageView(HttpServletRequest request) {
        accessLogService.logAccess(request, null);
        return Result.success();
    }
}
