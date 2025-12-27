# Idrop.in - 云集 | 详细实施计划

## 📋 项目概述

### 基本信息
- **项目名称**: Idrop.in - 云集
- **项目类型**: 智能文件收集与管理平台
- **开发周期**: 14-20周 (3.5-5个月)
- **技术栈**: Spring Boot 3.x + PostgreSQL 16 + Next.js 14 + Redis 7.x
- **目标用户**: 教育机构、企业团队、创意社群、个人用户

### 项目目标
1. 打造一个技术先进、体验优秀的文件管理平台
2. 展示现代化技术栈的应用能力
3. 实现AI智能分类、全文搜索等创新功能
4. 为毕业设计提供高质量的技术成果

---

## 🗓️ 总体时间规划

```
第1-3周:  基础架构搭建
第4-8周:  核心功能开发
第9-12周: 创新功能开发
第13-15周: UI/UX优化
第16-18周: 测试与优化
第19-20周: 文档与部署
```

---

## 📅 第一阶段: 基础架构搭建 (第1-3周)

### 第1周: 项目初始化与环境配置

#### 任务清单
- [ ] **创建项目结构**
  - [ ] 创建GitHub仓库
  - [ ] 初始化后端项目(Spring Boot 3.x)
  - [ ] 初始化前端项目(Next.js 14)
  - [ ] 配置Git工作流

- [ ] **开发环境搭建**
  - [ ] 安装JDK 17
  - [ ] 安装PostgreSQL 16
  - [ ] 安装Redis 7.x
  - [ ] 安装Node.js 18+
  - [ ] 配置IDE(IntelliJ IDEA + VS Code)

- [ ] **基础配置**
  - [ ] 配置Maven/Gradle
  - [ ] 配置数据库连接
  - [ ] 配置Redis连接
  - [ ] 配置环境变量

#### 技术要点
```bash
# 创建Spring Boot项目
curl https://start.spring.io/starter.zip \
  -d dependencies=web,data-jpa,security,validation,redis \
  -d type=maven-project \
  -d language=java \
  -d bootVersion=3.2.0 \
  -d baseDir=idropin-backend \
  -o idropin-backend.zip

# 创建Next.js项目
npx create-next-app@latest idropin-frontend \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"
```

#### 交付成果
- ✅ 可运行的前后端项目框架
- ✅ 数据库连接成功
- ✅ Redis连接成功
- ✅ 基础配置文件完成

---

### 第2周: 数据库设计与建表

#### 任务清单
- [ ] **数据库设计**
  - [ ] 设计ER图
  - [ ] 设计表结构
  - [ ] 设计索引策略
  - [ ] 设计关系映射

- [ ] **数据库初始化**
  - [ ] 创建数据库
  - [ ] 创建所有表
  - [ ] 创建索引
  - [ ] 插入测试数据

- [ ] **ORM配置**
  - [ ] 配置MyBatis Plus
  - [ ] 创建实体类
  - [ ] 创建Mapper接口
  - [ ] 配置代码生成器

#### 数据库设计

```sql
-- 用户表
CREATE TABLE sys_user (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    metadata JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 文件表
CREATE TABLE file (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    storage_provider VARCHAR(50) DEFAULT 'MINIO',
    metadata JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    category_id UUID REFERENCES file_category(id),
    uploader_id UUID NOT NULL REFERENCES sys_user(id),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 文件分类表
CREATE TABLE file_category (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    parent_id UUID REFERENCES file_category(id),
    icon VARCHAR(50),
    color VARCHAR(20),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 文件分享表
CREATE TABLE file_share (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES file(id),
    share_code VARCHAR(32) UNIQUE NOT NULL,
    password VARCHAR(255),
    expire_at TIMESTAMP,
    download_limit INTEGER,
    download_count INTEGER DEFAULT 0,
    created_by UUID NOT NULL REFERENCES sys_user(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 收集任务表
CREATE TABLE collection_task (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    deadline TIMESTAMP,
    allow_anonymous BOOLEAN DEFAULT FALSE,
    require_login BOOLEAN DEFAULT TRUE,
    max_file_size BIGINT,
    allowed_types TEXT[],
    created_by UUID NOT NULL REFERENCES sys_user(id),
    status VARCHAR(20) DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 文件提交记录表
CREATE TABLE file_submission (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES collection_task(id),
    file_id UUID NOT NULL REFERENCES file(id),
    submitter_id UUID REFERENCES sys_user(id),
    submitter_name VARCHAR(100),
    submitter_email VARCHAR(100),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_file_uploader ON file(uploader_id);
CREATE INDEX idx_file_category ON file(category_id);
CREATE INDEX idx_file_tags ON file USING GIN(tags);
CREATE INDEX idx_file_metadata ON file USING GIN(metadata);
CREATE INDEX idx_file_created_at ON file(created_at DESC);
CREATE INDEX idx_collection_task_created_by ON collection_task(created_by);
CREATE INDEX idx_file_submission_task ON file_submission(task_id);

-- 全文搜索索引
CREATE INDEX idx_file_search ON file
USING GIN(to_tsvector('chinese', name || ' ' || COALESCE(metadata->>'description', '')));
```

#### 交付成果
- ✅ 完整的数据库设计文档
- ✅ 所有表创建完成
- ✅ 索引创建完成
- ✅ 实体类和Mapper生成完成

---

### 第3周: 用户认证与权限系统

#### 任务清单
- [ ] **Spring Security配置**
  - [ ] 配置JWT认证
  - [ ] 配置OAuth2
  - [ ] 配置权限控制
  - [ ] 配置CORS

- [ ] **用户管理功能**
  - [ ] 用户注册
  - [ ] 用户登录
  - [ ] 密码重置
  - [ ] 用户信息管理

- [ ] **前端认证集成**
  - [ ] 登录页面
  - [ ] 注册页面
  - [ ] Token管理
  - [ ] 路由守卫

#### 技术实现

```java
// JWT工具类
@Component
public class JwtTokenUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private Long expiration;

    public String generateToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        return doGenerateToken(claims, userDetails.getUsername());
    }

    private String doGenerateToken(Map<String, Object> claims, String subject) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration);

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(SignatureAlgorithm.HS512, secret)
                .compact();
    }
}

// Spring Security配置
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/public/**").permitAll()
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class)
                .build();
    }
}
```

#### 交付成果
- ✅ 用户注册功能完成
- ✅ 用户登录功能完成
- ✅ JWT认证完成
- ✅ 权限控制完成

---

## 📅 第二阶段: 核心功能开发 (第4-8周)

### 第4周: 文件上传功能

#### 任务清单
- [ ] **文件上传接口**
  - [ ] 单文件上传
  - [ ] 多文件上传
  - [ ] 大文件分片上传
  - [ ] 断点续传

- [ ] **文件存储集成**
  - [ ] MinIO集成
  - [ ] 阿里云OSS集成(备选)
  - [ ] 文件路径管理
  - [ ] 文件重命名

- [ ] **前端上传组件**
  - [ ] 拖拽上传
  - [ ] 进度显示
  - [ ] 上传队列
  - [ ] 错误处理

#### 技术实现

```java
// 文件上传服务
@Service
public class FileUploadService {

    @Autowired
    private MinioClient minioClient;

    @Value("${minio.bucket}")
    private String bucket;

    public FileUploadResult uploadFile(MultipartFile file, UUID userId) {
        try {
            // 生成文件名
            String fileName = generateFileName(file.getOriginalFilename());

            // 上传到MinIO
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucket)
                            .object(fileName)
                            .stream(file.getInputStream(), file.getSize(), -1)
                            .contentType(file.getContentType())
                            .build());

            // 保存文件记录到数据库
            FileEntity fileEntity = new FileEntity();
            fileEntity.setName(fileName);
            fileEntity.setOriginalName(file.getOriginalFilename());
            fileEntity.setFileSize(file.getSize());
            fileEntity.setMimeType(file.getContentType());
            fileEntity.setStoragePath(fileName);
            fileEntity.setUploaderId(userId);
            fileRepository.save(fileEntity);

            return FileUploadResult.builder()
                    .fileId(fileEntity.getId())
                    .fileName(fileEntity.getName())
                    .fileUrl(getFileUrl(fileName))
                    .build();

        } catch (Exception e) {
            throw new FileUploadException("文件上传失败", e);
        }
    }

    private String generateFileName(String originalName) {
        String extension = originalName.substring(originalName.lastIndexOf("."));
        return UUID.randomUUID().toString() + extension;
    }

    private String getFileUrl(String fileName) {
        return String.format("http://localhost:9000/%s/%s", bucket, fileName);
    }
}
```

#### 交付成果
- ✅ 单文件上传功能完成
- ✅ 多文件上传功能完成
- ✅ 大文件分片上传完成
- ✅ 前端上传组件完成

---

### 第5周: 文件下载与预览

#### 任务清单
- [ ] **文件下载功能**
  - [ ] 单文件下载
  - [ ] 批量下载
  - [ ] 下载权限控制
  - [ ] 下载限速

- [ ] **文件预览功能**
  - [ ] 图片预览
  - [ ] 视频预览
  - [ ] PDF预览
  - [ ] Office文档预览

- [ ] **前端预览组件**
  - [ ] 图片查看器
  - [ ] 视频播放器
  - [ ] PDF查看器
  - [ ] 文档查看器

#### 技术实现

```java
// 文件下载服务
@Service
public class FileDownloadService {

    @Autowired
    private MinioClient minioClient;

    @Autowired
    private FileRepository fileRepository;

    public void downloadFile(UUID fileId, HttpServletResponse response, UUID userId) {
        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new FileNotFoundException("文件不存在"));

        // 检查权限
        if (!hasDownloadPermission(file, userId)) {
            throw new AccessDeniedException("无下载权限");
        }

        try {
            // 从MinIO获取文件流
            InputStream stream = minioClient.getObject(
                    GetObjectArgs.builder()
                            .bucket(bucket)
                            .object(file.getStoragePath())
                            .build());

            // 设置响应头
            response.setContentType(file.getMimeType());
            response.setHeader("Content-Disposition",
                    "attachment; filename=\"" + file.getOriginalName() + "\"");

            // 写入响应流
            IOUtils.copy(stream, response.getOutputStream());
            stream.close();

        } catch (Exception e) {
            throw new FileDownloadException("文件下载失败", e);
        }
    }

    private boolean hasDownloadPermission(FileEntity file, UUID userId) {
        // 检查文件是否公开或用户有权限
        return file.getUploaderId().equals(userId) || isPublicFile(file);
    }
}
```

#### 交付成果
- ✅ 文件下载功能完成
- ✅ 文件预览功能完成
- ✅ 权限控制完成
- ✅ 前端预览组件完成

---

### 第6周: 文件管理功能

#### 任务清单
- [ ] **文件CRUD操作**
  - [ ] 文件列表查询
  - [ ] 文件详情查看
  - [ ] 文件信息修改
  - [ ] 文件删除

- [ ] **批量操作**
  - [ ] 批量删除
  - [ ] 批量移动
  - [ ] 批量重命名
  - [ ] 批量分享

- [ ] **文件分类与标签**
  - [ ] 分类管理
  - [ ] 标签管理
  - [ ] 文件分类
  - [ ] 文件打标签

#### 技术实现

```java
// 文件管理服务
@Service
public class FileManagementService {

    @Autowired
    private FileRepository fileRepository;

    @Autowired
    private FileCategoryRepository categoryRepository;

    public Page<FileEntity> getFiles(FileQuery query) {
        Pageable pageable = PageRequest.of(query.getPage(), query.getSize(),
                Sort.by(Sort.Direction.DESC, "createdAt"));

        Specification<FileEntity> spec = (root, criteriaQuery, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 用户过滤
            if (query.getUserId() != null) {
                predicates.add(criteriaBuilder.equal(root.get("uploaderId"), query.getUserId()));
            }

            // 分类过滤
            if (query.getCategoryId() != null) {
                predicates.add(criteriaBuilder.equal(root.get("categoryId"), query.getCategoryId()));
            }

            // 标签过滤
            if (query.getTags() != null && !query.getTags().isEmpty()) {
                predicates.add(criteriaBuilder.isTrue(
                        criteriaBuilder.function("array_contains", Boolean.class,
                                root.get("tags"),
                                criteriaBuilder.literal(query.getTags().get(0)))));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        return fileRepository.findAll(spec, pageable);
    }

    public FileEntity updateFileInfo(UUID fileId, FileUpdateRequest request) {
        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new FileNotFoundException("文件不存在"));

        file.setName(request.getName());
        file.setCategoryId(request.getCategoryId());
        file.setTags(request.getTags());
        file.setMetadata(request.getMetadata());

        return fileRepository.save(file);
    }

    public void deleteFile(UUID fileId, UUID userId) {
        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new FileNotFoundException("文件不存在"));

        // 检查权限
        if (!file.getUploaderId().equals(userId)) {
            throw new AccessDeniedException("无删除权限");
        }

        // 删除文件记录
        fileRepository.deleteById(fileId);

        // 删除物理文件
        deletePhysicalFile(file.getStoragePath());
    }

    private void deletePhysicalFile(String storagePath) {
        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(bucket)
                            .object(storagePath)
                            .build());
        } catch (Exception e) {
            log.error("删除物理文件失败: {}", storagePath, e);
        }
    }
}
```

#### 交付成果
- ✅ 文件CRUD功能完成
- ✅ 批量操作完成
- ✅ 分类与标签功能完成

---

### 第7周: 收集任务功能

#### 任务清单
- [ ] **收集任务管理**
  - [ ] 创建收集任务
  - [ ] 查看收集任务
  - [ ] 编辑收集任务
  - [ ] 删除收集任务

- [ ] **文件提交**
  - [ ] 提交文件到任务
  - [ ] 查看提交记录
  - [ ] 提交权限控制
  - [ ] 匿名提交支持

- [ ] **任务统计**
  - [ ] 提交数量统计
  - [ ] 文件类型统计
  - [ ] 提交者统计
  - [ ] 进度展示

#### 技术实现

```java
// 收集任务服务
@Service
public class CollectionTaskService {

    @Autowired
    private CollectionTaskRepository taskRepository;

    @Autowired
    private FileSubmissionRepository submissionRepository;

    public CollectionTask createTask(CreateTaskRequest request, UUID userId) {
        CollectionTask task = new CollectionTask();
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setDeadline(request.getDeadline());
        task.setAllowAnonymous(request.isAllowAnonymous());
        task.setRequireLogin(request.isRequireLogin());
        task.setMaxFileSize(request.getMaxFileSize());
        task.setAllowedTypes(request.getAllowedTypes());
        task.setCreatedBy(userId);
        task.setStatus("OPEN");

        return taskRepository.save(task);
    }

    public FileSubmission submitFile(UUID taskId, MultipartFile file,
                                     UUID userId, String submitterName, String submitterEmail) {
        CollectionTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new TaskNotFoundException("任务不存在"));

        // 检查任务状态
        if (!"OPEN".equals(task.getStatus())) {
            throw new TaskClosedException("任务已关闭");
        }

        // 检查截止时间
        if (task.getDeadline() != null && task.getDeadline().before(new Date())) {
            throw new TaskExpiredException("任务已过期");
        }

        // 上传文件
        FileUploadResult uploadResult = fileUploadService.uploadFile(file, userId);

        // 创建提交记录
        FileSubmission submission = new FileSubmission();
        submission.setTaskId(taskId);
        submission.setFileId(uploadResult.getFileId());
        submission.setSubmitterId(userId);
        submission.setSubmitterName(submitterName);
        submission.setSubmitterEmail(submitterEmail);

        return submissionRepository.save(submission);
    }

    public TaskStatistics getTaskStatistics(UUID taskId) {
        CollectionTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new TaskNotFoundException("任务不存在"));

        List<FileSubmission> submissions = submissionRepository.findByTaskId(taskId);

        return TaskStatistics.builder()
                .taskId(taskId)
                .taskTitle(task.getTitle())
                .totalSubmissions(submissions.size())
                .uniqueSubmitters(getUniqueSubmitterCount(submissions))
                .fileTypeDistribution(getFileTypeDistribution(submissions))
                .build();
    }
}
```

#### 交付成果
- ✅ 收集任务管理完成
- ✅ 文件提交功能完成
- ✅ 任务统计完成

---

### 第8周: 文件分享功能

#### 任务清单
- [ ] **文件分享**
  - [ ] 生成分享链接
  - [ ] 设置分享密码
  - [ ] 设置有效期
  - [ ] 设置下载次数限制

- [ ] **分享管理**
  - [ ] 查看分享记录
  - [ ] 取消分享
  - [ ] 更新分享设置
  - [ ] 分享统计

- [ ] **分享访问**
  - [ ] 通过链接访问
  - [ ] 密码验证
  - [ ] 下载统计
  - [ ] 访问日志

#### 技术实现

```java
// 文件分享服务
@Service
public class FileShareService {

    @Autowired
    private FileShareRepository shareRepository;

    @Autowired
    private FileRepository fileRepository;

    public FileShare createShare(CreateShareRequest request, UUID userId) {
        FileEntity file = fileRepository.findById(request.getFileId())
                .orElseThrow(() -> new FileNotFoundException("文件不存在"));

        // 检查权限
        if (!file.getUploaderId().equals(userId)) {
            throw new AccessDeniedException("无分享权限");
        }

        // 生成分享码
        String shareCode = generateShareCode();

        FileShare share = new FileShare();
        share.setFileId(request.getFileId());
        share.setShareCode(shareCode);
        share.setPassword(request.getPassword());
        share.setExpireAt(request.getExpireAt());
        share.setDownloadLimit(request.getDownloadLimit());
        share.setDownloadCount(0);
        share.setCreatedBy(userId);

        return shareRepository.save(share);
    }

    public FileEntity accessShare(String shareCode, String password) {
        FileShare share = shareRepository.findByShareCode(shareCode)
                .orElseThrow(() -> new ShareNotFoundException("分享不存在"));

        // 检查密码
        if (share.getPassword() != null && !share.getPassword().equals(password)) {
            throw new InvalidPasswordException("密码错误");
        }

        // 检查有效期
        if (share.getExpireAt() != null && share.getExpireAt().before(new Date())) {
            throw new ShareExpiredException("分享已过期");
        }

        // 检查下载次数
        if (share.getDownloadLimit() != null &&
                share.getDownloadCount() >= share.getDownloadLimit()) {
            throw new DownloadLimitExceededException("下载次数已用完");
        }

        // 增加下载计数
        share.setDownloadCount(share.getDownloadCount() + 1);
        shareRepository.save(share);

        return fileRepository.findById(share.getFileId()).get();
    }

    private String generateShareCode() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 32);
    }
}
```

#### 交付成果
- ✅ 文件分享功能完成
- ✅ 分享管理完成
- ✅ 分享访问完成

---

## 📅 第三阶段: 创新功能开发 (第9-12周)

### 第9周: AI智能分类

#### 任务清单
- [ ] **AI服务集成**
  - [ ] 百度AI集成
  - [ ] 腾讯云AI集成
  - [ ] 图像识别
  - [ ] 文本分类

- [ ] **自动分类**
  - [ ] 上传时自动分类
  - [ ] 批量分类
  - [ ] 分类规则配置
  - [ ] 分类结果审核

- [ ] **前端展示**
  - [ ] 分类建议展示
  - [ ] 分类确认
  - [ ] 分类历史
  - [ ] 分类统计

#### 技术实现

```java
// AI分类服务
@Service
public class AIClassificationService {

    @Autowired
    private BaiduAIClient baiduAIClient;

    public FileCategory classifyFile(MultipartFile file) {
        try {
            if (isImageFile(file)) {
                return classifyImage(file);
            } else if (isTextFile(file)) {
                return classifyText(file);
            }
            return FileCategory.OTHER;
        } catch (Exception e) {
            log.error("AI分类失败", e);
            return FileCategory.OTHER;
        }
    }

    private FileCategory classifyImage(MultipartFile file) throws Exception {
        // 调用百度图像识别API
        ImageClassifyResponse response = baiduAIClient.imageClassify(file.getBytes());

        // 解析分类结果
        String className = response.getResult().get(0).getName();

        // 映射到文件分类
        return mapToCategory(className);
    }

    private FileCategory classifyText(MultipartFile file) throws Exception {
        // 读取文本内容
        String content = new String(file.getBytes(), StandardCharsets.UTF_8);

        // 调用文本分类API
        TextClassifyResponse response = baiduAIClient.textClassify(content);

        // 映射到文件分类
        return mapToCategory(response.getResult().get(0).getName());
    }

    private FileCategory mapToCategory(String className) {
        // 根据AI返回的分类名称映射到系统分类
        if (className.contains("文档")) {
            return FileCategory.DOCUMENT;
        } else if (className.contains("图片")) {
            return FileCategory.IMAGE;
        } else if (className.contains("视频")) {
            return FileCategory.VIDEO;
        }
        return FileCategory.OTHER;
    }
}
```

#### 交付成果
- ✅ AI分类功能完成
- ✅ 自动分类完成
- ✅ 前端展示完成

---

### 第10周: 全文搜索

#### 任务清单
- [ ] **Elasticsearch集成**
  - [ ] 安装Elasticsearch
  - [ ] 配置索引
  - [ ] 配置分词器
  - [ ] 配置映射

- [ ] **数据同步**
  - [ ] 文件索引创建
  - [ ] 索引更新
  - [ ] 索引删除
  - [ ] 批量同步

- [ ] **搜索功能**
  - [ ] 全文搜索
  - [ ] 高级搜索
  - [ ] 搜索建议
  - [ ] 搜索历史

#### 技术实现

```java
// 搜索服务
@Service
public class SearchService {

    @Autowired
    private ElasticsearchRestTemplate elasticsearchTemplate;

    public SearchResult searchFiles(SearchQuery query) {
        BoolQueryBuilder boolQuery = QueryBuilders.boolQuery();

        // 文件名搜索
        if (StringUtils.hasText(query.getKeyword())) {
            boolQuery.should(QueryBuilders.matchQuery("name", query.getKeyword()))
                    .should(QueryBuilders.matchQuery("metadata.description", query.getKeyword()));
        }

        // 标签搜索
        if (!CollectionUtils.isEmpty(query.getTags())) {
            boolQuery.filter(QueryBuilders.termsQuery("tags", query.getTags()));
        }

        // 分类搜索
        if (query.getCategoryId() != null) {
            boolQuery.filter(QueryBuilders.termQuery("categoryId", query.getCategoryId()));
        }

        // 构建搜索请求
        NativeSearchQuery searchQuery = new NativeSearchQueryBuilder()
                .withQuery(boolQuery)
                .withPageable(PageRequest.of(query.getPage(), query.getSize()))
                .build();

        // 执行搜索
        SearchHits<FileDocument> searchHits = elasticsearchTemplate.search(searchQuery, FileDocument.class);

        return SearchResult.builder()
                .total(searchHits.getTotalHits())
                .files(searchHits.getSearchHits().stream()
                        .map(hit -> hit.getContent())
                        .collect(Collectors.toList()))
                .build();
    }

    public void indexFile(FileEntity file) {
        FileDocument document = new FileDocument();
        document.setId(file.getId().toString());
        document.setName(file.getName());
        document.setOriginalName(file.getOriginalName());
        document.setMetadata(file.getMetadata());
        document.setTags(file.getTags());
        document.setCategoryId(file.getCategoryId());
        document.setCreatedAt(file.getCreatedAt());

        elasticsearchTemplate.save(document);
    }
}
```

#### 交付成果
- ✅ Elasticsearch集成完成
- ✅ 数据同步完成
- ✅ 搜索功能完成

---

### 第11周: 实时数据分析

#### 任务清单
- [ ] **数据统计服务**
  - [ ] 文件统计
  - [ ] 用户统计
  - [ ] 存储统计
  - [ ] 活动统计

- [ ] **WebSocket实时推送**
  - [ ] WebSocket配置
  - [ ] 实时数据推送
  - [ ] 订阅管理
  - [ ] 连接管理

- [ ] **前端可视化**
  - [ ] 统计图表
  - [ ] 实时更新
  - [ ] 数据导出
  - [ ] 自定义报表

#### 技术实现

```java
// 统计服务
@Service
public class StatisticsService {

    @Autowired
    private FileRepository fileRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Scheduled(fixedRate = 5000)
    public void broadcastStatistics() {
        FileStatistics statistics = getStatistics();

        // 推送统计数据到前端
        messagingTemplate.convertAndSend("/topic/statistics", statistics);
    }

    public FileStatistics getStatistics() {
        return FileStatistics.builder()
                .totalFiles(fileRepository.count())
                .totalSize(fileRepository.sumFileSize())
                .fileTypeDistribution(getFileTypeDistribution())
                .uploadTrend(getUploadTrend())
                .userActivity(getUserActivity())
                .build();
    }

    private Map<String, Long> getFileTypeDistribution() {
        // 使用PostgreSQL的聚合功能
        String sql = "SELECT mime_type, COUNT(*) as count FROM file GROUP BY mime_type";
        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            return Map.entry(rs.getString("mime_type"), rs.getLong("count"));
        }).stream().collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
    }

    private List<TrendData> getUploadTrend() {
        // 获取最近7天的上传趋势
        String sql = "SELECT DATE(created_at) as date, COUNT(*) as count " +
                     "FROM file WHERE created_at >= NOW() - INTERVAL '7 days' " +
                     "GROUP BY DATE(created_at) ORDER BY date";

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            return TrendData.builder()
                    .date(rs.getDate("date").toLocalDate())
                    .count(rs.getLong("count"))
                    .build();
        });
    }
}
```

#### 交付成果
- ✅ 数据统计完成
- ✅ WebSocket推送完成
- ✅ 前端可视化完成

---

### 第12周: PWA离线功能

#### 任务清单
- [ ] **PWA配置**
  - [ ] Manifest配置
  - [ ] Service Worker配置
  - [ ] 缓存策略
  - [ ] 离线页面

- [ ] **离线功能**
  - [ ] 离线文件列表
  - [ ] 离线文件预览
  - [ ] 离线上传队列
  - [ ] 同步机制

- [ ] **推送通知**
  - [ ] 通知权限
  - [ ] 推送消息
  - [ ] 通知管理
  - [ ] 通知历史

#### 技术实现

```typescript
// Service Worker配置
// public/sw.js
const CACHE_NAME = 'idropin-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/api/files',
  '/static/js/main.js',
  '/static/css/main.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-uploads') {
    event.waitUntil(syncPendingUploads());
  }
});

async function syncPendingUploads() {
  // 同步离线期间的上传
  const pendingUploads = await getPendingUploads();
  for (const upload of pendingUploads) {
    await uploadToServer(upload);
  }
}
```

```typescript
// 离线上传Hook
// hooks/useOfflineUpload.ts
export function useOfflineUpload() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingUploads, setPendingUploads] = useState<Upload[]>([]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingUploads();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const uploadFile = async (file: File) => {
    if (isOnline) {
      return await uploadToServer(file);
    } else {
      // 离线时存储到IndexedDB
      await storeOffline(file);
      setPendingUploads(prev => [...prev, file]);
    }
  };

  return { uploadFile, isOnline, pendingUploads };
}
```

#### 交付成果
- ✅ PWA配置完成
- ✅ 离线功能完成
- ✅ 推送通知完成

---

## 📅 第四阶段: UI/UX优化 (第13-15周)

### 第13周: 响应式设计与暗黑模式

#### 任务清单
- [ ] **响应式设计**
  - [ ] 移动端适配
  - [ ] 平板适配
  - [ ] 桌面端优化
  - [ ] 断点测试

- [ ] **暗黑模式**
  - [ ] 主题配置
  - [ ] 颜色适配
  - [ ] 切换功能
  - [ ] 自动切换

- [ ] **动画效果**
  - [ ] 页面过渡
  - [ ] 加载动画
  - [ ] 交互反馈
  - [ ] 微交互

#### 技术实现

```typescript
// 主题配置
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        dark: {
          bg: '#0f172a',
          surface: '#1e293b',
        }
      }
    }
  }
}

export default config
```

```typescript
// 主题切换组件
// components/ThemeToggle.tsx
'use client'

import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}
```

#### 交付成果
- ✅ 响应式设计完成
- ✅ 暗黑模式完成
- ✅ 动画效果完成

---

### 第14周: 性能优化

#### 任务清单
- [ ] **前端优化**
  - [ ] 代码分割
  - [ ] 图片优化
  - [ ] 懒加载
  - [ ] 缓存策略

- [ ] **后端优化**
  - [ ] 接口优化
  - [ ] 数据库优化
  - [ ] 缓存优化
  - [ ] 查询优化

- [ ] **加载优化**
  - [ ] 首屏优化
  - [ ] 资源压缩
  - [ ] CDN加速
  - [ ] 预加载

#### 技术实现

```java
// 缓存配置
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory factory) {
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(30))
                .serializeKeysWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new GenericJackson2JsonRedisSerializer()));

        return RedisCacheManager.builder(factory)
                .cacheDefaults(config)
                .build();
    }
}

// 缓存使用
@Service
public class FileService {

    @Cacheable(value = "files", key = "#id")
    public FileEntity getFileById(UUID id) {
        return fileRepository.findById(id).orElse(null);
    }

    @CacheEvict(value = "files", key = "#file.id")
    public FileEntity updateFile(FileEntity file) {
        return fileRepository.save(file);
    }
}
```

```typescript
// 图片优化
// components/OptimizedImage.tsx
import Image from 'next/image'

export function OptimizedImage({ src, alt, width, height }: ImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAB//Z"
    />
  )
}
```

#### 交付成果
- ✅ 前端优化完成
- ✅ 后端优化完成
- ✅ 加载优化完成

---

### 第15周: 用户体验优化

#### 任务清单
- [ ] **交互优化**
  - [ ] 操作反馈
  - [ ] 错误提示
  - [ ] 加载状态
  - [ ] 空状态

- [ ] **可用性优化**
  - [ ] 快捷操作
  - [ ] 键盘支持
  - [ ] 无障碍访问
  - [ ] 国际化

- [ ] **细节优化**
  - [ ] 图标优化
  - [ ] 字体优化
  - [ ] 间距优化
  - [ ] 颜色优化

#### 交付成果
- ✅ 交互优化完成
- ✅ 可用性优化完成
- ✅ 细节优化完成

---

## 📅 第五阶段: 测试与优化 (第16-18周)

### 第16周: 单元测试与集成测试

#### 任务清单
- [ ] **单元测试**
  - [ ] Service层测试
  - [ ] Controller层测试
  - [ ] 工具类测试
  - [ ] 覆盖率统计

- [ ] **集成测试**
  - [ ] API测试
  - [ ] 数据库测试
  - [ ] Redis测试
  - [ ] 外部服务测试

- [ ] **前端测试**
  - [ ] 组件测试
  - [ ] 页面测试
  - [ ] E2E测试
  - [ ] 可访问性测试

#### 技术实现

```java
// Service测试
@SpringBootTest
class FileServiceTest {

    @Autowired
    private FileService fileService;

    @MockBean
    private FileRepository fileRepository;

    @Test
    void shouldGetFileById() {
        // Given
        UUID fileId = UUID.randomUUID();
        FileEntity file = new FileEntity();
        file.setId(fileId);
        file.setName("test.pdf");

        when(fileRepository.findById(fileId)).thenReturn(Optional.of(file));

        // When
        FileEntity result = fileService.getFileById(fileId);

        // Then
        assertNotNull(result);
        assertEquals("test.pdf", result.getName());
    }
}
```

```typescript
// 组件测试
// __tests__/FileList.test.tsx
import { render, screen } from '@testing-library/react'
import FileList from '@/components/FileList'

describe('FileList', () => {
  it('should render files', () => {
    const files = [
      { id: '1', name: 'test.pdf' },
      { id: '2', name: 'test.jpg' }
    ]

    render(<FileList files={files} />)

    expect(screen.getByText('test.pdf')).toBeInTheDocument()
    expect(screen.getByText('test.jpg')).toBeInTheDocument()
  })
})
```

#### 交付成果
- ✅ 单元测试完成
- ✅ 集成测试完成
- ✅ 前端测试完成
- ✅ 测试覆盖率达标

---

### 第17周: 性能测试与安全测试

#### 任务清单
- [ ] **性能测试**
  - [ ] 压力测试
  - [ ] 负载测试
  - [ ] 并发测试
  - [ ] 性能优化

- [ ] **安全测试**
  - [ ] SQL注入测试
  - [ ] XSS测试
  - [ ] CSRF测试
  - [ ] 权限测试

- [ ] **兼容性测试**
  - [ ] 浏览器兼容性
  - [ ] 移动端兼容性
  - [ ] 系统兼容性
  - [ ] 版本兼容性

#### 技术实现

```bash
# 使用JMeter进行压力测试
jmeter -n -t test_plan.jmx -l results.jtl -e -o report/

# 使用OWASP ZAP进行安全扫描
zap-cli quick-scan --self-contained --start-options '-config api.disablekey=true' http://localhost:8080
```

#### 交付成果
- ✅ 性能测试完成
- ✅ 安全测试完成
- ✅ 兼容性测试完成
- ✅ 性能优化完成

---

### 第18周: Bug修复与优化

#### 任务清单
- [ ] **Bug修复**
  - [ ] 修复已知Bug
  - [ ] 回归测试
  - [ ] 验证修复
  - [ ] 文档更新

- [ ] **代码优化**
  - [ ] 代码重构
  - [ ] 性能优化
  - [ ] 代码审查
  - [ ] 最佳实践

- [ ] **文档完善**
  - [ ] API文档
  - ] 用户手册
  - [ ] 部署文档
  - [ ] 维护文档

#### 交付成果
- ✅ Bug修复完成
- ✅ 代码优化完成
- ✅ 文档完善

---

## 📅 第六阶段: 文档与部署 (第19-20周)

### 第19周: 文档编写

#### 任务清单
- [ ] **技术文档**
  - [ ] 系统架构文档
  - [ ] 数据库设计文档
  - [ ] API接口文档
  - [ ] 部署文档

- [ ] **用户文档**
  - [ ] 用户手册
  - [ ] 快速入门
  - [ ] 常见问题
  - [ ] 视频教程

- [ ] **开发文档**
  - [ ] 开发指南
  - [ ] 代码规范
  - [ ] Git工作流
  - [ ] 贡献指南

#### 交付成果
- ✅ 技术文档完成
- ✅ 用户文档完成
- ✅ 开发文档完成

---

### 第20周: 部署与答辩准备

#### 任务清单
- [ ] **环境部署**
  - [ ] 生产环境配置
  - [ ] 数据库部署
  - [ ] 应用部署
  - [ ] 域名配置

- [ ] **监控配置**
  - [ ] 性能监控
  - [ ] 日志监控
  - [ ] 告警配置
  - [ ] 备份策略

- [ ] **答辩准备**
  - [ ] 演示准备
  - [ ] PPT制作
  - [ ] 问题准备
  - [ ] 录屏备份

#### 技术实现

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: idropin
      POSTGRES_USER: idropin
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7
    ports:
      - "6379:6379"

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    depends_on:
      - postgres
      - redis
      - minio
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/idropin
      SPRING_REDIS_HOST: redis
      MINIO_ENDPOINT: http://minio:9000

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
  minio_data:
```

#### 交付成果
- ✅ 生产环境部署完成
- ✅ 监控配置完成
- ✅ 答辩准备完成

---

## 🎯 项目里程碑

| 里程碑 | 时间 | 交付物 |
|--------|------|--------|
| M1: 基础架构完成 | 第3周 | 可运行的前后端框架 |
| M2: 核心功能完成 | 第8周 | 文件管理、收集任务、分享功能 |
| M3: 创新功能完成 | 第12周 | AI分类、搜索、数据分析、PWA |
| M4: UI/UX优化完成 | 第15周 | 响应式设计、暗黑模式、性能优化 |
| M5: 测试完成 | 第18周 | 单元测试、集成测试、性能测试 |
| M6: 项目完成 | 第20周 | 完整系统、文档、部署 |

---

## 📊 风险管理

### 技术风险
- **风险**: AI服务不稳定
- **应对**: 准备多个AI服务提供商,实现降级方案

- **风险**: Elasticsearch性能问题
- **应对**: 优化索引策略,使用缓存

### 时间风险
- **风险**: 开发进度延迟
- **应对**: 合理安排优先级,及时调整计划

### 资源风险
- **风险**: 服务器资源不足
- **应对**: 使用云服务,按需扩展

---

## 🎓 成功标准

### 技术标准
- ✅ 所有核心功能正常运行
- ✅ 系统性能达到预期
- ✅ 测试覆盖率 > 80%
- ✅ 无严重Bug

### 文档标准
- ✅ 完整的技术文档
- ✅ 清晰的用户手册
- ✅ 详细的API文档

### 答辩标准
- ✅ 功能演示流畅
- ✅ 技术讲解清晰
- ✅ 问题回答准确
- ✅ 创新点突出

---

## 💪 加油!

这个实施计划为你提供了详细的开发路线图。按照这个计划执行,你一定能够完成一个高质量的毕业设计项目!

记住:
1. **循序渐进**: 按照计划逐步完成,不要急于求成
2. **及时调整**: 根据实际情况灵活调整计划
3. **持续学习**: 在开发过程中不断学习新技术
4. **保持热情**: 保持对技术的热情和动力

**祝你的毕业设计顺利完成!** 🚀🎓
