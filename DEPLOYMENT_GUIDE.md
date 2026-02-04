# Learning Coach - 部署指南

## 服务状态

| 服务 | 地址 | 状态 |
|------|------|------|
| 前端 | http://localhost:5176 | ✅ 运行中 |
| 后端 | http://localhost:8000 | ✅ 运行中 |

---

## 部署前检查清单

### 1. 环境变量配置 ⚠️ 重要

**后端 `.env` 文件必须更新**：
```bash
# 修改默认 JWT 密钥（生产环境）
JWT_SECRET_KEY=your_secure_random_string_here

# 确保至少配置一个 AI API Key
ZHIPU_API_KEY=your_key_here
```

**生成安全的 JWT 密钥**：
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 2. 数据库

**开发环境**: SQLite（默认）
**生产环境推荐**: PostgreSQL + Supabase

### 3. CORS 配置

生产环境需要更新 `backend/main.py` 中的 CORS 配置：
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-domain.com"],  # 修改为实际域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 部署方案

### 方案 A: Railway + Vercel (推荐)

**优势**: 简单、免费、自动化

**后端部署 (Railway)**:
1. 访问 https://railway.app
2. 点击 "New Project" → "Deploy from GitHub repo"
3. 选择你的 GitHub 仓库
4. 设置环境变量
5. 部署！

**前端部署 (Vercel)**:
1. 访问 https://vercel.com
2. 点击 "New Project" → "Import Git Repository"
3. 选择你的仓库
4. 配置环境变量（如需要）
5. 部署！

**配置前端 API 地址**:
在 Vercel 项目设置中添加环境变量：
```
VITE_API_URL=https://your-backend.railway.app/api
```

---

### 方案 B: Render + Vercel

**后端部署 (Render)**:
1. 创建 `render.yaml` 文件
2. 推送到 GitHub
3. 在 Render 中连接仓库
4. 自动部署

**前端部署 (Vercel)**: 同上

---

### 方案 C: Docker

**构建 Docker 镜像**:
```bash
# 后端
cd backend
docker build -t learning-coach-backend .

# 前端
cd apps/web
docker build -t learning-coach-frontend .
```

---

## 当前项目文件结构

```
learning-coach/
├── apps/
│   └── web/              # 前端 (Vite + React)
├── packages/
│   └── shared/           # 共享包
├── backend/              # 后端 (FastAPI)
├── docs/                 # 文档
├── ROADMAP.md            # 功能规划
├── PRD.md                # 产品需求文档
├── IMPLEMENTATION.md     # 实施总结
├── FLASHCARD_FEATURE.md  # 闪卡功能说明
└── DEPLOYMENT_GUIDE.md   # 部署指南
```

---

## 快速部署命令

### 推送代码到 GitHub

```bash
git add .
git commit -m "Add flashcard review system and prepare for deployment"
git push origin main
```

### Railway 部署后端

1. 连接 GitHub 仓库到 Railway
2. 自动检测并部署
3. 配置环境变量

### Vercel 部署前端

1. 导入 GitHub 仓库
2. 自动检测 Vite 项目
3. 自动部署

---

## 部署后验证

```bash
# 检查后端健康
curl https://your-backend.railway.app/api/health

# 检查前端
curl https://your-frontend.vercel.app
```

---

## 成本估算

| 平台 | 免费额度 | 预计月成本 |
|------|----------|-----------|
| Railway | $5 免费额度 | ~$5 超出后 |
| Vercel | 免费额度 | ~$20 超出后 |
| Supabase | 500MB 数据库 | $25 (Pro) |
| **总计** | ~$30/月 | **~$55/月** |
