package com.idropin.infrastructure.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.util.Date;
import java.util.function.Function;

/**
 * JWT 工具类 — RS256 非对称签名
 *
 * 启动时生成 RSA-2048 密钥对。access token 15 分钟有效期。
 * refresh token 由 AuthService 以 UUID 形式存 Redis，与本类无关。
 */
@Slf4j
@Component
public class JwtTokenUtil {

    public static final long ACCESS_TOKEN_EXPIRATION = 15 * 60 * 1000L;

    private RSAPublicKey publicKey;
    private RSAPrivateKey privateKey;

    @PostConstruct
    public void init() {
        try {
            KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
            kpg.initialize(2048);
            KeyPair kp = kpg.generateKeyPair();
            this.publicKey = (RSAPublicKey) kp.getPublic();
            this.privateKey = (RSAPrivateKey) kp.getPrivate();
            log.info("RS256 密钥对初始化完成");
        } catch (Exception e) {
            throw new IllegalStateException("RSA 密钥对生成失败", e);
        }
    }

    /** 生成 RS256 access token */
    public String generateAccessToken(String username) {
        Date now = new Date();
        return Jwts.builder()
                .subject(username)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + ACCESS_TOKEN_EXPIRATION))
                .signWith(privateKey)
                .compact();
    }

    public String getUsernameFromToken(String token) {
        return getClaim(token, Claims::getSubject);
    }

    public boolean validateToken(String token, String username) {
        try {
            String subject = getUsernameFromToken(token);
            return subject != null && subject.equals(username) && !isExpired(token);
        } catch (Exception e) {
            return false;
        }
    }

    private boolean isExpired(String token) {
        Date exp = getClaim(token, Claims::getExpiration);
        return exp == null || exp.before(new Date());
    }

    private <T> T getClaim(String token, Function<Claims, T> resolver) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(publicKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return resolver.apply(claims);
        } catch (Exception e) {
            log.debug("JWT 解析失败: {}", e.getMessage());
            return null;
        }
    }

    /** 向后兼容旧调用 */
    public String generateToken(String username) {
        return generateAccessToken(username);
    }
}
