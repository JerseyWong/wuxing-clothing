# 五行穿衣配色 · Wuxing Clothing Color Guide

> 依日柱地支五行相生相克，每日为你推荐穿衣配色方案

![React](https://img.shields.io/badge/React-18-61dafb?logo=react)
![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite)
![Docker](https://img.shields.io/badge/Docker-ready-2496ed?logo=docker)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 📖 功能介绍

根据中国传统五行学说，依据所选日期的**日柱地支五行**，结合五行相生相克关系，给出当日五类穿衣配色建议：

| 类别 | 图标 | 说明 |
|------|------|------|
| 顺利贵人色 | ★ | 日支五行所生之行，大环境顺你，办事易成 |
| 合宜安稳色 | ◎ | 与日支同行，适合商务合作、沟通谈判 |
| 奋斗加油色 | ◆ | 克日支之行，需付出努力，成功收获大 |
| 辛苦消耗色 | △ | 生日支之行，消耗自身元气，重要场合慎穿 |
| 压力山大色 | ✕ | 被日支所克之行，阻力大，重要日子避免 |

---

## 🧮 核心算法原理

### 日柱计算
通过儒略日（JDN）公式将公历日期转换为天干地支日柱：

```js
function jdn(y, m, d) {
  const a = Math.floor((14 - m) / 12);
  const yr = y + 4800 - a;
  const mo = m + 12 * a - 3;
  return d + Math.floor((153 * mo + 2) / 5) + 365 * yr
       + Math.floor(yr / 4) - Math.floor(yr / 100)
       + Math.floor(yr / 400) - 32045;
}

function getSB(y, m, d) {
  const j = jdn(y, m, d);
  return {
    stem:   STEMS[((j + 9) % 10 + 10) % 10],   // 天干
    branch: BRANCHES[((j + 1) % 12 + 12) % 12], // 地支
  };
}
```

### 五行推算
取**日柱地支**对应的五行（而非天干），再依五行生克关系映射五类颜色：

```
地支 → 五行：寅卯=木 · 巳午=火 · 辰戌丑未=土 · 申酉=金 · 子亥=水
相生：木→火→土→金→水→木
相克：木克土 · 火克金 · 土克水 · 金克木 · 水克火
```

---

## 🎨 五行颜色对照

| 五行 | 代表色 | 扩展色 |
|------|--------|--------|
| 🌿 木 | 绿色、青色、翠绿 | 草绿、嫩绿、薄荷绿、橄榄绿、墨绿、军绿 |
| 🔥 火 | 红色、紫色、粉色 | 橙色、橘色、酒红、珊瑚、桃红、藕粉 |
| 🟡 土 | 黄色、咖啡色、土黄 | 驼色、卡其、米色、奶茶、焦糖、沙漠色 |
| ⚪ 金 | 白色、银白色、金色 | 乳白、米白、象牙白、浅灰、香槟金、铂金 |
| 🖤 水 | 黑色、深蓝、藏青 | 宝蓝、深灰、炭灰、靛蓝、蓝紫、深紫 |

---

## 📅 支持范围

- 公历年份：**2020 — 2030 年**
- 农历数据：内置精确农历月大小及闰月数据

---

## 🚀 快速开始

### 本地开发

```bash
# 克隆项目
git clone https://github.com/JerseyWong/wuxing-clothing.git
cd wuxing-clothing

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 [http://localhost:5173](http://localhost:5173)

### 构建生产版本

```bash
npm run build
```

---

## 🐳 Docker 部署

### 方式一：docker-compose（推荐）

```bash
docker-compose up -d --build
```

访问 [http://localhost:8080](http://localhost:8080)

### 方式二：手动构建

```bash
# 构建镜像
docker build -t wuxing-clothing .

# 启动容器
docker run -d -p 8080:80 --name wuxing-clothing wuxing-clothing
```

### 停止与清理

```bash
# 停止容器
docker-compose down

# 同时删除镜像
docker-compose down --rmi all
```

---

## 📁 项目结构

```
wuxing-clothing/
├── src/
│   ├── App.jsx          # 主组件（五行穿衣核心逻辑）
│   └── main.jsx         # React 入口
├── index.html           # HTML 模板
├── package.json
├── vite.config.js
├── Dockerfile           # 多阶段构建（Node build + Nginx serve）
├── nginx.conf           # Nginx 配置（含 SPA 路由支持）
├── docker-compose.yml
├── .dockerignore
└── README.md
```

---

## 🛠 技术栈

- **框架**：React 18 + Vite 5
- **样式**：纯 CSS-in-JS（无外部 UI 库）
- **字体**：Google Fonts · Noto Serif SC
- **部署**：Docker + Nginx（多阶段构建，镜像约 20MB）

---

## 📌 免责声明

本应用基于中国传统五行民俗文化，**仅供参考娱乐**，不构成任何科学建议。祝您开心快乐，一切顺遂 🙏

---

## 📄 License

MIT License · © 2026
