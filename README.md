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

每类颜色卡片支持「**查看全部 10 种颜色**」展开，覆盖更多现代流行色。

---

## 🧮 核心算法

### 日柱计算（JDN 法）

通过儒略日公式将公历转换为天干地支日柱，天干偏移 `+9`，地支偏移 `+1`（经多日期实测验证）：

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

取**日柱地支**对应五行（非天干），依相生相克映射五类颜色：

```
地支 → 五行：寅卯=木 · 巳午=火 · 辰戌丑未=土 · 申酉=金 · 子亥=水
相生：木→火→土→金→水→木
相克：木克土 · 火克金 · 土克水 · 金克木 · 水克火
```

### 农历转换

使用浏览器原生 `Intl.DateTimeFormat('zh-Hans-u-ca-chinese')` 进行农历转换，无需任何数据表，零维护成本：

```js
const formatter = new Intl.DateTimeFormat('zh-Hans-u-ca-chinese', {
  year: 'numeric', month: 'long', day: 'numeric',
});
const parts = formatter.formatToParts(date);
// 直接获取 yearName（干支年）、month（农历月，含闰月前缀）、day（农历日）
```

**兼容性：** Chrome 79+ / Edge 79+ / Safari 14+ / Firefox 52+

---

## 🎨 五行颜色对照

| 五行 | 基础色 | 扩展现代色 |
|------|--------|-----------|
| 🌿 木 | 绿色、青色、翠绿 | 草绿、嫩绿、薄荷绿、橄榄绿、墨绿、军绿、苔藓绿 |
| 🔥 火 | 红色、紫色、粉色 | 橙色、橘色、酒红、珊瑚色、桃红、藕粉 |
| 🟡 土 | 黄色、咖啡色、土黄 | 驼色、卡其、米色、奶茶色、焦糖色、沙漠色、棕色 |
| ⚪ 金 | 白色、银白色、金色 | 乳白、米白、象牙白、珍珠白、浅灰、香槟金、铂金 |
| 🖤 水 | 黑色、深蓝、藏青 | 宝蓝、深灰、炭灰、靛蓝、蓝紫、墨色、深紫 |

---

## 📅 支持范围

- 公历年份：**1970 — 2099 年**
- 农历转换：浏览器原生 `Intl` API，理论上无年份限制

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
# 停止并移除容器
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
└── .dockerignore
```

---

## 🛠 技术栈

- **框架**：React 18 + Vite 5
- **样式**：纯 CSS-in-JS（无外部 UI 库）
- **字体**：Google Fonts · Noto Serif SC
- **农历**：浏览器原生 `Intl.DateTimeFormat`（无第三方依赖）
- **部署**：Docker + Nginx 多阶段构建，镜像体积约 20MB

---

## 📌 免责声明

本应用基于中国传统五行民俗文化，**仅供参考娱乐**，不构成任何科学建议。祝您开心快乐，一切顺遂 🙏

---

## 📄 License

MIT License · © 2026
