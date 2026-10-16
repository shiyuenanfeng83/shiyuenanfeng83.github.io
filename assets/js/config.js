/* =========================================================================
 * config.js —— 站点全局配置（站长最常修改的地方）
 * -------------------------------------------------------------------------
 * 想改站点名/默认密码/每页文章数，改这里即可，不用动其他文件。
 * 注意：本文件在 index.html 之前被 base 变量初始化（见各页面顶部 <script>）。
 * ========================================================================= */
window.BlogConfig = {
  /* ---------- 数据相关 ---------- */
  // 文章数据 JSON 文件路径（相对于站点根目录）。
  // 后台页在 /admin/ 目录下，会自动拼接为 ../data/posts.json
  get DATA_JSON() {
    return (window.__BLOG_BASE__ || './') + 'data/posts.json';
  },
  // localStorage 的键名：站长在本机编辑后的数据保存在这里
  STORAGE_KEY: 'static-blog-data-v1',
  // 登录态保存键名
  AUTH_KEY: 'static-blog-auth-v1',

  /* ---------- 前台分页 ---------- */
  PAGE_SIZE: 5, // 首页每页显示的文章数量

  /* ---------- 后台安全 ---------- */
  // 后台密码：这里只保存 sha256 哈希，不存明文。
  // 初始密码是 admin123，请务必在部署前改成自己的：
  //   在本项目根目录执行 node deploy/make-password.js 你的新密码
  DEFAULT_PASSWORD_HASH: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',

  /* ---------- 其他 ---------- */
  ENABLE_ADMIN_LINK: true, // 是否在页脚显示"后台入口"链接（不想让别人看到入口就改成 false）
  ICE_BREAKWORD: '' // 预留字段，暂无用途
};

/* 统一的 ithome 风格工具：取后台地址（前台页脚用） */
window.adminUrl = function () {
  return (window.__BLOG_BASE__ || './') + 'admin/';
};
