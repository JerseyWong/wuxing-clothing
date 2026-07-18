# 安装修复说明（v2.1.1）

v2.1.0 交付包的 `package-lock.json` 错误包含内部 npm 镜像地址，外部环境执行 `npm ci` 会长时间等待。

v2.1.1 已完成以下修复：

- 所有锁文件下载地址改为 `https://registry.npmjs.org/`
- 增加 `.npmrc` 超时与有限重试配置
- 声明 Node.js `>=20.19.0`、npm `>=10`
- 未改变项目业务代码和依赖版本

安装：

```bash
npm ci
npm run check
npm run dev
```
