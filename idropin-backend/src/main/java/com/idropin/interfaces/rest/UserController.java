package com.idropin.interfaces.rest;

import com.idropin.application.service.FileService;
import com.idropin.application.service.UserService;
import com.idropin.application.service.VerificationCodeService;
import com.idropin.common.vo.Result;
import com.idropin.domain.dto.ChangePasswordRequest;
import com.idropin.domain.entity.User;
import com.idropin.domain.vo.UserVO;
import com.idropin.infrastructure.persistence.mapper.UserMapper;
import com.idropin.infrastructure.storage.StorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;

/**
 * 用户控制器
 *
 * @author Idrop.in Team
 */
@Tag(name = "用户管理", description = "用户信息管理相关接口")
@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserService userService;
    private final UserMapper userMapper;
    private final VerificationCodeService verificationCodeService;
    private final FileService fileService;
    private final StorageService storageService;

    /**
     * 获取当前用户信息
     */
    @Operation(summary = "获取当前用户信息", description = "获取当前登录用户的详细信息")
    @GetMapping("/me")
    public Result<UserVO> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        UserVO userVO = userService.getCurrentUserInfo(username);
        return Result.success(userVO);
    }

    /**
     * 修改密码
     */
    @Operation(summary = "修改密码", description = "修改当前用户的密码")
    @PutMapping("/password")
    public Result<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User user = userMapper.findByUsername(username);
        userService.changePassword(user.getId(), request);
        return Result.success();
    }

    /**
     * 更新用户头像
     */
    @Operation(summary = "更新头像", description = "更新当前用户的头像")
    @PutMapping("/avatar")
    public Result<UserVO> updateAvatar(@RequestParam String avatarUrl) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User user = userMapper.findByUsername(username);
        UserVO userVO = userService.updateProfile(user.getId(), avatarUrl);
        return Result.success(userVO);
    }

    @Operation(summary = "上传头像")
    @PostMapping("/avatar/upload")
    public Result<UserVO> uploadAvatar(@RequestParam("file") MultipartFile file) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User user = userMapper.findByUsername(authentication.getName());
        String avatarPath = fileService.uploadFileForAvatar(file, user.getId(), user.getAvatarUrl());
        UserVO userVO = userService.updateProfile(user.getId(), avatarPath);
        return Result.success(userVO);
    }

    @Operation(summary = "代理获取用户头像", description = "通过后端代理从存储服务获取用户头像，无需直接访问S3")
    @GetMapping("/avatar/{userId}")
    public void getAvatar(@PathVariable String userId, HttpServletResponse response) {
        try {
            User user = userMapper.selectById(userId);
            if (user == null || user.getAvatarUrl() == null || user.getAvatarUrl().isBlank()) {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                return;
            }
            String storagePath = user.getAvatarUrl();
            // 兼容旧格式：完整HTTP URL，提取对象路径部分
            if (storagePath.startsWith("http")) {
                // 格式: https://endpoint/bucket/objectName
                // 提取 objectName（endpoint和bucket后面的部分）
                try {
                    java.net.URI uri = new java.net.URI(storagePath);
                    String path = uri.getPath(); // /bucket/objectName
                    // 去掉开头的 /bucket/
                    int secondSlash = path.indexOf('/', 1);
                    if (secondSlash != -1) {
                        storagePath = path.substring(secondSlash + 1);
                    }
                } catch (Exception e) {
                    log.warn("Failed to parse avatar URL: {}", storagePath);
                    response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    return;
                }
            }
            String contentType = "image/jpeg";
            try {
                String ct = storageService.getContentType(storagePath);
                if (ct != null && !ct.isBlank()) contentType = ct;
            } catch (Exception ignored) {}
            response.setContentType(contentType);
            response.setHeader("Cache-Control", "public, max-age=3600");
            try (InputStream stream = storageService.downloadFile(storagePath)) {
                stream.transferTo(response.getOutputStream());
            }
        } catch (Exception e) {
            log.error("Failed to proxy avatar for user: {}", userId, e);
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
        }
    }

    /**
     * 发送验证码
     */
    @Operation(summary = "发送验证码", description = "发送手机验证码或邮箱验证码")
    @PostMapping("/send-code")
    public Result<Void> sendVerificationCode(
            @RequestParam String target,
            @RequestParam String type) {
        if ("email".equals(type)) {
            verificationCodeService.sendEmailCode(target, "bind");
        } else if ("sms".equals(type)) {
            verificationCodeService.sendSmsCode(target, "bind");
        } else {
            return Result.error(400, "无效的验证码类型");
        }
        return Result.success();
    }

    /**
     * 绑定手机号
     */
    @Operation(summary = "绑定手机号", description = "绑定或更换手机号")
    @PostMapping("/bind-phone")
    public Result<UserVO> bindPhone(
            @RequestParam String phone,
            @RequestParam String code) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User user = userMapper.findByUsername(username);

        if (!verificationCodeService.verifyCode(phone, code, "bind")) {
            return Result.error(400, "验证码错误或已过期");
        }

        UserVO userVO = userService.bindPhone(user.getId(), phone);
        verificationCodeService.invalidateCode(phone, "bind");
        return Result.success(userVO);
    }

    /**
     * 绑定邮箱
     */
    @Operation(summary = "绑定邮箱", description = "绑定或更换邮箱")
    @PostMapping("/bind-email")
    public Result<UserVO> bindEmail(
            @RequestParam String email,
            @RequestParam String code) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User user = userMapper.findByUsername(username);

        if (!verificationCodeService.verifyCode(email, code, "bind")) {
            return Result.error(400, "验证码错误或已过期");
        }

        UserVO userVO = userService.bindEmail(user.getId(), email);
        verificationCodeService.invalidateCode(email, "bind");
        return Result.success(userVO);
    }
}
