package com.idropin.infrastructure.cache;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

/**
 * Refresh Token 缓存服务 — Redis 持久化
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TokenCacheService {

    private static final String UID_PREFIX = "refresh:uid:";
    private static final String TOK_PREFIX = "refresh:tok:";
    private static final long REFRESH_TTL_DAYS = 7;

    private final StringRedisTemplate redisTemplate;

    public void storeRefreshToken(String userId, String refreshToken) {
        String oldToken = redisTemplate.opsForValue().get(UID_PREFIX + userId);
        if (oldToken != null) {
            redisTemplate.delete(TOK_PREFIX + oldToken);
        }
        redisTemplate.opsForValue().set(UID_PREFIX + userId, refreshToken, REFRESH_TTL_DAYS, TimeUnit.DAYS);
        redisTemplate.opsForValue().set(TOK_PREFIX + refreshToken, userId, REFRESH_TTL_DAYS, TimeUnit.DAYS);
    }

    public String getUserIdByToken(String refreshToken) {
        return redisTemplate.opsForValue().get(TOK_PREFIX + refreshToken);
    }

    public void invalidateUserTokens(String userId) {
        String token = redisTemplate.opsForValue().get(UID_PREFIX + userId);
        redisTemplate.delete(UID_PREFIX + userId);
        if (token != null) {
            redisTemplate.delete(TOK_PREFIX + token);
        }
    }
}
