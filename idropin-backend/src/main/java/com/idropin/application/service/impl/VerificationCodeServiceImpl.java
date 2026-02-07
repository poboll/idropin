package com.idropin.application.service.impl;

import com.idropin.application.service.VerificationCodeService;
import com.idropin.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.Random;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class VerificationCodeServiceImpl implements VerificationCodeService {

    private final StringRedisTemplate redisTemplate;
    private final JavaMailSender mailSender;
    
    private static final String CODE_PREFIX = "verification_code:";
    private static final int CODE_LENGTH = 6;
    private static final long CODE_EXPIRE_MINUTES = 5;
    private static final String MAIL_FROM = "i@caiths.com";

    @Override
    public void sendEmailCode(String email, String purpose) {
        String code = generateCode();
        String key = buildKey(email, purpose);
        
        redisTemplate.opsForValue().set(key, code, CODE_EXPIRE_MINUTES, TimeUnit.MINUTES);
        
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(MAIL_FROM);
            message.setTo(email);
            message.setSubject("验证码 - Idrop.in 云集");
            message.setText(String.format(
                "您的验证码是：%s\n\n此验证码将在%d分钟后过期。\n\n如非本人操作，请忽略此邮件。\n\n--\nIdrop.in 云集团队",
                code, CODE_EXPIRE_MINUTES
            ));
            
            mailSender.send(message);
            log.info("Email verification code sent to: {}", email);
        } catch (Exception e) {
            log.error("Failed to send email code to: {}", email, e);
            throw new BusinessException("发送邮件验证码失败，请稍后重试");
        }
    }

    @Override
    public void sendSmsCode(String phone, String purpose) {
        String code = generateCode();
        String key = buildKey(phone, purpose);
        
        redisTemplate.opsForValue().set(key, code, CODE_EXPIRE_MINUTES, TimeUnit.MINUTES);
        
        log.info("SMS code would be sent to: {} (Tencent Cloud SMS not configured yet)", phone);
        log.info("Verification code: {} (for testing only)", code);
    }

    @Override
    public boolean verifyCode(String target, String code, String purpose) {
        String key = buildKey(target, purpose);
        String storedCode = redisTemplate.opsForValue().get(key);
        
        if (storedCode == null) {
            return false;
        }
        
        return storedCode.equals(code);
    }

    @Override
    public void invalidateCode(String target, String purpose) {
        String key = buildKey(target, purpose);
        redisTemplate.delete(key);
    }

    private String generateCode() {
        Random random = new Random();
        StringBuilder code = new StringBuilder();
        for (int i = 0; i < CODE_LENGTH; i++) {
            code.append(random.nextInt(10));
        }
        return code.toString();
    }

    private String buildKey(String target, String purpose) {
        return CODE_PREFIX + purpose + ":" + target;
    }
}
