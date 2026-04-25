# passport-linuxdo

[![npm version](https://img.shields.io/npm/v/passport-linuxdo.svg)](https://www.npmjs.com/package/passport-linuxdo)
[![npm downloads](https://img.shields.io/npm/dm/passport-linuxdo.svg)](https://www.npmjs.com/package/passport-linuxdo)

基于 [Passport.js](http://www.passportjs.org/) 的 LinuxDO Connect OAuth 2.0 认证策略，支持使用 LinuxDO 账号进行单点登录（SSO）。

## 安装

```bash
npm install passport-linuxdo
```

## 使用方法

### 基本配置

```typescript
import passport from 'passport';
import { Strategy as LinuxDOStrategy } from 'passport-linuxdo';

passport.use(new LinuxDOStrategy({
  clientID:     LINUXDO_CLIENT_ID,
  clientSecret: LINUXDO_CLIENT_SECRET,
  callbackURL:  "http://localhost:3000/auth/linuxdo/callback"
},
function(accessToken, refreshToken, profile, done) {
  // 在此处查找或创建用户
  User.findOrCreate({ linuxdoId: profile.id }, function (err, user) {
    return done(err, user);
  });
}
));
```

### Express 应用示例

```typescript
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LinuxDOStrategy } from 'passport-linuxdo';

const app = express();

app.use(session({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LinuxDOStrategy({
  clientID:     process.env.LINUXDO_CLIENT_ID || '',
  clientSecret: process.env.LINUXDO_CLIENT_SECRET || '',
  callbackURL:  "http://localhost:3000/auth/linuxdo/callback"
}, (accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj: any, done) => done(null, obj));

app.get('/auth/linuxdo', passport.authenticate('linuxdo'));

app.get('/auth/linuxdo/callback',
  passport.authenticate('linuxdo', { failureRedirect: '/login' }),
  (req, res) => res.redirect('/'));

app.listen(3000);
```

## 配置选项

| 参数           | 类型     | 必填 | 说明                          |
|----------------|----------|------|-------------------------------|
| `clientID`     | `string` | 是   | LinuxDO Connect 分配的客户端 ID   |
| `clientSecret` | `string` | 是   | LinuxDO Connect 分配的客户端密钥  |
| `callbackURL`  | `string` | 是   | 授权完成后的回调地址          |

## 用户 Profile

认证成功后，`profile` 对象包含以下字段：

| 字段            | 类型      | 说明              |
|-----------------|-----------|-------------------|
| `id`            | `number`  | 用户 ID           |
| `sub`           | `string`  | 用户主体标识符    |
| `username`      | `string`  | 用户名            |
| `login`         | `string`  | 登录名            |
| `name`          | `string`  | 显示名称          |
| `email`         | `string`  | 邮箱地址          |
| `avatar_url`    | `string`  | 头像 URL          |
| `active`        | `boolean` | 账号是否激活      |
| `trust_level`   | `number`  | 信任等级          |
| `silenced`      | `boolean` | 是否被禁言        |
| `external_ids`  | `unknown` | 外部平台绑定信息  |
| `api_key`       | `string`  | API 密钥          |

## 开发

### 运行测试

```bash
npm test
```

### 文件结构

```
lib/
  strategy.ts   # 核心策略实现
  profile.ts    # 用户 Profile 类型定义
example/
  login/        # Express 示例应用
test/
  strategy.test.ts  # 测试用例
docs/
  OAuth 2.0 详解...md  # 技术文档
```

## Community

[**LINUX DO — 中文开发者社区**](https://linux.do/)

## 协议

[MIT](LICENSE)
