# Vercel + Supabase 部署指南

## 为什么选择这个组合？

| 组件 | 作用 | 优点 |
|------|------|------|
| **Vercel** | 前端托管 | 全球 CDN、自动 HTTPS、零配置 |
| **Supabase** | 后端服务 | PostgreSQL、认证、实时、存储 |
| **Supabase Edge Functions** | API 服务 | 无服务器、全球分布式 |

## 架构

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Vercel    │ ───────▶│  Supabase   │◀────────│   用户      │
│  (前端)     │         │  (数据库+API)│         │             │
│             │         │             │         │             │
└─────────────┘         └─────────────┘         └─────────────┘
      ↓                       ↓
  全球 CDN              PostgreSQL
                      + Auth
                      + Storage
```

## 1. 创建 Supabase 项目

### 1.1 注册 Supabase
访问 [supabase.com](https://supabase.com/) 并注册

### 1.2 创建新项目
1. 点击 **New Project**
2. 选择组织
3. 填写项目信息：
   - Name: `learning-coach`
   - Database Password: (生成并保存)
   - Region: 选择离你最近的区域

### 1.3 获取项目凭证

进入项目 → **Settings** → **API**，保存以下信息：

```
Project URL: https://xxxxx.supabase.co
anon/public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 2. 配置数据库

### 2.1 创建数据表

进入 Supabase → **Table Editor** → **New Table**，创建以下表：

#### users 表
| 列名 | 类型 | 说明 |
|------|------|------|
| id | text (PK) | UUID |
| email | text (unique) | 邮箱 |
| password_hash | text | 密码哈希 |
| display_name | text | 显示名称 |
| created_at | timestamp | 创建时间 |

#### learning_sessions 表
| 列名 | 类型 | 说明 |
|------|------|------|
| id | text (PK) | UUID |
| user_id | text (FK) | 用户 ID |
| content_type | text | 'text' 或 'url' |
| original_content | text | 原始内容 |
| question | text | AI 问题 |
| user_answer | text | 用户回答 |
| feedback | text | AI 反馈 |
| score | number | 评分 0-100 |
| created_at | timestamp | 创建时间 |

#### user_statistics 表
| 列名 | 类型 | 说明 |
|------|------|------|
| user_id | text (PK/FK) | 用户 ID |
| total_sessions | integer | 总学习次数 |
| avg_score | number | 平均分 |
| best_score | number | 最高分 |
| updated_at | timestamp | 更新时间 |

### 2.2 使用 SQL 创建表

进入 Supabase → **SQL Editor**，执行：

```sql
-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建用户表
CREATE TABLE users (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建学习会话表
CREATE TABLE learning_sessions (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_type TEXT CHECK (content_type IN ('text', 'url')),
    original_content TEXT,
    question TEXT,
    user_answer TEXT,
    feedback TEXT,
    score NUMERIC CHECK (score >= 0 AND score <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建用户统计表
CREATE TABLE user_statistics (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_sessions INTEGER DEFAULT 0,
    avg_score NUMERIC,
    best_score NUMERIC,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_sessions_user_id ON learning_sessions(user_id);
CREATE INDEX idx_sessions_created_at ON learning_sessions(created_at DESC);
```

## 3. 配置 Row Level Security (RLS)

### 3.1 启用 RLS

进入 **Authentication** → **Policies**，对每个表启用 RLS：

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_statistics ENABLE ROW LEVEL SECURITY;
```

### 3.2 创建 RLS 策略

```sql
-- 用户只能访问自己的数据
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id);

CREATE POLICY "Users can view own sessions" ON learning_sessions
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own sessions" ON learning_sessions
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can view own statistics" ON user_statistics
    FOR SELECT USING (auth.uid()::text = user_id);
```

## 4. 创建 Supabase Edge Functions

### 4.1 安装 Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Linux
curl -fsSL https://supabase.com/install/v2 | bash

# Windows
iwr https://supabase.com/install/v2.ps1 | iex
```

### 4.2 初始化 Supabase 项目

```bash
cd /Users/owen/Desktop/workshop/ClaudeCode/coding\ program/learning-coach
supabase init
```

### 4.3 创建 Edge Function

创建 `supabase/functions/generate-question/index.ts`：

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const { type, content } = await req.json()

  // 调用 LLM API
  const llmResponse = await fetch(
    "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get('LLM_API_KEY')}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen-plus",
        messages: [{
          role: "system",
          content: "你是一个'费曼教练'..."
        }, {
          role: "user",
          content: content
        }]
      })
    }
  )

  const data = await llmResponse.json()
  return new Response(JSON.stringify({
    question: data.choices[0].message.content
  }))
})
```

创建 `supabase/functions/evaluate-answer/index.ts`：

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { original_content, user_answer } = await req.json()

  const llmResponse = await fetch(
    "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get('LLM_API_KEY')}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen-plus",
        messages: [{
          role: "system",
          content: "你是一个'费曼教练'。请对比用户的解释与原文..."
        }, {
          role: "user",
          content: `Original: ${original_content}\nAnswer: ${user_answer}`
        }],
        response_format: { type: "json_object" }
      })
    }
  )

  const data = await llmResponse.json()
  return new Response(data.choices[0].message.content)
})
```

### 4.4 部署 Edge Functions

```bash
# 登录 Supabase
supabase login

# 链接到你的项目
supabase link --project-ref YOUR_PROJECT_REF

# 部署函数
supabase functions deploy generate-question
supabase functions deploy evaluate-answer

# 设置环境变量
supabase secrets set LLM_API_KEY=your_api_key_here
```

## 5. 配置前端

### 5.1 安装 Supabase 客户端

```bash
cd frontend
npm install @supabase/supabase-js
```

### 5.2 创建 Supabase 客户端

创建 `frontend/src/lib/supabase.js`：

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 5.3 更新 API 调用

修改 `frontend/src/api.js`，使用 Supabase：

```javascript
import { supabase } from './lib/supabase'

// 生成问题
export const generateQuestion = async (content, type = 'text') => {
  const { data, error } = await supabase.functions.invoke('generate-question', {
    body: { type, content }
  })
  if (error) throw error
  return data
}

// 评估回答
export const evaluateAnswer = async (originalContent, answerText) => {
  const { data, error } = await supabase.functions.invoke('evaluate-answer', {
    body: { original_content: originalContent, user_answer: answerText }
  })
  if (error) throw error
  return data
}

// 保存学习会话
export const saveSession = async (sessionData) => {
  const { data, error } = await supabase
    .from('learning_sessions')
    .insert(sessionData)
    .select()
  if (error) throw error
  return data
}

// 获取学习历史
export const getSessions = async (page = 1, limit = 10) => {
  const { data, error } = await supabase
    .from('learning_sessions')
    .select('*')
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)
  if (error) throw error
  return data
}

// 获取统计数据
export const getStatistics = async () => {
  const { data, error } = await supabase
    .from('user_statistics')
    .select('*')
    .single()
  if (error) throw error
  return data
}
```

## 6. 使用 Supabase Auth

### 6.1 启用 Email Auth

进入 Supabase → **Authentication** → **Providers**，启用 **Email** provider。

### 6.2 登录/注册实现

```javascript
// 注册
const signUp = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  return data
}

// 登录
const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return data
}

// 登出
const signOut = async () => {
  await supabase.auth.signOut()
}

// 获取当前用户
const getUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
```

## 7. 部署到 Vercel

### 7.1 配置环境变量

在 Vercel → **Settings** → **Environment Variables** 添加：

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 7.2 构建配置

在根目录创建 `vercel.json`：

```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 7.3 部署

1. 在 Vercel 导入你的 GitHub 仓库
2. Vercel 会自动检测配置
3. 点击 **Deploy**

## 8. 成本对比

| 服务 | 免费额度 | 付费价格 |
|------|----------|----------|
| **Vercel** | 100GB 带宽/月 | $20/月起 |
| **Supabase 数据库** | 500MB 存储 + 50万行/月 | $25/月起 |
| **Supabase Auth** | 5万 MAU | $0.01/MAU |
| **Supabase Functions** | 50万次调用/月 | $2/百万次 |

**总计：**
- 免费额度：$0
- 付费后：约 $50-100/月

## 9. 项目结构

```
learning-coach/
├── supabase/
│   ├── functions/
│   │   ├── generate-question/
│   │   │   └── index.ts
│   │   └── evaluate-answer/
│   │       └── index.ts
│   └── config.toml
├── frontend/
│   ├── src/
│   │   ├── lib/
│   │   │   └── supabase.js
│   │   └── api.js
│   └── .env.production
└── vercel.json
```

## 10. 优势总结

| 特性 | Vercel + Supabase |
|------|-------------------|
| **开发速度** | ⚡⚡⚡⚡⚡ 零配置，开箱即用 |
| **扩展性** | ⚡⚡⚡⚡ 自动扩展 |
| **学习成本** | ⚡⚡⚡⚡ 文档完善 |
| **免费额度** | ⚡⚡⚡⚡⚡ 非常慷慨 |
| **国内访问** | ⚡⚡⚡ 中等速度 |
| **数据控制** | ⚡⚡⚡⚡ 完全控制 |

需要我指导你完成部署吗？
