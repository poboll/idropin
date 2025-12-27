# Java项目内存优化启动脚本

## 🎯 优化后的启动命令（宝塔面板直接粘贴 - 单行格式）

### 1. 接口服务 (oculichat-interface) - 端口8081
```bash
/www/server/java/jdk1.8.0_371/bin/java -jar -Xms128m -Xmx256m -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -XX:+UseStringDeduplication -Dfile.encoding=UTF-8 -Duser.timezone=GMT+8 /www/wwwroot/oculichat.caiths.com/back/oculichat-interface-0.0.1.jar --server.port=8081 --logging.level.root=WARN
```

### 2. 后端服务 (oculichat-back) - 端口7529
```bash
/www/server/java/jdk1.8.0_371/bin/java -jar -Xms128m -Xmx256m -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -XX:+UseStringDeduplication -Dfile.encoding=UTF-8 -Duser.timezone=GMT+8 /www/wwwroot/oculichat.caiths.com/back/oculichat-back-0.0.1.jar --server.port=7529 --logging.level.root=WARN
```

### 3. 网关服务 (oculichat-gateway) - 端口8090
```bash
/www/server/java/jdk1.8.0_371/bin/java -jar -Xms96m -Xmx192m -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -XX:+UseStringDeduplication -Dfile.encoding=UTF-8 -Duser.timezone=GMT+8 /www/wwwroot/oculichat.caiths.com/back/oculichat-gateway-0.0.1-SNAPSHOT.jar --server.port=8090 --logging.level.root=ERROR
```

## 🔥 极简版本（如果上面的参数太多）

### 1. 接口服务 - 极简版
```bash
/www/server/java/jdk1.8.0_371/bin/java -jar -Xms128m -Xmx256m -Duser.timezone=GMT+8 /www/wwwroot/oculichat.caiths.com/back/oculichat-interface-0.0.1.jar --server.port=8081 --logging.level.root=WARN
```

### 2. 后端服务 - 极简版
```bash
/www/server/java/jdk1.8.0_371/bin/java -jar -Xms128m -Xmx256m -Duser.timezone=GMT+8 /www/wwwroot/oculichat.caiths.com/back/oculichat-back-0.0.1.jar --server.port=7529 --logging.level.root=WARN
```

### 3. 网关服务 - 极简版
```bash
/www/server/java/jdk1.8.0_371/bin/java -jar -Xms96m -Xmx192m -Duser.timezone=GMT+8 /www/wwwroot/oculichat.caiths.com/back/oculichat-gateway-0.0.1-SNAPSHOT.jar --server.port=8090 --logging.level.root=ERROR
```

## 📊 内存优化对比

| 服务 | 原配置 | 优化后 | 节省内存 | 说明 |
|------|--------|--------|----------|------|
| Interface | 1024M | 256M | 768M | API接口服务，用户少 |
| Backend | 1024M | 256M | 768M | 后端业务逻辑 |
| Gateway | 1024M | 192M | 832M | 网关转发，最轻量 |
| **总计** | **3072M** | **704M** | **2368M** | **节省77%内存** |

## 🔧 JVM参数详解

### 内存参数
- `-Xms128m`: 初始堆内存128MB，快速启动
- `-Xmx256m`: 最大堆内存256MB，控制峰值
- 网关服务更小：`-Xms96m -Xmx192m`

### GC优化参数
- `-XX:+UseG1GC`: 使用G1垃圾收集器，适合小堆
- `-XX:MaxGCPauseMillis=200`: 最大停顿时间200ms
- `-XX:+UseStringDeduplication`: 字符串去重，节省内存

### 监控参数
- `-XX:+HeapDumpOnOutOfMemoryError`: OOM时自动dump
- `-XX:HeapDumpPath=/tmp/`: dump文件路径

## 🚀 Spring Boot应用配置优化

### application.yml 配置建议
```yaml
# 服务器配置
server:
  tomcat:
    max-threads: 50          # 限制最大线程数
    min-spare-threads: 5     # 最小空闲线程
    accept-count: 100        # 等待队列长度
  compression:
    enabled: true            # 启用响应压缩

# Spring配置
spring:
  main:
    banner-mode: off         # 关闭启动横幅
  servlet:
    multipart:
      max-file-size: 10MB    # 限制文件大小
      max-request-size: 10MB
  
# 数据库连接池优化（如果使用）
  datasource:
    hikari:
      maximum-pool-size: 5   # 最大连接数
      minimum-idle: 2        # 最小空闲连接
      connection-timeout: 20000
      idle-timeout: 300000

# 日志配置
logging:
  file:
    name: logs/app.log
  pattern:
    file: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
```

## 📈 监控和调优建议

### 1. 内存监控命令
```bash
# 查看Java进程内存使用
ps aux | grep java

# 查看堆内存使用情况
jstat -gc [pid] 5s

# 查看详细内存分布
jmap -histo [pid]
```

### 2. 性能调优步骤
1. **启动监控**: 运行1-2天观察内存使用峰值
2. **逐步调优**: 如果峰值<150MB，可继续降低-Xmx
3. **GC调优**: 观察GC频率，必要时调整参数
4. **应用优化**: 移除不必要的依赖和功能

### 3. 极限优化版本（谨慎使用）
如果监控显示内存使用很低，可以尝试：
```bash
# 接口服务极限版
-Xms64m -Xmx128m

# 网关服务极限版  
-Xms48m -Xmx96m
```

## ⚠️ 注意事项

1. **逐步调整**: 不要一次性降太多，建议先用256M运行观察
2. **监控告警**: 设置内存使用率告警，超过80%及时调整
3. **备份方案**: 保留原始启动脚本，出问题时快速回滚
4. **测试验证**: 在测试环境先验证，确认无问题再上生产

## 🎯 最终建议

对于1-2个用户的内部API服务：
- **接口服务**: 256MB完全够用
- **后端服务**: 256MB足够处理业务逻辑  
- **网关服务**: 192MB即可完成转发

总内存从3GB降到700MB，节省77%，大大降低服务器成本！