package com.idropin.infrastructure.security;

import com.idropin.domain.entity.SystemConfig;
import com.idropin.infrastructure.persistence.mapper.SystemConfigMapper;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.Date;
import java.util.function.Function;

/**
 * JWT 工具类 — RS256 非对称签名
 *
 * Access token 2 小时有效期。RSA-2048 密钥对持久化于数据库，重启后仍有效。
 * Refresh token 由 AuthService 以 UUID 形式存 Redis，与本类无关。
 */
@Slf4j
@Component
public class JwtTokenUtil {

    public static final long ACCESS_TOKEN_EXPIRATION = 2 * 60 * 60 * 1000L; // 2 hours

    private RSAPublicKey publicKey;
    private RSAPrivateKey privateKey;

    @Autowired(required = false)
    private SystemConfigMapper systemConfigMapper;

    private static final String KEY_PRIVATE = "jwt.rsa.private_key";
    private static final String KEY_PUBLIC  = "jwt.rsa.public_key";

    @PostConstruct
    public void init() {
        try {
            if (tryLoadFromDb()) {
                return;
            }
            generateAndPersist();
        } catch (Exception e) {
            throw new IllegalStateException("RSA 密钥对初始化失败", e);
        }
    }

    private boolean tryLoadFromDb() {
        if (systemConfigMapper == null) return false;
        try {
            SystemConfig privCfg = systemConfigMapper.findByKey(KEY_PRIVATE);
            SystemConfig pubCfg  = systemConfigMapper.findByKey(KEY_PUBLIC);
            if (privCfg == null || pubCfg == null
                    || privCfg.getConfigValue() == null || pubCfg.getConfigValue() == null) {
                return false;
            }
            KeyFactory kf = KeyFactory.getInstance("RSA");
            byte[] privBytes = Base64.getDecoder().decode(privCfg.getConfigValue());
            byte[] pubBytes  = Base64.getDecoder().decode(pubCfg.getConfigValue());
            this.privateKey = (RSAPrivateKey) kf.generatePrivate(new PKCS8EncodedKeySpec(privBytes));
            this.publicKey  = (RSAPublicKey)  kf.generatePublic(new X509EncodedKeySpec(pubBytes));
            log.info("RS256 密钥对从数据库加载成功");
            return true;
        } catch (Exception e) {
            log.warn("从数据库加载 RSA 密钥失败，将重新生成: {}", e.getMessage());
            return false;
        }
    }

    private void generateAndPersist() throws Exception {
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
        kpg.initialize(2048);
        KeyPair kp = kpg.generateKeyPair();
        this.publicKey  = (RSAPublicKey)  kp.getPublic();
        this.privateKey = (RSAPrivateKey) kp.getPrivate();

        if (systemConfigMapper != null) {
            persistKey(KEY_PRIVATE, Base64.getEncoder().encodeToString(privateKey.getEncoded()), "JWT RSA 私钥");
            persistKey(KEY_PUBLIC,  Base64.getEncoder().encodeToString(publicKey.getEncoded()),  "JWT RSA 公钥");
            log.info("RS256 密钥对已生成并持久化到数据库");
        } else {
            log.warn("SystemConfigMapper 不可用，RS256 密钥对仅在本次运行有效");
        }
    }

    private void persistKey(String key, String value, String description) {
        try {
            SystemConfig existing = systemConfigMapper.findByKey(key);
            if (existing != null) {
                systemConfigMapper.updateValue(key, value);
            } else {
                SystemConfig cfg = new SystemConfig();
                cfg.setConfigKey(key);
                cfg.setConfigValue(value);
                cfg.setConfigType("string");
                cfg.setDescription(description);
                cfg.setCategory("security");
                cfg.setIsEnabled(false);
                cfg.setCreatedAt(java.time.LocalDateTime.now());
                cfg.setUpdatedAt(java.time.LocalDateTime.now());
                systemConfigMapper.insert(cfg);
            }
        } catch (Exception e) {
            log.warn("持久化 RSA 密钥到数据库失败: {}", e.getMessage());
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
