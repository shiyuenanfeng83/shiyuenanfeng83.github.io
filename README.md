# 纯静态个人博客（HTML + CSS + 原生 JS）

访客免登录直接看；站长一个人通过 `/admin` 后台维护。
**不需要后端、不需要数据库**，可直接托管到 GitHub Pages / Vercel / Netlify / 对象存储。

---

## 一、目录结构

```
.
├── index.html              # 前台单页（路由：#/  #/tag/xxx  #/page/2  #/post/id）
├── admin/
│   └── index.html          # 后台编辑页（访问路径 /admin/，密码保护）
├── assets/
│   ├── css/style.css       # 全站样式（分节注释，改配色看第 1 节变量）
│   └── js/
│       ├── config.js       # ★ 站点配置：每页篇数、默认密码哈希、是否显示后台入口
│       ├── sha256.js       # 密码哈希工具（无依赖）
│       ├── markdown.js     # 极简 Markdown 渲染器（零依赖、带 XSS 过滤）
│       ├── store.js        # 数据层：JSON 文件 + localStorage 的读写/合并/导入导出
│       ├── app.js          # 前台路由与页面渲染
│       └── admin.js        # 后台：登录、增删改、图片上传、备份导出
├── data/
│   ├── posts.json          # ★ 全部内容都在这里（站点信息 + 所有文章）
│   └── posts.js            # 同内容的 JS 版本，便于 file:// 双击打开时兜底
└── README.md
```

## 二、本地预览

### 方式 1：双击打开（最省事）
直接双击 `index.html` 就能看。此时浏览器不允许 `fetch` 读本地 JSON，页面会自动使用 `data/posts.js` 里的数据。

### 方式 2：起个本地服务（推荐，效果与线上一致）
在项目根目录执行任意一条：

```bash
# Node.js 自带
npx serve .
# 或者 Python 3
python -m http.server 8080
```

然后访问：<http://localhost:3000>（serve 默认端口）或 <http://localhost:8080>。

## 三、日常使用：写一篇新文章（3 步）

1. **进入后台**：浏览器打开 `你的域名/admin/`，输入管理密码（默认 `admin123`）。
2. **写文章**：右上角【＋ 新建文章】→ 填标题、发布日期、标签（英文逗号分隔）、摘要、封面，正文用 Markdown 写 → 点【保存文章】。
   - **插入图片**：点【插入图片】选择本地图片，会自动压缩成 base64 写进文章（不用图床）。
   - **预览**：点【预览】可实时查看排版效果。
   - 保存后内容存在**当前浏览器**里，前台立刻就能看到（同浏览器、刷新即可）。
3. **发布到线上**：点【导出 JSON 备份】→ 把下载到的文件**重命名为 `posts.json`**，覆盖仓库里的 `data/posts.json`，再推送到 GitHub。
   > 同时可选：点【导出 posts.js】覆盖 `data/posts.js`，保持两个兜底文件同步。

**换数据/换电脑**：在新设备的后台点【导入 JSON】，选择备份文件即可一键恢复全部内容。
**找回仓库版本**：后台点【同步仓库数据】，会丢弃本机改动，重新以 `data/posts.json` 为准。

## 四、部署教程

### GitHub Pages（免费，最推荐）

#### 方式 A：不装 Git，用 token 一键部署（本机已在用）

当前站点仓库：`shiyuenanfeng83.github.io`，线上地址：**https://shiyuenanfeng83.github.io/**

在本项目根目录执行（token 需勾选 `repo` 权限，在 https://github.com/settings/tokens 生成）：

```powershell
$env:GITHUB_TOKEN = '你的token'
node deploy/github-deploy.js
```

脚本会自动完成：创建/复用仓库 → 上传全部站点文件（自动跳过 `deploy/` 等目录）→ 开启 Pages → 等待构建并打印网址。
**以后每次改完 `data/posts.json` 或其他文件，再跑一次这条命令就更新到线上了。**

> `deploy/` 只在本机使用，不会被上传。部署完成后建议到 GitHub 设置里删除该 token。

#### 方式 B：Git 命令行

1. 登录 GitHub → 右上角 **New repository**，仓库名填 `用户名.github.io`（这样域名就是 `https://用户名.github.io`；如果叫别的名字，访问路径会是 `https://用户名.github.io/仓库名/`，同样可用）。
2. 把本项目所有文件推送上去：

```bash
git init
git add .
git commit -m "init blog"
git branch -M main
git remote add origin https://github.com/用户名/仓库名.git
git push -u origin main
```

3. 打开仓库 **Settings → Pages** → Source 选择 `Deploy from a branch` → Branch 选 `main`、目录选 `/(root)` → Save。
4. 等 1～2 分钟，访问提示的地址即可。之后**每次 push，网站会自动更新**。

> 若换设备clone代码后需要登录 GitHub：用 `git` 凭据或个人令牌（PAT），不要用明文密码。

### Vercel（可选）

1. 把代码推到 GitHub/GitLab 仓库后，打开 <https://vercel.com> → Add New → Project → 导入该仓库。
2. Framework Preset 选 **Other**，Build Command 留空，Output Directory 留空 → Deploy。
3. 之后每次 `git push` 自动重新部署。

### Netlify（可选）

1. <https://app.netlify.com> → Add new site → Import an existing project → 选择仓库。
2. Build command 留空，Publish directory 填 `.`（仓库根目录）→ Deploy。

### 部署到子目录（如 `用户名.github.io/仓库名/`）
无需改任何路径，所有资源都基于页面自身的相对路径解析，前台 `#/` 路由也不依赖服务器配置。

## 五、常见问题

| 问题 | 解决办法 |
| --- | --- |
| 别人的电脑上看不到我刚写的文章 | 内容存在**你自己的浏览器**里。请【导出 JSON】覆盖 `data/posts.json` 并 push。 |
| 前台改了内容但页面没变 | 强制刷新（Ctrl/Cmd + Shift + R），或检查 JS 控制台是否有报错。 |
| 插入图片后提示存储空间不足 | 图片已压缩但 base64 仍较大。建议：少量图片用上传，大量图片先传到图床（如 GitHub Issues/对象存储），再把图片外链填到【封面图】或用 `![说明](图片地址)` 插入。 |
| 忘记后台密码 | 在本机浏览器控制台执行 `localStorage.clear()` 清除自定义密码，然后用 `config.js` 里的默认密码登录；或直接在浏览器开发者工具 → Application → Local Storage 里删掉 `static-blog-data-v1:pwd` 这一项。 |
| 想更换初始密码（部署前做最稳妥） | 在项目根目录执行 `node deploy/make-password.js 你的新密码`，脚本会把哈希写进 `assets/js/config.js`，然后重新打包上传即可。 |
| 想修改默认密码并永久生效 | 最省事：在项目根目录执行 `node deploy/make-password.js 你的新密码`（脚本自动写入哈希），然后重新上传 `assets/js/config.js`。也可以在后台【修改密码】→ 复制弹窗里的哈希 → 粘贴到 `config.js` 的 `DEFAULT_PASSWORD_HASH`。 |
| 不想在页脚显示"站长后台"入口 | 把 `assets/js/config.js` 里的 `ENABLE_ADMIN_LINK` 改成 `false`（后台页面仍然存在，只是前台没有链接）。 |
| 想改配色 / 正文宽度 | `assets/css/style.css` 第 1 节 `--color-accent`（主色）、`--max-width`（正文宽度）等变量。 |
| 想改每页文章数 | `assets/js/config.js` 里的 `PAGE_SIZE`。 |

## 六、二次开发说明（代码可扩展点）

- **Markdown 语法不够用**：扩展 `assets/js/markdown.js` 里的 `render()`；新增块级语法在 `for` 循环里加分支，行内语法加进 `inline()`。
- **想加"关于我/归档"页面**：在 `assets/js/app.js` 的 `parseHash()` 里加路由分支（如 `seg[0] === 'about'`），再写一个 `renderAbout()` 即可。
- **想换成真实后端**：只需重写 `assets/js/store.js` 里的几个方法（`load/savePost/deletePost` 改成请求 API），前台代码完全不用动。
- **数据字段**：`{ id, title, date, tags[], summary, cover, content, updatedAt }`，新增字段后在 `store.js` 的 `normalize()` 里补默认值即可。

## 七、安全提示

本方案是**纯静态 + 前端本地存储**：
- 访客全程只读，不存在注册/登录，**无任何写权限**；
- 后台密码只在浏览器本地校验，属于"防君子不防小人"的轻量保护，请勿存放极度敏感的内容；
- 真正的内容发布权限，来自你对 GitHub 仓库的推送权限。
