# 阿里云轻量服务器部署指南

## 为什么选择阿里云？

- ✅ 国内访问速度快
- ✅ 价格实惠（¥24/月起）
- ✅ 完全控制服务器
- ✅ 适合长期运行

## 1. 购买服务器

1. 访问 [阿里云轻量应用服务器](https://www.aliyun.com/product/swas)
2. 选择配置：
   - CPU: 1核
   - 内存: 1GB
   - 带宽: 3Mbps
   - 镜像: **Ubuntu 22.04** 或 **Python 8.1**
3. 购买后获取服务器 IP 和密码

## 2. 连接服务器

```bash
# SSH 连接
ssh root@你的服务器IP

# 或使用阿里云控制台的远程连接
```

## 3. 安装环境

```bash
# 更新系统
apt update && apt upgrade -y

# 安装 Python 和 pip
apt install python3 python3-pip -y

# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install nodejs -y

# 安装 Nginx
apt install nginx -y

# 安装 PM2 (进程管理)
npm install -g pm2
```

## 4. 部署后端

```bash
# 克隆代码
cd /var/www
git clone https://github.com/0xChrishu/feynman.git learning-coach
cd learning-coach/backend

# 安装依赖
pip3 install -r requirements.txt

# 创建 .env 文件
nano .env
# 填入你的环境变量

# 使用 PM2 启动后端
pm2 start main.py --name learning-coach-api --interpreter python3
pm2 save
pm2 startup
```

## 5. 部署前端

```bash
cd /var/www/learning-coach/frontend

# 安装依赖
npm install

# 修改 API 地址
echo "VITE_API_URL=http://你的服务器IP:8000/api" > .env.production

# 构建前端
npm run build

# 配置 Nginx
nano /etc/nginx/sites-available/learning-coach
```

Nginx 配置内容：

```nginx
server {
    listen 80;
    server_name 你的域名;

    # 前端静态文件
    location / {
        root /var/www/learning-coach/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# 启用配置
ln -s /etc/nginx/sites-available/learning-coach /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

## 6. 配置防火墙

```bash
# 允许 HTTP 和 HTTPS
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
ufw enable
```

## 7. 配置 SSL 证书（可选）

```bash
# 安装 Certbot
apt install certbot python3-certbot-nginx -y

# 获取证书
certbot --nginx -d 你的域名

# 自动续期
certbot renew --dry-run
```

## 8. 维护命令

```bash
# 查看后端日志
pm2 logs learning-coach-api

# 重启后端
pm2 restart learning-coach-api

# 查看服务器资源
htop

# 更新代码
cd /var/www/learning-coach
git pull
pm2 restart learning-coach-api
```

## 成本估算

| 配置 | 价格 |
|------|------|
| 1核1GB | ¥24/月 |
| 1核2GB | ¥36/月 |
| 2核2GB | ¥60/月 |
| 域名 | ¥50-100/年 |

## 总计

- 服务器: ¥24/月
- 域名: ¥50/年（可选）
- **约 ¥300/年**
