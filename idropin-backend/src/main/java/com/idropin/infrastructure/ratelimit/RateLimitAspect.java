package com.idropin.infrastructure.ratelimit;

import com.idropin.common.exception.BusinessException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.List;

@Aspect
@Component
@RequiredArgsConstructor
public class RateLimitAspect {

    private final StringRedisTemplate redisTemplate;

    private static final RedisScript<Long> SCRIPT = RedisScript.of(
            "local key = KEYS[1] " +
            "local permits = tonumber(ARGV[1]) " +
            "local window = tonumber(ARGV[2]) " +
            "local current = tonumber(redis.call('get', key) or '0') " +
            "if current >= permits then return 0 end " +
            "current = redis.call('incr', key) " +
            "if current == 1 then redis.call('expire', key, window) end " +
            "return 1", Long.class);

    @Around("@annotation(rateLimit)")
    public Object around(ProceedingJoinPoint pjp, RateLimit rateLimit) throws Throwable {
        String key = resolveKey(rateLimit, pjp);
        Long allowed = redisTemplate.execute(SCRIPT,
                List.of(key),
                String.valueOf(rateLimit.permits()),
                String.valueOf(rateLimit.seconds()));

        if (allowed == null || allowed == 0L) {
            throw new BusinessException(429, "请求过于频繁，请稍后再试");
        }
        return pjp.proceed();
    }

    private String resolveKey(RateLimit rl, ProceedingJoinPoint pjp) {
        String base = rl.key().isEmpty()
                ? pjp.getSignature().getDeclaringTypeName() + "." + pjp.getSignature().getName()
                : rl.key();
        String ip = "";
        var attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs != null) {
            HttpServletRequest req = attrs.getRequest();
            ip = req.getRemoteAddr();
        }
        return "rate:" + base + ":" + ip;
    }
}
