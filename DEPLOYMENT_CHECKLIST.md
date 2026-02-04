# 部署前检查清单

## ✅ 已完成

### 1. 代码准备
- [x] 所有代码已提交到 Git
- [x] Monorepo 结构配置完成
- [x] 共享包已配置
- [x] API 版本控制实现

### 2. 功能实现
- [x] 费曼学习法核心功能
- [x] 智能闪卡复习系统
- [x] PWA 离线支持
- [x] 多 AI 模型支持
- [x] 用户认证和统计

### 3. 部署配置
- [x] Railway 配置文件 (`railway.json`)
- [x] Vercel 配置文件 (`vercel.json`)
- [x] Supabase 部署指南
- [x] 环境变量文档

---

## 📋 部署步骤

### Step 1: 创建 Supabase 项目

1. 访问 https://supabase.com
2. 使用 GitHub 登录
3. 创建新项目 `learning-coach`
4. 选择 Southeast Asia (Singapore) 区域
5. 在 SQL Editor 中运行数据库创建脚本

### Step 2: 推送代码到 GitHub

```bash
cd "/Users/owen/Desktop/workshop/ClaudeCode/coding program/learning-coach"
git add .
git commit -m "Ready for Supabase + Vercel deployment

- Flashcard review system with SuperMemo SM-2
- Monorepo structure with shared package
- PWA offline support
- Multi AI model support
- API versioning and rate limiting

Features:
- Smart flashcard review system
- User authentication and statistics
- Learning history tracking
- Multiple AI providers (DeepSeek, Zhipu AI)"
git push origin main
```

### Step 3: 部署后端到 Railway

1. 访问 https://railway.app
2. 点击 "New Project"
3. 选择 "Deploy from GitHub repo"
4. 选择你的 `learning-coach` 仓库
5. Railway 会自动检测 Python 项目

### Step 4: 配置 Railway 环境变量

在 Railway 项目设置中添加：

| 变量名 | 值 |
|--------|-----|
| DATABASE_URL | 从 Supabase 获取的连接字符串 |
| JWT_SECRET_KEY | 使用生成的安全密钥 |
| ZHIPU_API_KEY | 你的智谱 API Key |
| DEEPSEEK_API_KEY | 你的 DeepSeek API Key |

**生成 JWT 密钥**：
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Step 5: 部署前端到 Vercel

```bash
cd "/Users/owen/Desktop/workshop/ClaudeCode/coding program/learning-coach/apps/web"
vercel
```

按照提示操作：
1. 设置项目名称
2. 选择 Vite 框架
3. 配置环境变量：
   ```
   VITE_API_URL=https://your-backend.railway.app/api
   ```

### Step 6: 更新后端 CORS 配置

修改 `backend/main.py` 中的 CORS 配置，添加你的 Vercel 域名。

---

## 🔍 部署后验证

### API 健康检查

```bash
curl https://your-backend.railway.app/api/health
```

### 前端访问

访问你的 Vercel 域名

### 功能测试清单

1. [ ] 注册/登录账号
2. [ ] 完成一次学习（输入文本 → 回答问题）
3. [ ] 查看学习历史
4. [ ] 保存为闪卡
5. [ ] 进入闪卡复习页面
6. [ ] 测试复习功能（翻转、评分）
7. [ ] 查看统计数据

---

## 📝 部署后 URL

| 服务 | URL |
|------|-----|
| 前端 | https://your-frontend.vercel.app |
| 后端 | https://learning-coach-production.up.railway.app |
| API 文档 | https://learning-coach-production.up.railway.app/docs |

---

## 🚀 开始部署！

准备好了吗？运行以下命令开始：

```bash
cd "/Users/owen/Desktop/workshop/ClaudeCode/coding program/learning-coach"
git add .
git commit -m "Ready for Supabase + Vercel deployment"
git push origin main
```

然后：
1. 按照 [Supabase + Vercel 部署指南](SUPABASE_VERCEL_DEPLOY.md) 操作
2. 等待自动部署完成
3. 测试线上功能

有任何问题随时告诉我！
