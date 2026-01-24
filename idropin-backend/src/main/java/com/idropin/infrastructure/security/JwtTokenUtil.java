package com.idropin.infrastructure.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * JWT Token工具类
 *
 * @author Idrop.in Team
 */
@Slf4j
@Component
public class JwtTokenUtil {

  @Value("${jwt.secret}")
  private String secret;

  @Value("${jwt.expiration}")
  private Long expiration;

  /**
   * 从Token中获取用户名
   */
  public String getUsernameFromToken(String token) {
    return getClaimFromToken(token, Claims::getSubject);
  }

  /**
   * 从Token中获取过期时间
   */
  public Date getExpirationDateFromToken(String token) {
    return getClaimFromToken(token, Claims::getExpiration);
  }

  /**
   * 从Token中获取指定声明
   */
  public <T> T getClaimFromToken(String token, Function<Claims, T> claimsResolver) {
    final Claims claims = getAllClaimsFromToken(token);
    if (claims == null) {
      return null;
    }
    return claimsResolver.apply(claims);
  }

  /**
   * 解析Token获取所有声明
   */
  private Claims getAllClaimsFromToken(String token) {
    try {
      return Jwts.parser()
          .verifyWith(getSigningKey())
          .build()
          .parseSignedClaims(token)
          .getPayload();
    } catch (Exception e) {
      log.error("解析JWT Token失败: {}", token, e);
      return null;
    }
  }

  /**
   * 检查Token是否过期
   */
  private Boolean isTokenExpired(String token) {
    final Date expiration = getExpirationDateFromToken(token);
    return expiration.before(new Date());
  }

  /**
   * 生成Token
   */
  public String generateToken(String username) {
    Map<String, Object> claims = new HashMap<>();
    return doGenerateToken(claims, username);
  }

  /**
   * 生成Token
   */
  private String doGenerateToken(Map<String, Object> claims, String subject) {
    final Date createdDate = new Date();
    final Date expirationDate = new Date(createdDate.getTime() + expiration);

    return Jwts.builder()
        .claims(claims)
        .subject(subject)
        .issuedAt(createdDate)
        .expiration(expirationDate)
        .signWith(getSigningKey())
        .compact();
  }

  /**
   * 验证Token
   */
  public Boolean validateToken(String token, String username) {
    final String tokenUsername = getUsernameFromToken(token);
    return (tokenUsername.equals(username) && !isTokenExpired(token));
  }

  /**
   * 获取签名密钥
   */
  private SecretKey getSigningKey() {
    return Keys.hmacShaKeyFor(secret.getBytes());
  }
}
