package com.idropin;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Idrop.in - 云集
 * 智能文件收集与管理平台
 *
 * @author Idrop.in Team
 * @version 1.0.0
 * @since 2024-01-01
 */
@SpringBootApplication
@EnableCaching
@EnableAsync
@EnableScheduling
@MapperScan("com.idropin.infrastructure.persistence.mapper")
public class IdropInApplication {

  public static void main(String[] args) {
    SpringApplication.run(IdropInApplication.class, args);
    System.out.println("""

        ========================================
           Idrop.in - 云集 启动成功!
           智能文件收集与管理平台
        ========================================
        """);
  }
}
