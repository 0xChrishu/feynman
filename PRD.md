# Learning Coach - 产品需求文档 (PRD)

## 产品概述

**Learning Coach** 是一个基于费曼学习法的 AI 学习辅导应用，通过苏格拉底式提问帮助用户深入理解学习内容，并提供智能复习系统巩固学习效果。

---

## 核心功能（已完成）

### 1. 费曼学习法 AI 教练
- **功能描述**：输入学习内容 → AI 生成苏格拉底式问题 → 用户用大白话解释 → AI 评估打分
- **状态**：✅ 已完成
- **用户价值**：主动学习，而非被动接受信息

### 2. 多 AI 模型支持
- **功能描述**：支持 DeepSeek、智谱 AI、Groq 等免费模型
- **状态**：✅ 已完成
- **用户价值**：降低使用成本，提高可用性

### 3. 学习历史与统计
- **功能描述**：记录学习会话，统计学习次数、平均分、最佳成绩
- **状态**：✅ 已完成
- **用户价值**：可视化学习进度

### 4. PWA 离线支持
- **功能描述**：支持离线使用，可安装为桌面应用
- **状态**：✅ 已完成
- **用户价值**：随时随地学习

### 5. API 版本化
- **功能描述**：支持 v1/v2 API，速率限制
- **状态**：✅ 已完成
- **用户价值**：系统稳定性，为未来扩展做准备

---

## 待开发功能（按优先级）

### P0: 智能闪卡复习系统 🔴 高优先级

**用户痛点**：学了容易忘，复习间隔不合理导致效率低下

**功能描述**：
- 每次学习后自动生成复习闪卡
- 基于艾宾浩斯遗忘曲线智能提醒复习时间
- 间隔重复算法（SuperMemo SM-2）
- 支持快速复习模式（3秒/张）
- 复习统计和进度追踪

**数据模型**：
```python
FlashCard（闪卡）
- id: UUID
- user_id: UUID (外键)
- session_id: UUID (外键 -> LearningSession)
- front: String (问题/提示)
- back: String (答案/核心概念)
- ease_factor: Float (难度系数，默认 2.5)
- interval: Integer (当前间隔天数)
- repetitions: Integer (复习次数)
- next_review_date: DateTime (下次复习日期)
- created_at: DateTime
- updated_at: DateTime

FlashCardReview（复习记录）
- id: UUID
- card_id: UUID (外键)
- quality: Integer (0-5, 用户评分)
- time_spent: Integer (秒)
- reviewed_at: DateTime
```

**SuperMemo SM-2 算法**：
```python
def calculate_next_review(card, quality):
    """
    quality: 0-5
    0: 完全忘记
    1: 错误但有印象
    2: 困难回忆
    3: 勉强回忆
    4: 轻松回忆
    5: 完全掌握
    """
    if quality >= 3:
        if card.repetitions == 0:
            interval = 1
        elif card.repetitions == 1:
            interval = 6
        else:
            interval = card.interval * card.ease_factor
    else:
        interval = 1
        card.repetitions = 0

    card.ease_factor = max(1.3, card.ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))
    card.interval = interval
    card.repetitions += 1
    card.next_review_date = datetime.utcnow() + timedelta(days=int(interval))

    return card
```

**前端页面**：
- `/review` - 今日复习主页
- `/review/:id` - 复习单张卡片
- `/flashcards` - 闪卡管理列表
- `/flashcards/stats` - 复习统计

**API 端点**：
- `GET /api/flashcards/due` - 获取今日待复习卡片
- `POST /api/flashcards/:id/review` - 提交复习结果
- `GET /api/flashcards` - 获取所有闪卡
- `DELETE /api/flashcards/:id` - 删除闪卡
- `GET /api/flashcards/stats` - 复习统计数据

**用户价值**：
- 科学复习，记得更牢
- 碎片化时间利用
- 学习效果可视化

---

### P0: 番茄钟 + 学习时间统计 🔴 高优先级

**用户痛点**：学习时容易分心，不知道自己的学习习惯

**功能描述**：
- 内置番茄钟计时器（25分钟专注+5分钟休息）
- 学习时长统计（今日/本周/本月）
- 学习时段分析（什么时间效率最高）
- 与学习内容关联的专注度分析

**数据模型**：
```python
PomodoroSession（番茄钟会话）
- id: UUID
- user_id: UUID
- session_id: UUID (可选，关联学习会话)
- duration: Integer (实际专注时长，秒)
- planned_duration: Integer (计划时长，默认1500秒)
- completed: Boolean (是否完成)
- interruptions: Integer (被打断次数)
- started_at: DateTime
- completed_at: DateTime
```

**前端功能**：
- 浮动番茄钟组件（可在任何页面使用）
- 学习时间仪表板
- 专注度热力图
- 学习报告

**用户价值**：
- 提高学习专注度
- 了解自己的学习习惯
- 量化学习投入

---

### P1: AI 学习诊断报告 🟡 中优先级

**用户痛点**：不知道自己的薄弱点在哪里，不知道如何改进

**功能描述**：
- 每周自动生成学习报告
- 分析回答模式（哪个概念理解不深）
- 个性化改进建议
- 学习路径推荐

**报告内容**：
```
本周学习报告 (2024.02.04 - 2024.02.10)

📊 学习概览
- 学习次数：12 次
- 平均得分：78 分
- 学习时长：8.5 小时

💪 掌握良好
- React 组件
- Props 传递

⚠️ 需要巩固
- Hooks 原理
- useEffect 依赖

❌ 薄弱环节
- State 管理

💡 AI 建议
本周你在 Hooks 相关问题上得分较低，建议：
1. 重点复习 useEffect 的使用场景
2. 练习自定义 Hook 的编写
3. 推荐学习资源：[链接]
```

**用户价值**：
- 清晰了解自己的学习状况
- 获得个性化建议
- 持续改进方向

---

### P1: 学习笔记/知识库 🟡 中优先级

**用户痛点**：学习内容容易遗忘，没有知识沉淀

**功能描述**：
- AI 自动提取每次学习的核心要点
- 用户可以补充个人理解
- 支持标签分类和搜索
- Markdown 格式导出

**数据模型**：
```python
Note（学习笔记）
- id: UUID
- user_id: UUID
- session_id: UUID
- title: String (AI 生成标题)
- content: Text (笔记内容)
- tags: Array[String]
- is_ai_generated: Boolean
- created_at: DateTime
- updated_at: DateTime
```

**笔记格式**：
```markdown
# React 组件基础

📌 核心概念
组件是 React 的核心概念...

📝 你的理解
[用户在学习时的回答]

💡 AI 补充
组件可以复用，通过 Props 传递数据...

🔗 相关资源
- [官方文档](https://react.dev)
- [学习路径](/learning-path/react)
```

**用户价值**：
- 知识沉淀与积累
- 方便回顾和查找
- 形成个人知识库

---

### P2: 学习目标与挑战 🟢 低优先级

**用户痛点**：学习缺乏目标感，容易放弃

**功能描述**：
- 设定学习目标（如：7天掌握 React 基础）
- AI 生成每日学习任务
- 完成进度可视化
- 成就徽章系统

**数据模型**：
```python
LearningGoal（学习目标）
- id: UUID
- user_id: UUID
- title: String
- description: Text
- duration_days: Integer
- start_date: Date
- end_date: Date
- status: Enum (pending/active/completed/abandoned)
- progress: Integer (0-100)

DailyTask（每日任务）
- id: UUID
- goal_id: UUID
- title: String
- completed: Boolean
- due_date: Date

Achievement（成就）
- id: UUID
- user_id: UUID
- type: String (streak/total_time/sessions/etc)
- title: String
- description: String
- icon: String
- unlocked_at: DateTime
```

**用户价值**：
- 明确学习目标
- 保持学习动力
- 游戏化体验

---

## 功能优先级矩阵

| 功能 | 用户价值 | 开发难度 | 优先级 | 预计工期 |
|------|----------|----------|--------|----------|
| 智能闪卡复习 | 极高 | 中 | P0 | 3-4天 |
| 番茄钟统计 | 高 | 低 | P0 | 2-3天 |
| AI 诊断报告 | 高 | 中 | P1 | 3-4天 |
| 学习笔记 | 中高 | 低 | P1 | 2-3天 |
| 目标挑战 | 中 | 中 | P2 | 3-4天 |

---

## 技术实现要点

### 闪卡复习系统
1. 后端实现 SuperMemo SM-2 算法
2. 前端实现闪卡翻转动画
3. 定时任务检查每日到期卡片
4. 推送通知提醒复习

### 番茄钟系统
1. 前端实现计时器组件
2. 后端记录番茄钟会话
3. 与学习会话关联分析

### AI 诊断报告
1. 后端定时任务生成周报
2. AI 分析学习数据
3. 前端可视化展示

---

## 版本规划

### v1.0 (已完成)
- 费曼学习法核心功能
- 多 AI 模型支持
- 学习历史统计
- PWA 离线支持

### v1.1 (开发中)
- 智能闪卡复习系统
- 番茄钟 + 学习时间统计

### v1.2 (规划中)
- AI 学习诊断报告
- 学习笔记/知识库

### v1.3 (未来)
- 学习目标与挑战
- 成就系统
- 社交功能
