# MCCode

类 VSCode 的 Minecraft 数据包（datapack）编辑器：Web 优先，同时提供 Electron 桌面壳。

## 特性

- 数据包开发：`mcfunction` / JSON / `mcdoc` 高亮、补全、诊断、跳转（基于 [Spyglass](https://github.com/SpyglassMC/Spyglass)）
- 数据包向导、文件树管理、保存与导出 `.zip`
- 全局搜索（正则 / glob / 替换）、大纲视图、注册表数据浏览
- 设置持久化、中英文界面、增量文件监听、问题面板与输出日志

## 技术栈

React 18 · TypeScript · Vite · Monaco Editor · Zustand · Tailwind CSS · Spyglass · Electron

## 开始

```bash
npm install
npm run dev        # Web 开发服务器 http://localhost:5173
npm run desktop    # 构建并启动 Electron
```

## 校验

```bash
npm run typecheck
npm run lint
npm run format:check
npm test           # Vitest 单元测试
npm run e2e        # Playwright（首次需 npx playwright install chromium）
npm run build
```

## 打包

```bash
npm run desktop:dist   # 生成安装包，输出到 release/
```

## 目录

| 路径 | 说明 |
| --- | --- |
| `apps/web` | Web 应用（编辑器、UI、Spyglass 引擎） |
| `apps/desktop` | Electron 主进程与打包配置 |
| `e2e` | Playwright 端到端用例 |
| `.github/workflows` | CI 与发布流程 |
