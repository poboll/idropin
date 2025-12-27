# GitHub仓库设置指南

## 📋 概述

本指南将帮助你创建GitHub仓库并推送Idrop.in项目代码。

## 🚀 第一步：创建GitHub仓库

### 1. 访问GitHub

打开浏览器，访问：https://github.com/new

### 2. 创建后端仓库

**仓库名称**: `idropin-backend`
**描述**: Idrop.in - 云集 | 智能文件收集与管理平台后端服务
**可见性**: Private（私有）或 Public（公开）
**不要勾选**:
- ❌ Add a README file
- ❌ Add .gitignore
- ❌ Choose a license

点击 **Create repository** 按钮。

### 3. 创建前端仓库

返回 https://github.com/new，创建第二个仓库：

**仓库名称**: `idropin-frontend`
**描述**: Idrop.in - 云集 | 智能文件收集与管理平台前端应用
**可见性**: Private（私有）或 Public（公开）
**不要勾选**:
- ❌ Add a README file
- ❌ Add .gitignore
- ❌ Choose a license

点击 **Create repository** 按钮。

### 4. 创建主项目仓库（可选）

如果你想将整个项目作为一个仓库管理，可以创建第三个仓库：

**仓库名称**: `idropin` 或 `idropin-docs`
**描述**: Idrop.in - 云集 | 智能文件收集与管理平台项目文档
**可见性**: Public（公开）
**不要勾选**:
- ❌ Add a README file
- ❌ Add .gitignore
- ❌ Choose a license

点击 **Create repository** 按钮。

## 📤 第二步：推送代码到GitHub

### 推送后端代码

```bash
# 进入后端目录
cd /Users/Apple/Developer/art/idrop-in/idropin-backend

# 添加远程仓库（替换YOUR_USERNAME为你的GitHub用户名）
git remote add origin https://github.com/YOUR_USERNAME/idropin-backend.git

# 推送代码到GitHub
git push -u origin main
```

如果遇到认证问题，可以使用SSH：

```bash
# 添加SSH远程仓库
git remote set-url origin git@github.com:YOUR_USERNAME/idropin-backend.git

# 推送代码
git push -u origin main
```

### 推送前端代码

```bash
# 进入前端目录
cd /Users/Apple/Developer/art/idrop-in/idropin-frontend

# 添加远程仓库（替换YOUR_USERNAME为你的GitHub用户名）
git remote add origin https://github.com/YOUR_USERNAME/idropin-frontend.git

# 推送代码到GitHub
git push -u origin main
```

### 推送主项目代码（可选）

```bash
# 返回项目根目录
cd /Users/Apple/Developer/art/idrop-in

# 初始化Git（如果还没有初始化）
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: Idrop.in - 云集 项目文档"

# 添加远程仓库（替换YOUR_USERNAME为你的GitHub用户名）
git remote add origin https://github.com/YOUR_USERNAME/idropin.git

# 推送代码
git push -u origin main
```

## 🔧 第三步：配置GitHub仓库

### 1. 设置仓库描述和标签

在每个仓库的 **Settings** 页面中：

- **Description**: 添加详细的项目描述
- **Topics**: 添加相关标签
  - `java`
  - `spring-boot`
  - `postgresql`
  - `nextjs`
  - `typescript`
  - `tailwindcss`
  - `file-management`

### 2. 设置仓库可见性

根据你的需求选择：
- **Private**: 仅你和协作者可以访问
- **Public**: 所有人可以查看和克隆

### 3. 添加License（推荐）

在每个仓库的 **Settings** 页面中，点击 **Add file**，创建 `LICENSE` 文件：

```text
MIT License

Copyright (c) 2024 Idrop.in Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.
```

### 4. 添加README.md（如果还没有）

每个仓库应该有一个 `README.md` 文件。

**后端仓库** (`idropin-backend/README.md`):
- ✅ 已创建

**前端仓库** (`idropin-frontend/README.md`):
- ✅ 已创建

## 🔄 第四步：设置分支保护（可选）

对于重要的仓库，可以设置分支保护：

1. 进入仓库的 **Settings** → **Branches**
2. 点击 **Add rule**
3. 设置以下规则：
   - **Branch name pattern**: `main`
   - ✅ **Require a pull request before merging**
   - ✅ **Require approvals**
   - ✅ **Require status checks to pass before merging**

## 🤖 第五步：设置GitHub Pages（可选）

如果你想托管项目文档：

1. 进入仓库的 **Settings** → **Pages**
2. **Source**: 选择 `Deploy from a branch`
3. **Branch**: 选择 `main` 和 `/ (root)`
4. 点击 **Save**

GitHub会自动构建并发布你的文档。

## 🔐 第六步：配置SSH密钥（推荐）

为了避免每次推送都输入密码，建议配置SSH密钥：

### 生成SSH密钥

```bash
# 生成SSH密钥
ssh-keygen -t ed25519 -C "your_email@example.com"

# 查看公钥
cat ~/.ssh/id_ed25519.pub
```

### 添加SSH密钥到GitHub

1. 复制公钥内容
2. 访问 https://github.com/settings/keys
3. 点击 **New SSH key**
4. 粘贴公钥内容
5. 点击 **Add SSH key**

### 测试SSH连接

```bash
ssh -T git@github.com
```

如果看到 `Hi YOUR_USERNAME! You've successfully authenticated...`，说明配置成功。

## 📊 第七步：查看仓库统计

推送成功后，你可以在GitHub上查看：

- **Commits**: 提交历史
- **Branches**: 分支列表
- **Releases**: 发布版本
- **Contributors**: 贡献者统计
- **Insights**: 代码统计

## 🚀 快速命令参考

### 后端推送命令

```bash
cd /Users/Apple/Developer/art/idrop-in/idropin-backend
git remote add origin https://github.com/YOUR_USERNAME/idropin-backend.git
git push -u origin main
```

### 前端推送命令

```bash
cd /Users/Apple/Developer/art/idrop-in/idropin-frontend
git remote add origin https://github.com/YOUR_USERNAME/idropin-frontend.git
git push -u origin main
```

### SSH推送命令

```bash
# 后端
cd /Users/Apple/Developer/art/idrop-in/idropin-backend
git remote set-url origin git@github.com:YOUR_USERNAME/idropin-backend.git
git push -u origin main

# 前端
cd /Users/Apple/Developer/art/idrop-in/idropin-frontend
git remote set-url origin git@github.com:YOUR_USERNAME/idropin-frontend.git
git push -u origin main
```

## 📝 常见问题

### Q1: 推送时提示 "Permission denied"

**A**: 检查：
1. GitHub用户名是否正确
2. 是否有仓库的访问权限
3. 是否使用了正确的认证方式（HTTPS或SSH）

### Q2: 推送时提示 "Updates were rejected"

**A**: 这通常是因为远程仓库有新的提交。解决方法：

```bash
# 拉取远程更新
git pull origin main --rebase

# 再次推送
git push -u origin main
```

### Q3: 如何删除远程仓库

**A**:
1. 进入仓库的 **Settings**
2. 滚动到底部
3. 点击 **Delete this repository**
4. 输入仓库名称确认删除

### Q4: 如何重命名远程仓库

**A**:
1. 进入仓库的 **Settings**
2. 在 **Repository name** 字段中输入新名称
3. 点击 **Rename**

## ✅ 完成检查清单

完成以下步骤后，你的GitHub仓库就设置好了：

- [ ] 创建了 `idropin-backend` 仓库
- [ ] 创建了 `idropin-frontend` 仓库
- [ ] 推送了后端代码到GitHub
- [ ] 推送了前端代码到GitHub
- [ ] 设置了仓库描述和标签
- [ ] 添加了LICENSE文件
- [ ] 配置了SSH密钥（可选）

## 🎯 下一步

仓库设置完成后，你可以：

1. **开始开发**: 按照 [`Idrop.in-云集-详细实施计划.md`](Idrop.in-云集-详细实施计划.md) 开始开发
2. **配置CI/CD**: 设置GitHub Actions自动构建和部署
3. **邀请协作者**: 如果需要团队协作，可以邀请其他人
4. **设置Issues**: 启用Issues进行问题跟踪
5. **设置Projects**: 使用GitHub Projects进行项目管理

## 📚 相关文档

- [项目结构文档](项目结构文档.md)
- [毕业设计改造计划](毕业设计改造计划.md)
- [技术栈对比分析](技术栈对比分析.md)
- [Idrop.in-云集-详细实施计划](Idrop.in-云集-详细实施计划.md)

---

**祝你设置顺利！** 🚀
