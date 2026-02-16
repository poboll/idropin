package com.idropin.infrastructure.email;

import com.idropin.application.service.ConfigService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.util.Properties;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final ConfigService configService;

    @Value("${app.frontend.url:http://localhost:5224}")
    private String frontendUrl;

    private JavaMailSender cachedMailSender;
    private long lastConfigUpdateTime = 0;
    private static final long CACHE_TTL = 5 * 60 * 1000;

    private synchronized JavaMailSender getMailSender() {
        long now = System.currentTimeMillis();
        if (cachedMailSender != null && (now - lastConfigUpdateTime) < CACHE_TTL) {
            return cachedMailSender;
        }

        String host = configService.getSystemConfigValue("email.smtp.host");
        String portStr = configService.getSystemConfigValue("email.smtp.port");
        String username = configService.getSystemConfigValue("email.smtp.username");
        String password = configService.getSystemConfigValue("email.smtp.password");
        String authStr = configService.getSystemConfigValue("email.smtp.auth");
        String starttlsStr = configService.getSystemConfigValue("email.smtp.starttls.enable");

        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost(host);
        mailSender.setPort(Integer.parseInt(portStr));
        mailSender.setUsername(username);
        mailSender.setPassword(password);

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", authStr);
        props.put("mail.smtp.starttls.enable", starttlsStr);
        props.put("mail.smtp.starttls.required", starttlsStr);
        props.put("mail.smtp.ssl.trust", host);
        props.put("mail.debug", "false");

        cachedMailSender = mailSender;
        lastConfigUpdateTime = now;
        
        log.info("邮件配置已更新: host={}, port={}, username={}", host, portStr, username);
        return cachedMailSender;
    }

    public synchronized void refreshCache() {
        cachedMailSender = null;
        lastConfigUpdateTime = 0;
        log.info("邮件配置缓存已清空");
    }

    private String getFromAddress() {
        String username = configService.getSystemConfigValue("email.smtp.username");
        String fromName = configService.getSystemConfigValue("email.from.name");
        return fromName + " <" + username + ">";
    }

    @Override
    public void sendSimpleEmail(String to, String subject, String content) {
        try {
            JavaMailSender mailSender = getMailSender();
            String from = getFromAddress();
            
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(from);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(content);
            mailSender.send(message);
            log.info("简单邮件发送成功: to={}, subject={}", to, subject);
        } catch (Exception e) {
            log.error("简单邮件发送失败: to={}, subject={}", to, subject, e);
            throw new RuntimeException("邮件发送失败", e);
        }
    }

    @Override
    public void sendHtmlEmail(String to, String subject, String content) {
        try {
            JavaMailSender mailSender = getMailSender();
            String from = getFromAddress();
            
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(content, true);
            mailSender.send(message);
            log.info("HTML邮件发送成功: to={}, subject={}", to, subject);
        } catch (MessagingException e) {
            log.error("HTML邮件发送失败: to={}, subject={}", to, subject, e);
            throw new RuntimeException("邮件发送失败", e);
        }
    }

    @Override
    public void sendPasswordResetEmail(String to, String token) {
        String resetUrl = frontendUrl + "/reset-password?token=" + token;
        
        String subject = "Idrop.in - 密码重置";
        String content = buildPasswordResetEmailContent(resetUrl);
        
        sendHtmlEmail(to, subject, content);
    }

    private String buildPasswordResetEmailContent(String resetUrl) {
        return """
                <!DOCTYPE html>
                <html lang="zh">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin:0;padding:0;background:#fafafa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
                    <table width="100%%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
                        <tr><td align="center">
                            <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #eaeaea;border-radius:8px;overflow:hidden;">
                                <tr><td style="padding:32px 32px 0;">
                                    <p style="margin:0;font-size:14px;font-weight:600;color:#111;letter-spacing:-0.2px;">Idrop.in</p>
                                </td></tr>
                                <tr><td style="padding:24px 32px 0;">
                                    <h1 style="margin:0;font-size:22px;font-weight:600;color:#111;letter-spacing:-0.5px;">重置您的密码</h1>
                                </td></tr>
                                <tr><td style="padding:16px 32px 0;">
                                    <p style="margin:0;font-size:14px;line-height:1.6;color:#666;">我们收到了您的密码重置请求。点击下方按钮设置新密码，链接将在 24 小时后失效。</p>
                                </td></tr>
                                <tr><td style="padding:24px 32px;" align="center">
                                    <a href="%s" style="display:inline-block;padding:10px 28px;background:#111;color:#fff;font-size:14px;font-weight:500;text-decoration:none;border-radius:6px;letter-spacing:-0.1px;">重置密码</a>
                                </td></tr>
                                <tr><td style="padding:0 32px;">
                                    <p style="margin:0;font-size:12px;line-height:1.5;color:#999;">或复制链接到浏览器：</p>
                                    <p style="margin:6px 0 0;font-size:12px;line-height:1.5;color:#666;word-break:break-all;background:#f5f5f5;padding:10px 12px;border-radius:4px;font-family:monospace;">%s</p>
                                </td></tr>
                                <tr><td style="padding:24px 32px;">
                                    <p style="margin:0;font-size:12px;color:#999;">如果您没有请求重置密码，请忽略此邮件。</p>
                                </td></tr>
                                <tr><td style="padding:16px 32px;border-top:1px solid #eaeaea;">
                                    <p style="margin:0;font-size:11px;color:#bbb;text-align:center;">Idrop.in 云集 &mdash; 智能化教育文件管理平台</p>
                                </td></tr>
                            </table>
                        </td></tr>
                    </table>
                </body>
                </html>
                """.formatted(resetUrl, resetUrl);
    }
}
