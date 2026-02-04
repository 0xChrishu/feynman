# Learning Coach - 功能升级与多平台部署计划

## 项目现状

**Learning Coach** 是一个基于费曼学习法的 AI 学习辅导应用，通过苏格拉底式提问帮助用户深入理解学习内容。

**当前技术栈：**
- 前端：React 19 + Vite + Tailwind CSS + React Router
- 后端：FastAPI + SQLAlchemy + SQLite
- AI 集成：OpenAI 兼容接口（支持 DeepSeek、智谱 AI、Groq 等多个免费 LLM）

**已有功能：**
- 文本/URL 输入 → AI 生成苏格拉底式问题
- 用户回答 → AI 评估打分反馈
- 用户认证（JWT）
- 学习历史记录
- 学习统计概览

---

## 一、功能升级计划（按优先级）

### 🔴 高优先级（核心体验升级）

#### 1. 智能学习路径系统
**功能描述：** 基于用户历史表现，AI 生成个性化学习路径

**实现要点：**
- 新增数据模型：`LearningPath`、`LearningGoal`、`Milestone`
- AI 推荐算法：分析用户薄弱点，推荐学习内容
- 进度跟踪：可视化学习进度和里程碑

**关键文件：**
- `backend/models.py` - 新增学习路径相关模型
- `backend/main.py` - 新增 `/api/learning-path/*` 端点
- `frontend/src/pages/LearningPath.jsx` - 学习路径页面

---

#### 2. 多模态输入增强
**功能描述：** 支持图片、PDF、音频输入

**实现要点：**
- PDF 解析：PyPDF2/pdfplumber
- 图片 OCR：Tesseract 或云端 API（SiliconFlow OCR）
- 语音转文字：Whisper API（Groq 提供免费版本）

**关键文件：**
- `backend/main.py` - 扩展 `generate-question` 端点支持文件上传
- `frontend/src/pages/Home.jsx` - 添加文件上传组件

---

#### 3. PWA 离线支持
**功能描述：** 离线缓存学习内容，支持无网络使用

**实现要点：**
- Vite PWA 插件配置
- Service Worker 缓存策略
- IndexedDB 本地存储
- 离线队列同步

**关键文件：**
- `frontend/vite.config.js` - 添加 VitePWA 插件
- `public/sw.js` - Service Worker 配置
- `frontend/src/utils/offlineQueue.js` - 离线同步队列

---

#### 4. 语音交互
**功能描述：** 语音提问 + 语音回答

**实现要点：**
- 前端：Web Speech API（免费）
- 后端：Whisper API 备选方案
- TTS 文字转语音反馈

**关键文件：**
- `frontend/src/hooks/useSpeechRecognition.js` - 语音识别 Hook
- `frontend/src/pages/Answer.jsx` - 添加语音输入按钮

---

### 🟡 中优先级（增强粘性）

#### 5. 社交学习功能
- 学习圈子、分享成果、问答社区
- WebSocket 实时通信

#### 6. 学习成就系统
- 徽章、排行榜、连续学习天数
- 游戏化元素

#### 7. 智能复习提醒
- 基于艾宾浩斯遗忘曲线
- 间隔重复算法（SuperMemo SM-2）

#### 8. 学习分析报告
- 周报、月报
- 可视化图表（使用已有的 recharts）

---

## 二、多平台技术选型

### 桌面端：Tauri 2.0

**选择理由：**
- 高代码复用（95%+ 前端代码）
- 体积小（~3MB vs Electron ~100MB）
- Rust 后端，安全性高
- 支持 Windows/macOS/Linux

**实现要点：**
1. 创建 Tauri 项目，集成现有前端
2. 使用 Tauri API 实现原生功能：
   - 系统通知
   - 本地文件读写
   - 系统托盘
   - 自动更新

**目录结构：**
```
learning-coach/
├── apps/
│   ├── web/           # 现有 Web 前端
│   └── desktop/       # Tauri 桌面应用
│       ├── src-tauri/ # Rust 后端
│       └── src/       # 复用 web 前端代码
└── backend/
```

**工作量：2-3 周**

---

### 移动端：React Native + Expo

**选择理由：**
- React 技术栈，学习成本低
- 可复用 60-70% 业务逻辑
- Expo 工具链完善
- 支持热更新

**技术栈：**
```
Framework: Expo 52
UI: React Native Paper
Navigation: React Navigation
State: Zustand
```

**实现要点：**
1. 抽离业务逻辑到 shared 包
2. 使用 React Native 重写 UI 组件
3. 集成推送通知
4. 生物识别认证

**工作量：6-8 周**

---

### 微信小程序：Taro 4.x + React

**选择理由：**
- React 语法，开发体验一致
- 一套代码多端运行（微信/支付宝/抖音）
- 可复用 50-60% 业务逻辑

**实现要点：**
1. 使用 Taro CLI 初始化项目
2. 复用 shared 包中的业务逻辑
3. 使用 Taro UI 组件重写界面
4. 集成微信登录和支付

**关键适配：**
- axios → Taro.request
- localStorage → Taro.setStorage
- 路由 → 小程序页面栈

**工作量：4-6 周**

---

## 三、Monorepo 架构设计

**推荐工具：pnpm workspace**

```
learning-coach/
├── apps/
│   ├── web/              # Web 应用 (Vite)
│   ├── mobile/           # React Native (Expo)
│   ├── desktop/          # Tauri
│   └── miniapp/          # Taro 小程序
├── packages/
│   ├── shared/           # 共享业务逻辑
│   │   ├── api/          # API 客户端
│   │   ├── hooks/        # 自定义 Hooks
│   │   ├── types/        # TypeScript 类型
│   │   ├── utils/        # 工具函数
│   │   └── constants/    # 常量
│   ├── ui/               # 共享 UI 组件（可选）
│   └── config/           # 共享配置
├── backend/              # FastAPI 后端
├── pnpm-workspace.yaml
└── package.json
```

**pnpm-workspace.yaml：**
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

---

## 四、架构优化建议

### 4.1 数据库升级

**从 SQLite 迁移到 PostgreSQL + Supabase**

**优势：**
- 免费额度慷慨（500MB 数据库）
- 实时功能支持
- 内置认证系统
- 全球 CDN

**迁移步骤：**
1. 调整数据模型（SQLite → PostgreSQL）
2. 修改 `database.py` 连接字符串
3. 编写数据迁移脚本

---

### 4.2 API 架构升级

**版本控制：**
```python
@app.post("/api/v1/generate-question")
@app.post("/api/v2/generate-question")  # 新版本
```

**速率限制：**
```python
from slowapi import Limiter
limiter = Limiter(key_func=get_remote_address)

@app.post("/api/generate-question")
@limiter.limit("10/minute")
async def generate_question(...):
    ...
```

**缓存层（Redis）：**
```python
import redis
cache = redis.Redis(host='localhost', port=6376)

# 缓存相同内容的问题
cache_key = f"question:{hash(content)}"
if cached := cache.get(cache_key):
    return {"question": cached}
```

---

### 4.3 前端架构优化

**状态管理：引入 Zustand**

```typescript
// store/authStore.ts
import create from 'zustand'

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  login: (user, token) => set({ user, token }),
  logout: () => set({ user: null, token: null })
}))
```

**路由懒加载：**
```javascript
const Dashboard = lazy(() => import('./pages/Dashboard'))

<Route path="/dashboard" element={
  <Suspense fallback={<Loading />}>
    <Dashboard />
  </Suspense>
} />
```

---

## 五、实施路线图

### 📅 第一阶段：基础架构优化（4-6 周）

1. 数据库迁移到 PostgreSQL
2. 实现 Monorepo 结构（pnpm workspace）
3. 抽离共享业务逻辑到 shared 包
4. API 添加版本控制和速率限制
5. 添加单元测试（Vitest + pytest）
6. CI/CD 流水线搭建

---

### 📅 第二阶段：核心功能升级（6-8 周）

1. PWA 离线支持（2 周）
2. 多模态输入：PDF/图片 OCR（2 周）
3. 智能学习路径（2 周）
4. 语音交互（2 周）

---

### 📅 第三阶段：桌面端开发（2-3 周）

1. Tauri 项目初始化
2. 集成现有前端代码
3. 原生功能实现（通知、文件拖拽、自动更新）
4. 打包和签名

---

### 📅 第四阶段：移动端开发（6-8 周）

1. Expo 项目初始化
2. 共享业务逻辑适配
3. UI 组件开发
4. 移动端特有功能（推送、生物识别）
5. App Store/Google Play 提交

---

### 📅 第五阶段：小程序开发（4-6 周）

1. Taro 项目初始化
2. 业务逻辑复用
3. UI 开发和适配
4. 微信特有功能（登录、支付、分享）
5. 小程序审核和发布

---

## 六、关键实施文件

### 代码重构关键文件

| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `frontend/src/api.js` | 抽离到 shared | 多平台复用的核心 |
| `backend/models.py` | 扩展 | 添加学习路径、成就模型 |
| `backend/main.py` | 修改 | API 版本控制、速率限制 |
| `frontend/src/App.jsx` | 修改 | 路由懒加载 |
| `backend/llm_providers.py` | 扩展 | 多模态、语音功能 |

### 新增关键文件

| 文件路径 | 说明 |
|----------|------|
| `packages/shared/api/index.js` | 共享 API 客户端 |
| `packages/shared/hooks/useSpeech.js` | 语音识别 Hook |
| `frontend/vite.config.js` | PWA 配置 |
| `apps/desktop/src-tauri/` | Tauri 桌面应用 |
| `apps/mobile/` | React Native 移动应用 |
| `apps/miniapp/` | Taro 小程序 |

---

## 七、成本效益分析

### 开发成本（单人力）

| 阶段 | 工作量 | 成本估算 |
|------|--------|----------|
| 第一阶段 | 4-6 周 | $6,000-9,000 |
| 第二阶段 | 6-8 周 | $9,000-12,000 |
| 第三阶段 | 2-3 周 | $3,000-4,500 |
| 第四阶段 | 6-8 周 | $9,000-12,000 |
| 第五阶段 | 4-6 周 | $6,000-9,000 |
| **总计** | **22-31 周** | **$36,000-51,500** |

### 月度运营成本

| 项目 | 免费方案 | 付费方案 |
|------|----------|----------|
| 后端托管 | Railway ($5/月) | Railway ($20/月) |
| 数据库 | Supabase 免费 | Pro ($25/月) |
| CDN | Vercel 免费 | Pro ($20/月) |
| AI API | DeepSeek 免费 | DeepSeek + Groq |
| **总计** | **~$10/月** | **~$190/月** |

---

## 八、代码复用率目标

| 平台 | UI 复用 | 业务逻辑复用 | 总体复用率 |
|------|---------|-------------|-----------|
| Web | 100% | 100% | 100% |
| Desktop (Tauri) | 95% | 100% | 95%+ |
| Mobile (RN) | 0% | 60-70% | 60-70% |
| 小程序 (Taro) | 0% | 50-60% | 50-60% |
