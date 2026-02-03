# Render 部署指南

## 1. 准备工作

确保你的项目已经推送到 GitHub。

## 2. 部署后端

1. 访问 [render.com](https://render.com/)
2. 注册/登录账号
3. 点击 **New** → **Web Service**
4. 连接你的 GitHub 仓库
5. 配置如下：

   | 配置项 | 值 |
   |--------|-----|
   | Name | `learning-coach-api` |
   | Environment | `Python` |
   | Build Command | `cd backend && pip install -r requirements.txt` |
   | Start Command | `cd backend && python main.py` |

6. 添加环境变量（Environment Variables）：

   ```
   LLM_API_KEY=你的API_Key
   LLM_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
   LLM_MODEL=qwen-plus
   JWT_SECRET_KEY=生成的随机密钥
   DATABASE_URL=postgresql://用户名:密码@主机地址:5432/数据库名
   PORT=8000
   ```

7. 选择 **Free** 或 **Paid** 计划
8. 点击 **Create Web Service**
9. 等待部署完成，会得到一个 URL，如 `https://learning-coach-api.onrender.com`

## 3. 部署前端

1. 再次点击 **New** → **Web Service**
2. 选择同一个仓库
3. 配置如下：

   | 配置项 | 值 |
   |--------|-----|
   | Name | `learning-coach-web` |
   | Environment | `Node` |
   | Build Command | `cd frontend && npm install && npm run build` |
   | Publish Directory | `frontend/dist` |
   | Start Command | `cd frontend && npm run preview` 或留空使用静态托管 |

4. 添加环境变量：

   ```
   VITE_API_URL=https://learning-coach-api.onrender.com/api
   ```

5. 点击 **Create Web Service**

## 4. 更新前端 API 地址

部署后需要修改前端的 API 地址。创建 `frontend/.env.production`：

```bash
VITE_API_URL=https://learning-coach-api.onrender.com/api
```

## 5. 使用自定义域名（可选）

1. 在域名服务商添加 DNS 记录
2. 在 Render 的项目设置中添加自定义域名
3. Render 会自动配置 SSL 证书
