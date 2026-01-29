package com.idropin.infrastructure.cache;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Token缓存服务
 * 用于管理用户token的失效
 *
 * @author Idrop.in Team
 */
@Slf4j
@Service
public class TokenCacheService {

    // 存储被强制失效的用户ID
    private final Set<String> invalidatedUsers = ConcurrentHashMap.newKeySet();
    
    // 存储用户token失效时间戳
    private final Map<String, Long> userInvalidationTime = new ConcurrentHashMap<>();

    /**
     * 使用户所有token失效
     *
     * @param userId 用户ID
     */
    public void invalidateUserTokens(String userId) {
        invalidatedUsers.add(userId);
        userInvalidationTime.put(userId, System.currentTimeMillis());
        log.info("用户 {} 的所有token已失效", userId);
    }

    /**
     * 检查用户token是否被强制失效
     *
     * @param userId 用户ID
     * @param tokenIssuedAt token签发时间戳
     * @return 是否被失效
     */
    public boolean isTokenInvalidated(String userId, long tokenIssuedAt) {
        Long invalidationTime = userInvalidationTime.get(userId);
        if (invalidationTime == null) {
            return false;
        }
        // 如果token签发时间早于失效时间，则token无效
        return tokenIssuedAt < invalidationTime;
    }

    /**
     * 清除用户的失效状态（用户重新登录后）
     *
     * @param userId 用户ID
     */
    public void clearInvalidation(String userId) {
        invalidatedUsers.remove(userId);
        // 不清除失效时间，保持旧token无效
    }
}
