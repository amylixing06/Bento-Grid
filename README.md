# 新视力

## 项目简介
新视力是一款智能内容分析工具，可以将文章内容或链接（支持微信文章）一键转换为结构化、美观的 Bento Grid 风格图片，让内容展示更加直观、精炼，适合社交媒体分享与知识内容展示。

## 功能特点
- 支持输入文章文本或 URL（含微信公众号文章链接）
- 自动抓取微信文章正文、标题、作者
- Kimi (Moonshot) API 智能分析内容，输出多分区卡片结构
- 前端多分区卡片渲染，支持 summary、tags、作者、原文等展示
- 一键导出图片

## 技术栈
- Next.js
- Tailwind CSS
- TypeScript
- cheerio（后端抓取）
- Kimi API（内容分析）

## 安装与使用
1. 克隆仓库
   ```bash
   git clone <仓库地址>
   cd Bento-Grid
   ```
2. 安装依赖
   ```bash
   npm install
   # 或 yarn install
   ```
3. 配置环境变量
   在根目录新建 `.env.local`，添加：
   ```
   KIMI_API_KEY=你的密钥
   ```
4. 启动开发环境
   ```bash
   npm run dev
   # 或 yarn dev
   ```
5. 访问 http://localhost:3002

## 注意事项
- `.gitignore` 已配置常见大文件和敏感文件过滤
- 如遇推送/上传失败，优先检查大文件和缓存
- 微信文章需确保可公开访问

## 贡献方式
欢迎提交 Issue 或 PR，完善功能和体验。 