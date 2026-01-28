# 紧急修复：Next.js 图片配置错误

## 问题描述
更换logo图片地址后，出现 Next.js Image 配置错误：
```
Error: Invalid src prop (https://pic.imgdb.cn/item/668cd877d9c307b7e99e9061.png) 
on `next/image`, hostname "pic.imgdb.cn" is not configured under images 
in your `next.config.js`
```

## 根本原因
新的图片域名 `pic.imgdb.cn` 没有添加到 Next.js 的图片域名白名单中。

## 修复方案

### 1. 更新 next.config.js
在 `images.domains` 和 `images.remotePatterns` 中添加新域名：

```javascript
images: {
  domains: ['localhost', 'img.cdn.sugarat.top', 'pic.imgdb.cn'],
  remotePatterns: [
    {
      protocol: 'http',
      hostname: 'localhost',
      port: '9000',
      pathname: '/**',
    },
    {
      protocol: 'https',
      hostname: 'img.cdn.sugarat.top',
    },
    {
      protocol: 'https',
      hostname: 'pic.imgdb.cn',  // 新增
    }
  ],
  // ...
}
```

### 2. 自动重启
Next.js 检测到配置文件变化后会自动重启服务器，无需手动重启。

## 验证步骤

1. **检查配置文件**
```bash
cat idropin-frontend/next.config.js | grep -A 20 "images:"
```

2. **访问任务提交页面**
```
http://localhost:5224/task/[任务key]
```

3. **检查浏览器控制台**
- 不应该有图片加载错误
- logo 应该正常显示

4. **检查 Network 面板**
- 图片请求状态应该是 200
- 图片应该通过 Next.js Image Optimization 加载

## 经验教训

### ❌ 错误做法
1. 没有在本地测试就直接推送
2. 更换外部资源URL时没有检查配置
3. 没有验证页面是否正常工作

### ✅ 正确做法
1. **本地测试优先**
   - 在浏览器中打开页面
   - 检查控制台是否有错误
   - 验证所有功能正常

2. **配置检查清单**
   - 使用外部图片？→ 检查 next.config.js
   - 使用外部API？→ 检查 CORS 配置
   - 使用外部字体？→ 检查 CSP 配置

3. **推送前验证**
   ```bash
   # 1. 检查编译错误
   npm run build
   
   # 2. 运行开发服务器
   npm run dev
   
   # 3. 在浏览器中测试
   # 4. 检查控制台错误
   # 5. 确认无误后再推送
   ```

## Git 提交规范

### 功能开发流程
```bash
# 1. 开发功能
# 2. 本地测试
# 3. 确认无误
git add .
git commit -m "feat: 功能描述"

# 4. 再次测试
# 5. 推送
git push origin main
```

### 发现问题后
```bash
# 1. 立即修复
# 2. 本地验证
git add .
git commit -m "fix: 修复描述"

# 3. 确认修复有效
# 4. 推送修复
git push origin main
```

## Next.js Image 配置说明

### domains (简单配置)
```javascript
domains: ['example.com', 'cdn.example.com']
```
- 适用于简单的域名白名单
- 不支持端口和路径配置

### remotePatterns (高级配置)
```javascript
remotePatterns: [
  {
    protocol: 'https',
    hostname: 'example.com',
    port: '',           // 可选
    pathname: '/images/**',  // 可选
  }
]
```
- 支持更精细的控制
- 可以限制协议、端口、路径

### 最佳实践
1. 同时配置 `domains` 和 `remotePatterns`
2. 只添加信任的域名
3. 使用 HTTPS 协议
4. 定期审查配置

## 相关文档
- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [next/image Configuration](https://nextjs.org/docs/app/api-reference/components/image#remotepatterns)

---

**修复时间**：2026-01-27
**状态**：✅ 已修复
**影响范围**：任务提交页面 logo 显示
