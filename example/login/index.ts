import dotenv from 'dotenv';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import type { UserProfile } from '../../lib/profile.js';
import { Strategy } from '../../lib/stategy.js';

const app = express();

dotenv.config();

app.use(session({
  secret: 'linuxdo-super-secret-key',
  resave: false,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());


passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((user, done) => {
  done(null, user as any);
});

passport.use(new Strategy({
  clientID: process.env.CLIENT_ID || '',
  clientSecret: process.env.CLIENT_SECRET || '',
  callbackURL: 'http://localhost:3000/auth/callback',
}, (accessToken: string, refreshToken: string, profile: any, done: Function) => {
  console.log('🎉 成功获取到 Access Token:', accessToken);
  console.log('👤 解析到的标准 Profile:', profile);

  // 在这里可以进行数据库查找或创建用户的操作
  // User.findOrCreate({ ssoId: profile.id }, function (err, user) {
  //   return done(err, user);
  // });

  return done(null, profile);
}));

// 首页：提供一个登录入口
app.get('/', (req, res) => {
  res.send(`
    <h2>Passport OAuth2 测试</h2>
    <a href="/auth">点击使用 SSO 登录</a>
  `);
});

app.get('/profile', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/');
  }
  const user = req.user as UserProfile;
  res.send(`
    <h2>欢迎回来，${user.name}！</h2>
    <img src="${user.avatar_url}" alt="Avatar" width="100" height="100" />
    <pre>${user.name}</pre>
    <a href="/logout">退出登录</a>
  `);
});

// 触发鉴权：进入该路由后，Passport 会组装参数并 302 重定向到授权页
app.get('/auth', passport.authenticate('linuxdo'));

// 回调路由：用户在授权页同意后，第三方会携带 code 跳转回这里
app.get('/auth/callback', passport.authenticate('linuxdo', {
  successRedirect: '/profile', // 成功后跳往个人信息页
  failureRedirect: '/',        // 失败则退回首页
}));

app.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect('/');
  });
});

app.listen(3000, () => {
  console.log('服务器已启动，访问 http://localhost:3000/auth 开始登录流程');
});
