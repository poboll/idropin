package com.idropin.infrastructure.email;

/**
 * 邮件服务接口
 *
 * @author Idrop.in Team
 */
public interface EmailService {

    /**
     * 发送简单文本邮件
     *
     * @param to      收件人
     * @param subject 主题
     * @param content 内容
     */
    void sendSimpleEmail(String to, String subject, String content);

    /**
     * 发送HTML邮件
     *
     * @param to      收件人
     * @param subject 主题
     * @param content HTML内容
     */
    void sendHtmlEmail(String to, String subject, String content);

    /**
     * 发送密码重置邮件
     *
     * @param to    收件人
     * @param token 重置令牌
     */
    void sendPasswordResetEmail(String to, String token);
}
