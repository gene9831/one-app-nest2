# One app nest

## 描述

[Nest](https://github.com/nestjs/nest) + [Typescript](https://www.typescriptlang.org/) 实现的 OneDrive 文件分享系统。

使用 [Microsoft Graph Api](https://docs.microsoft.com/zh-cn/graph/api/resources/onedrive?view=graph-rest-1.0) 来缓存文件信息

## 安装

```bash
yarn
```

## 配置

路径: `src/config.yaml`。没有文件则新建

[注册微软应用教程](https://docs.microsoft.com/zh-cn/graph/tutorials/node?tutorial-step=2)。重定向 url 填写 `http://localhost:3000/msal/authCallback`

- clientId: 概述 > 应用程序(客户端) ID
- clientSecret: 证书和密码 > 客户端密码
- redirectUri: 身份验证 > 平台配置 > Web

```yaml
db:
  mongo:
    uri: mongodb://username:password@host:port/collection

## 'production', 'development'; default 'production'
# env: production

jwt:
  secret: 'secret'
  signOptions:
    # https://github.com/vercel/ms#examples
    expiresIn: '7d'

# logfiles:
#   # 'error', 'warn', 'info', 'verbose'
#   - level: info

msal:
  clientId: clientId
  clientSecret: clientSecret
  redirectUri: http://localhost:3000/msal/authCallback
  scopes:
    - Files.ReadWrite
```

## 运行

这里使用 [`pm2`](https://pm2.keymetrics.io/docs/usage/quick-start/) 管理 `nodejs` 后端应用

```bash
yarn build
pm2 start dist/main.js --name one-nest-app
```
