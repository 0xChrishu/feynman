# Supabase + Vercel 部署指南

## 部署架构

```
┌─────────────┐
│   Vercel    │  Frontend (React + Vite)
└──────┬──────┘
       │
       │ API Calls
       ▼
┌─────────────┐
│  Supabase  │  Database (PostgreSQL)
│  + Railway  │  Backend API (FastAPI)
└─────────────┘
```

---

## 第一步：配置 Supabase

### 1. 注册 Supabase 账号

1. 访问 https://supabase.com
2. 点击 "Start your project"
3. 使用 GitHub 登录
4. 创建新项目（命名为 `learning-coach`）
5. 选择区域：Southeast Asia (Singapore) 以获得更低延迟

### 2. 获取数据库连接信息

项目创建后，进入：
- **Settings** → **Database**
- 复制以下信息：
  - Connection String (URI)
  - Project URL
  - anon/public key

### 3. 在 Supabase SQL Editor 中创建表

点击 **SQL Editor** → **New Query**，粘贴以下 SQL：

```sql
-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建学习会话表
CREATE TABLE IF NOT EXISTS learning_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL,
    original_content TEXT,
    question TEXT,
    user_answer TEXT,
    feedback TEXT,
    score FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建用户统计表
CREATE TABLE IF NOT EXISTS user_statistics (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_sessions INTEGER DEFAULT 0,
    avg_score FLOAT,
    best_score FLOAT,
    total_flashcards INTEGER DEFAULT 0,
    cards_due_today INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建闪卡表
CREATE TABLE IF NOT EXISTS flashcards (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id TEXT REFERENCES learning_sessions(id) ON DELETE CASCADE,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    ease_factor FLOAT DEFAULT 2.5,
    interval INTEGER DEFAULT 0,
    repetitions INTEGER DEFAULT 0,
    next_review_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建闪卡复习记录表
CREATE TABLE IF NOT EXISTS flashcard_reviews (
    id TEXT PRIMARY KEY,
    card_id TEXT NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
    quality INTEGER NOT NULL CHECK (quality >= 0 AND quality <= 5),
    time_spent INTEGER DEFAULT 0,
    reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_learning_sessions_user_id ON learning_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_created_at ON learning_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_next_review ON flashcards(next_review_date);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_card_id ON flashcard_reviews(card_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_reviewed_at ON flashcard_reviews(reviewed_at);

-- 为已注册用户创建统计记录
INSERT INTO user_statistics (user_id, total_sessions, avg_score, best_score)
SELECT id, 0, 0, 0
FROM users
WHERE NOT EXISTS (SELECT 1 FROM user_statistics WHERE user_id = users.id);
```

---

## 第二步：部署后端到 Railway

### 方式 A：通过 GitHub 自动部署（推荐）

1. **推送代码到 GitHub**
```bash
git add .
git commit -m "Prepare for Supabase deployment"
git push origin main
```

2. **连接 Railway 到 GitHub**
   - 访问 https://railway.app
   - 点击 "New Project" → "Deploy from GitHub repo"
   - 选择你的仓库
   - Railway 自动检测 Python 项目

3. **配置环境变量**
   在 Railway 项目设置中添加：
   ```
   DATABASE_URL=postgresql://user:pass@host.railway.app/dbname
   JWT_SECRET_KEY=your_secure_random_string
   ZHIPU_API_KEY=your_zhipu_key
   DEEPSEEK_API_KEY=your_deepseek_key
   ```

### 方式 B：手动部署

1. 创建 `railway.json`：
```json
{
  "$schema": "https://railway.app/manifest/v1#",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "python main.py",
    "healthcheckPath": "/api/health"
  }
}
```

2. 将文件放在 `backend/` 目录

---

## 第三步：部署前端到 Vercel

### 1. 安装 Vercel CLI

```bash
npm install -g vercel
```

### 2. 登录 Vercel

```bash
vercel login
```

### 3. 部署项目

```bash
cd apps/web
vercel
```

按照提示操作：
- Set up and deploy
- Project name: `learning-coach`
- Import your framework: Vite
- Root directory: `./`

### 4. 配置环境变量

在 Vercel 项目设置中添加：
```
VITE_API_URL=https://your-backend.railway.app/api
```

---

## 第四步：更新 CORS 配置

修改 `backend/main.py` 中的 CORS 配置：

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5176",
        "https://your-frontend.vercel.app"  # 替换为实际域名
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 第五步：验证部署

### 检查后端

```bash
curl https://your-backend.railway.app/api/health
```

### 检查前端

访问 https://your-frontend.vercel.app

### 测试闪卡功能

1. 注册/登录
2. 完成学习
3. 保存为闪卡
4. 测试复习功能

---

## 环境变量配置总结

### Supabase

| 变量名 | 值 |
|--------|-----|
| Project URL | 从 Supabase 控制台获取 |
| Database URL | 从 Supabase 控制台获取 |
| anon key | 从 Supabase 控制台获取 |

### Railway (后端)

| 变量名 | 说明 |
|--------|------|
| DATABASE_URL | Supabase 连接字符串 |
| JWT_SECRET_KEY | 随机字符串（必须修改） |
| ZHIPU_API_KEY | 智谱 API Key |
| DEEPSEEK_API_KEY | DeepSeek API Key |

### Vercel (前端)

| 变量名 | 值 |
|--------|-----|
| VITE_API_URL | Railway 后端 URL |

---

## 故障排查

### 后端 API 错误

1. 检查 Railway 日志
2. 验证环境变量配置
3. 检查 Supabase 连接

### 前端 CORS 错误

1. 确认后端 CORS 配置包含前端域名
2. 检查 API_URL 环境变量

### 数据库连接失败

1. 验证 Supabase 连接字符串
2. 检查 Supabase 项目状态
3. 确认表结构正确

---

## 域名配置（可选）

### 购买域名

建议平台：
- Namecheap
- GoDaddy
- Cloudflare（免费）

### DNS 配置

| 类型 | 名称 | 值 |
|------|------|-----|
| A | @ | Vercel 的 IP |
| CNAME | www | 你的 Vercel 域名 |
| CNAME | api | Railway 的域名 |

---

## 成本估算

| 服务 | 免费额度 | 月度成本 |
|------|----------|----------|
| Vercel (Hobby) | 100GB/月 | $0 (超限后 $20/100GB) |
| Railway | $5/月 | ~$5-20 |
| Supabase | 500MB 数据库 | $25 (Pro) 或 免费版 500MB |
| **总计** | - | **~$30-50/月** |
