/* =========================================================================
 * store.js —— 数据层：统一管理文章数据的读写 / 增删改 / 导入导出
 * -------------------------------------------------------------------------
 * 数据优先级（重要，决定了"怎么同步内容"）：
 *   1. data/posts.json   —— 仓库里的正式数据来源，每次改完上传就更新网站
 *   2. data/posts.js     —— 同上内容的 JS 版本，用于直接 file:// 双击打开时的兜底
 *   3. localStorage      —— 站长在本机后台编辑后的工作副本（访客不会有）
 * 合并规则：比较两份数据顶层的 updatedAt 时间戳，谁新就用谁。
 *   所以站长在后台改完点【导出 JSON】并上传到仓库之后，
 *   其他人（包括你自己清空缓存后）打开网站都会看到最新内容。
 * ========================================================================= */
window.Store = (function () {
  'use strict';

  var CFG = window.BlogConfig;
  var KEY = CFG.STORAGE_KEY;

  var state = null; // 当前内存中的数据：{ updatedAt, site, posts }

  /* ------------------------- 基础工具 ------------------------- */
  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

  /** 站点默认信息：仓库里没有数据时用它兜底 */
  function defaultSite() {
    return {
      title: '我的个人博客',
      tagline: '记录生活 · 分享技术',
      bio: '你好，我是站长。这里是我的个人空间，用来记录学习与生活。',
      avatar: '',
      links: []
    };
  }

  /** 规范化数据，补齐缺失字段，避免各种 undefined 报错 */
  function normalize(raw) {
    var data = raw && typeof raw === 'object' ? clone(raw) : {};
    data.site = data.site || {};
    var s = defaultSite();
    Object.keys(s).forEach(function (k) {
      if (data.site[k] === undefined || data.site[k] === null) data.site[k] = s[k];
    });
    data.site.links = Array.isArray(data.site.links) ? data.site.links : [];

    data.posts = Array.isArray(data.posts) ? data.posts.map(function (p, i) {
      return {
        id: p.id || String(Date.now() - i),
        title: p.title || '未命名文章',
        summary: p.summary || Markdown.plain(p.content, 100),
        content: p.content || '',
        cover: p.cover || '',
        tags: Array.isArray(p.tags) ? p.tags : (p.tags ? String(p.tags).split(/[,，\s]+/).filter(Boolean) : []),
        date: p.date || today(),
        updatedAt: p.updatedAt || 0
      };
    }) : [];

    data.updatedAt = Number(data.updatedAt) || 0;
    return data;
  }

  function today() {
    var d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  /* ------------------------- 读取远程 JSON ------------------------- */
  function fetchJSON(url) {
    return fetch(url, { cache: 'no-store' })
      .then(function (res) { return res.ok ? res.json() : Promise.reject(new Error('HTTP ' + res.status)); })
      .catch(function () { return null; }); // 失败静默处理，交给兜底数据
  }

  /**
   * 载入数据：远程 JSON / 内嵌 seed / localStorage 三者按 updatedAt 择优
   * @param {boolean} forceRemote 后台点"同步仓库数据"时用 true，强制以 JSON 为准
   */
  function load(forceRemote) {
    var seedPromise;
    if (window.SEED_DATA) {
      seedPromise = Promise.resolve(window.SEED_DATA);
    } else {
      seedPromise = fetchJSON(CFG.DATA_JSON);
    }

    return Promise.all([fetchJSON(CFG.DATA_JSON), seedPromise]).then(function (res) {
      var remote = res[0];
      var seed = res[1];
      var base = remote || seed || { site: defaultSite(), posts: [] };
      var local = readLocal();

      if (forceRemote || !local) {
        state = normalize(base);
      } else {
        // 谁新用谁
        var localTime = Number(local.updatedAt) || 0;
        var baseTime = Number(base.updatedAt) || 0;
        state = normalize(localTime >= baseTime ? local : base);
      }
      persist(); // 首次进入时把兜底数据写入 localStorage，保证前后一致
      return getState();
    });
  }

  function readLocal() {
    try {
      var txt = localStorage.getItem(KEY);
      return txt ? JSON.parse(txt) : null;
    } catch (e) { return null; }
  }

  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      alert('保存失败：浏览器本地存储空间不足。\n建议把图片压缩后再上传，或先【导出 JSON】备份后清理旧文章。');
      return false;
    }
  }

  /* ------------------------- 对外数据接口 ------------------------- */
  function getState() { return clone(state); }

  /** 文章列表：按发布日期倒序；日期晚于今天的不显示（可实现"定时发布"） */
  function listPosts() {
    var todayStr = today();
    return state.posts.slice()
      .filter(function (p) { return String(p.date) <= todayStr; })
      .sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
  }

  function getPost(id) {
    return state.posts.filter(function (p) { return String(p.id) === String(id); })[0] || null;
  }

  /** 所有标签及每个标签下的文章数 */
  function allTags() {
    var map = {};
    state.posts.forEach(function (p) {
      (p.tags || []).forEach(function (t) { map[t] = (map[t] || 0) + 1; });
    });
    return Object.keys(map).map(function (t) { return { name: t, count: map[t] }; })
      .sort(function (a, b) { return b.count - a.count; });
  }

  /** 新增 / 更新文章（有 id 就改，没有就新建） */
  function savePost(post) {
    if (post.id) {
      for (var i = 0; i < state.posts.length; i++) {
        if (String(state.posts[i].id) === String(post.id)) {
          state.posts[i] = Object.assign({}, state.posts[i], post, { updatedAt: Date.now() });
          state.updatedAt = Date.now();
          persist();
          return state.posts[i];
        }
      }
    }
    var np = normalize({ posts: [post] }).posts[0];
    np.id = np.id || String(Date.now());
    np.updatedAt = Date.now();
    state.posts.push(np);
    state.updatedAt = Date.now();
    persist();
    return np;
  }

  function deletePost(id) {
    state.posts = state.posts.filter(function (p) { return String(p.id) !== String(id); });
    state.updatedAt = Date.now();
    persist();
  }

  /** 更新站点信息（标题、简介、头像、友链） */
  function saveSite(site) {
    state.site = Object.assign({}, state.site, site);
    state.updatedAt = Date.now();
    persist();
    return state.site;
  }

  /* ------------------------- 备份与恢复 ------------------------- */
  /** 导出全部内容（站点信息 + 所有文章），返回 JSON 字符串 */
  function exportJSON() {
    return JSON.stringify(getState(), null, 2);
  }

  /** 导入 JSON：整体替换当前数据（支持 posts.json 格式） */
  function importJSON(text) {
    var obj = JSON.parse(text);
    var data = obj && Array.isArray(obj.posts) ? obj
             : (Array.isArray(obj) ? { site: {}, posts: obj } : null);
    if (!data) throw new Error('文件格式不正确，缺少 posts 字段');
    state = normalize(data);
    state.updatedAt = Date.now();
    persist();
    return state.posts.length;
  }

  /** 丢弃本机修改，重新从仓库 JSON 拉取 */
  function resetToRemote() {
    localStorage.removeItem(KEY);
    return load(true);
  }

  return {
    load: load,
    getState: getState,
    listPosts: listPosts,
    getPost: getPost,
    allTags: allTags,
    savePost: savePost,
    deletePost: deletePost,
    saveSite: saveSite,
    exportJSON: exportJSON,
    importJSON: importJSON,
    resetToRemote: resetToRemote,
    today: today
  };
})();
