# 部署指南

## 环境变量

部署时需要配置以下环境变量：

| 变量名 | 说明 | 必填 | 示例值 |
|--------|------|------|--------|
| `LLM_API_KEY` | 阿里通义千问 API Key | 是 | `your-api-key-here` |
| `LLM_BASE_URL` | API 地址 | 否 | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| `LLM_MODEL` | 模型名称 | 否 | `qwen-plus` |
| `JWT_SECRET_KEY` | JWT 签名密钥 | 是 | 随机字符串 |
| `DATABASE_URL` | 数据库连接 | 否 | `sqlite:///./learning_coach.db` |
| `DEBUG` | 调试模式 | 否 | `false` |
| `PORT` | 服务端口 | 否 | `8000` |
| `CORS_ORIGINS` | 允许的前端域名 | 否 | `http://localhost:5173` |

## 获取 API Key

### 阿里通义千问

1. 访问 [阿里云百炼控制台](https://bailian.console.aliyun.com/)
2. 开通通义千问服务
3. 创建 API Key
4. 复制 API Key 到环境变量

### 生成 JWT Secret Key

```bash
# 方法 1: 使用 Python
python -c "import secrets; print(secrets.token_urlsafe(32))"

# 方法 2: 使用 OpenSSL
openssl rand -base64 32
```

## 本地开发

1. 复制配置模板：
   ```bash
   cp backend/.env.example backend/.env
   ```

2. 编辑 `backend/.env`，填入真实的配置值

3. 启动服务：
   ```bash
   cd backend && python main.py
   ```

## 部署到 Railway

1. 在 GitHub 上 fork 此项目
2. 在 Railway 上创建新项目，连接 GitHub 仓库
3. 在 Railway 设置中配置环境变量
4. 部署完成，Railway 会自动检测端口

## 部署到 Render

1. 在 GitHub 上 fork 此项目
2. 在 Render 上创建新的 Web Service
3. 连接 GitHub 仓库
4. 配置环境变量
5. 部署

## 使用 Docker 部署

```bash
# 构建镜像
docker build -t learning-coach .

# 运行容器
docker run -d \
  -p 8000:8000 \
  -e LLM_API_KEY=your_key \
  -e JWT_SECRET_KEY=your_secret \
  learning-coach
```

## 安全检查清单

部署前请确认：

- [ ] 已更换默认的 JWT_SECRET_KEY
- [ ] API Key 已正确配置
- [ ] DEBUG 设置为 `false`
- [ ] CORS_ORIGINS 仅包含可信域名
- [ ] 数据库连接字符串正确
- [ ] .env 文件未提交到代码仓库

## 故障排查

### API Key 无效

```
Error code: 401 - Incorrect API key provided
```

**解决方案**：检查 API Key 是否正确，是否已激活服务

### CORS 错误

```
Access to XMLHttpRequest at 'http://localhost:8000' from origin 'http://localhost:5173' has been blocked by CORS policy
```

**解决方案**：检查 `CORS_ORIGINS` 环境变量是否包含前端地址

### 数据库错误

```
OperationalError: unable to open database file
```

**解决方案**：检查数据库文件路径是否有写入权限
