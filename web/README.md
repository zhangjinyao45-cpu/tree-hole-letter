# 树洞来信

一个可部署的手机端 Web MVP：用户通过邮箱验证码登录，写一封只在未来启封的信；未启封信件不可修改正文和标题、可删除，启封时间只能调整一次。到期后系统发送不泄露正文的提醒邮件，用户本人登录后查看原文。

## 技术栈

- Next.js 16 + React 19 + TypeScript（前后端一体，部署到 Vercel）
- Supabase Auth + Postgres（身份、数据、原子业务规则）
- AES-256-GCM（正文在进入数据库前加密）
- Resend（到期提醒邮件）
- Cloudflare Turnstile（登录反滥用）
- Vercel Cron（每天 08:00 中国标准时间处理提醒）

## 本地运行

```bash
cp .env.example .env.local
npm ci
npm run dev
```

访问 `http://localhost:3000`。开发环境未配置 Turnstile 服务端密钥时，服务端会跳过该校验；生产环境必须配置完整 Turnstile 密钥对。

## 配置与发布

1. 在 Supabase SQL Editor 执行 [`../supabase/migrations/202607160001_initial_schema.sql`](../supabase/migrations/202607160001_initial_schema.sql)。
2. 在 Supabase Authentication 中启用 Email，并把 OTP 有效期设为 10 分钟；将生产 URL 添加到 Redirect URLs。
3. 在 Cloudflare Turnstile 创建一个 Managed Widget，站点域名填写生产域名；得到 site key 与 secret key。
4. 在 Resend 验证发信域名，并创建 API key。`RESEND_FROM_EMAIL` 必须是该已验证域名下的地址。
5. 在 Vercel 导入本仓库，**Root Directory 选择 `web`**，并按 `.env.example` 添加所有变量。`NEXT_PUBLIC_SITE_URL` 填最终 `https://...vercel.app` 域名。
6. 在 Vercel 的生产环境部署后，确认 Cron 已识别 `vercel.json`。Cron 请求需要 `Authorization: Bearer $CRON_SECRET`；Vercel 会自动注入匹配的 `CRON_SECRET`，也应在环境变量中显式设置一个高熵值。

生成密钥（每个变量单独执行一次）：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

`LETTER_ENCRYPTION_KEY_V1`、`LETTER_IDEMPOTENCY_HMAC_KEY_V1`、`AUTH_RATE_LIMIT_HMAC_KEY` 都必须使用不同的 32 字节 Base64 随机值。

## 验证

```bash
npm run test:all
npm run test:e2e
```

`test:all` 包含 ESLint、TypeScript、Vitest 和生产构建；Playwright 在 Chromium、Pixel 7、iPhone 14 三种视口校验公开页面与无障碍基础规则。

## 安全边界

- 不信任客户端时间；所有启封和“一次改期”规则由 Postgres 原子函数裁决。
- 数据库表对 `anon` 与 `authenticated` 均撤销直连权限，仅服务端 service role 可访问。
- 正文是应用层加密密文；提醒邮件只含启封提示，不含信件内容。
- OTP 请求受邮箱和 IP 双重限流，生产环境由 Turnstile 保护。
