# Vercel 部署指南

## 为什么选择 Vercel？

- ✅ 全球 CDN 加速
- ✅ 自动 HTTPS
- ✅ 零配置部署
- ✅ 国内访问相对较快
- ✅ GitHub 集成完美

## 架构

```
┌─────────────┐         ┌─────────────┐
│   Vercel    │ ───────▶│  Railway    │
│  (前端)     │         │  (后端)     │
│             │         │             │
└─────────────┘         └─────────────┘
      ↓                       ↓
  全球 CDN              API 服务
```

## 1. 部署后端到 Railway

### 1.1 注册 Railway
访问 [railway.app](https://railway.app/) 并登录

### 1.2 创建新项目
1. 点击 **New Project**
2. 选择 **Deploy from GitHub repo**
3. 选择你的仓库

### 1.3 配置后端

| 配置项 | 值 |
|--------|-----|
| Root Directory | `backend` |
| Start Command | `python main.py` |

### 1.4 添加环境变量

在 Railway → Settings → Variables 中添加：

```
LLM_API_KEY=你的API_Key
LLM_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
LLM_MODEL=qwen-plus
JWT_SECRET_KEY=生成的随机密钥
PORT=8000
```

### 1.5 获取后端 URL

部署完成后，Railway 会提供一个 URL，如：
```
https://your-backend-production.up.railway.app
```

## 2. 部署前端到 Vercel

### 2.1 注册 Vercel
访问 [vercel.com](https://vercel.com/) 并登录

### 2.2 导入项目
1. 点击 **Add New** → **Project**
2. 从 GitHub 导入你的仓库
3. Vercel 会自动检测到 Vite + React 项目

### 2.3 配置项目

| 配置项 | 值 |
|--------|-----|
| Framework Preset | **Vite** |
| Root Directory | `frontend` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

### 2.4 添加环境变量

在 Vercel → Settings → Environment Variables 中添加：

```
VITE_API_URL=https://your-backend-production.up.railway.app/api
```

### 2.5 部署

点击 **Deploy**，等待 1-2 分钟即可完成。

### 2.6 获取域名

Vercel 会提供一个免费域名，如：
```
https://your-project.vercel.app
```

## 3. 配置自定义域名（可选）

### 3.1 在域名服务商添加 DNS

| 类型 | 名称 | 值 |
|------|------|-----|
| CNAME | www | cname.vercel-dns.com |

### 3.2 在 Vercel 添加域名

1. 进入项目 → **Settings** → **Domains**
2. 添加你的域名
3. Vercel 会自动配置 SSL

## 4. 集成 PostHog 分析

### 4.1 注册 PostHog

访问 [posthog.com](https://posthog.com/) 并注册

### 4.2 安装 PostHog

```bash
cd frontend
npm install posthog-js
```

### 4.3 配置 PostHog

创建 `frontend/src/lib/posthog.js`：

```javascript
import posthog from 'posthog-js'

export function initPosthog() {
  posthog.init('your_posthog_key', {
    api_host: 'https://app.posthog.com',
    persistence: 'localStorage',
  })
}

export default posthog
```

### 4.4 在应用中使用

修改 `frontend/src/main.jsx`：

```jsx
import { initPosthog } from './lib/posthog'

initPosthog()

// 页面浏览自动追踪
posthog.capture('$pageview')
```

### 4.5 追踪自定义事件

```jsx
// 追踪按钮点击
const handleClick = () => {
  posthog.capture('learning_started', {
    content_type: 'text',
    content_length: 1000
  })
}

// 追踪学习完成
posthog.capture('learning_completed', {
  score: 85,
  time_spent: 300
})
```

## 5. 成本对比

| 平台 | 免费额度 | 付费价格 |
|------|----------|----------|
| **Vercel** | 100GB 带宽/月 | $20/月起 |
| **Railway** | $5 免费额度 | $5/月起 |
| **PostHog** | 100万事件/月 | 按使用量付费 |

**总计：**
- 免费额度内：$0
- 付费后：约 $25/月

## 6. 更新代码流程

```bash
# 本地修改代码
git add .
git commit -m "update: 新功能"
git push

# Vercel 和 Railway 会自动部署
# 无需手动操作
```

## 7. 监控和调试

### Vercel
- 查看 Deployments 了解部署状态
- 查看 Logs 了解错误信息
- 查看 Analytics 了解访问数据

### Railway
- 查看 Deployments 了解部署状态
- 查看 Logs 了解后端错误
- 查看 Metrics 了解资源使用

### PostHog
- 查看用户行为分析
- 查看转化漏斗
- 设置自定义事件

## 8. 常见问题

### CORS 错误

在 Railway 后端的 CORS 配置中添加 Vercel 域名：

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-project.vercel.app",
        "https://your-custom-domain.com"
    ],
)
```

### 环境变量不生效

部署后需要重新部署才能应用新的环境变量：
- Railway: 手动触发 redeploy
- Vercel: 自动检测环境变量变化并重新部署

## 总结

| 项目 | 平台 | 用途 |
|------|------|------|
| 前端 | Vercel | 静态托管 + CDN |
| 后端 | Railway | API 服务 |
| 分析 | PostHog | 用户行为追踪 |

需要我指导你完成部署吗？
