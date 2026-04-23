# ===== Stage 1: Build =====
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ===== Stage 2: Serve with Nginx =====
FROM nginx:stable-alpine AS production
# 删除 Nginx 默认页面
RUN rm -rf /usr/share/nginx/html/*
# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html
# 复制自定义 Nginx 配置（支持 React Router 前端路由）
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
