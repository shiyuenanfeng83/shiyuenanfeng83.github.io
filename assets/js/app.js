/* =========================================================================
 * app.js —— 前台 SPA（单页应用）：路由 + 页面渲染
 * -------------------------------------------------------------------------
 * 路由使用 hash（#/xxx），好处是不需要服务器配置重写规则，
 * GitHub Pages / Vercel / Netlify 直接托管就能用。
 *   #/                      首页（文章列表）
 *   #/tag/随笔              按标签筛选
 *   #/page/2                第 2 页
 *   #/tag/随笔/page/2       组合使用
 *   #/post/文章id           文章详情页
 * 访客全程只读，没有任何登录/注册入口。
 * ========================================================================= */
(function () {
  'use strict';

  var CFG = window.BlogConfig;
  var app = document.getElementById('app');
  var data = null;          // Store 里返回的数据快照
  var searchText = '';      // 搜索关键词（不进路由，实时过滤）

  /* =========================================================
   * 一、初始化
   * ========================================================= */
  function init() {
    Store.load().then(function (d) {
      data = d;
      applySiteInfo();
      window.addEventListener('hashchange', render);
      render();
    }).catch(function (err) {
      app.innerHTML = '<div class="empty-box">数据加载失败：' + Markdown.escapeHtml(err.message) + '</div>';
    });
  }

  /** 把站点信息（标题、简介、头像、外链）套用到页头页脚 */
  function applySiteInfo() {
    var site = data.site;
    document.title = site.title + ' · ' + site.tagline;
    document.querySelector('meta[name="description"]').setAttribute('content', site.bio.replace(/\n/g, ' ').slice(0, 120));

    document.getElementById('brandTitle').textContent = site.title;
    document.getElementById('brandTagline').textContent = site.tagline;
    document.getElementById('footerTitle').textContent = site.title;
    document.getElementById('brandLogo').textContent = site.title.trim().charAt(0) || '日';
    document.getElementById('year').textContent = new Date().getFullYear();

    // 头像：填了图片地址就用图片，没填就用首字母色块
    var logo = document.getElementById('brandLogo');
    if (site.avatar) {
      logo.style.backgroundImage = 'url("' + site.avatar + '")';
      logo.style.backgroundSize = 'cover';
      logo.textContent = '';
    }

    // 页头友情链接
    var nav = document.getElementById('navLinks');
    (site.links || []).forEach(function (l) {
      var a = document.createElement('a');
      a.href = l.url;
      a.textContent = l.name;
      a.target = '_blank';
      a.rel = 'noopener';
      nav.appendChild(a);
    });

    if (!CFG.ENABLE_ADMIN_LINK) document.getElementById('footerAdmin').style.display = 'none';
  }

  /* =========================================================
   * 二、路由解析
   * ========================================================= */
  function parseHash() {
    var raw = location.hash.replace(/^#\/?/, '');       // 去掉开头的 #/
    var seg = raw.split('/').filter(Boolean).map(decodeURIComponent);

    if (seg[0] === 'post' && seg[1]) return { view: 'post', id: seg[1] };
    if (seg[0] === 'tag') return { view: 'home', tag: seg[1] || '', page: seg[3] ? parseInt(seg[3], 10) : 1 };
    if (seg[0] === 'page') return { view: 'home', tag: '', page: parseInt(seg[1], 10) || 1 };
    return { view: 'home', tag: '', page: 1 };
  }

  function render() {
    var route = parseHash();
    if (route.view === 'post') renderPost(route.id);
    else renderHome(route);
    window.scrollTo(0, 0);
  }

  /* =========================================================
   * 三、工具
   * ========================================================= */
  var esc = Markdown.escapeHtml;

  /** 2026-10-16 → 2026年10月16日 */
  function fmtDate(s) {
    var p = String(s || '').split('-');
    if (p.length < 3) return s || '';
    return p[0] + '年' + parseInt(p[1], 10) + '月' + parseInt(p[2], 10) + '日';
  }

  /** 粗略估算阅读时长（按每分钟 400 字） */
  function readMinutes(md) {
    return Math.max(1, Math.round(Markdown.plain(md).length / 400)) + ' 分钟';
  }

  /* =========================================================
   * 四、首页：个人简介 + 标签筛选 + 搜索 + 文章列表 + 分页
   * ========================================================= */
  function renderHome(route) {
    var site = data.site;
    var all = Store.listPosts();

    // 1) 标签筛选
    var filtered = route.tag ? all.filter(function (p) {
      return (p.tags || []).indexOf(route.tag) > -1;
    }) : all;

    // 2) 关键词搜索（标题 + 摘要 + 正文）
    if (searchText) {
      var kw = searchText.toLowerCase();
      filtered = filtered.filter(function (p) {
        return (p.title + ' ' + p.summary + ' ' + p.content).toLowerCase().indexOf(kw) > -1;
      });
    }

    // 3) 分页
    var pageSize = CFG.PAGE_SIZE;
    var totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    var page = Math.min(route.page, totalPages);
    var pagePosts = filtered.slice((page - 1) * pageSize, page * pageSize);

    var html = '';

    /* ---- 个人简介卡片 ---- */
    html += '<section class="profile-card">' +
      '<div class="profile-avatar">' +
        (site.avatar ? '<img src="' + esc(site.avatar) + '" alt="头像">'
                     : '<span>' + esc((site.title || '博').trim().charAt(0)) + '</span>') +
      '</div>' +
      '<div class="profile-body">' +
        '<h1 class="profile-name">' + esc(site.title) + '</h1>' +
        '<p class="profile-tagline">' + esc(site.tagline) + '</p>' +
        '<p class="profile-bio">' + esc(site.bio).replace(/\n/g, '<br>') + '</p>' +
        '<div class="profile-meta">' +
          '<span>共 ' + all.length + ' 篇内容</span>' +
          '<span>更新于 ' + fmtDate(all.length ? all[0].date : Store.today()) + '</span>' +
        '</div>' +
        linksHtml(site.links) +
      '</div>' +
    '</section>';

    /* ---- 标签栏 + 搜索框 ---- */
    var tags = Store.allTags();
    html += '<section class="toolbar">' +
      '<div class="tag-row">' +
        '<a class="tag-chip' + (route.tag ? '' : ' active') + '" href="#/">全部</a>' +
        tags.map(function (t) {
          return '<a class="tag-chip' + (route.tag === t.name ? ' active' : '') +
                 '" href="#/tag/' + encodeURIComponent(t.name) + '">' + esc(t.name) +
                 '<i>' + t.count + '</i></a>';
        }).join('') +
      '</div>' +
      '<div class="search-box">' +
        '<input id="searchInput" type="search" placeholder="搜索标题或正文…" value="' + esc(searchText) + '">' +
      '</div>' +
    '</section>';

    /* ---- 文章列表 ---- */
    if (!pagePosts.length) {
      html += '<div class="empty-box">没有找到相关内容，换个关键词试试 🌱</div>';
    } else {
      html += '<section class="post-list">' + pagePosts.map(cardHtml).join('') + '</section>';
    }

    /* ---- 分页器 ---- */
    html += pagerHtml(page, totalPages, route.tag);

    app.innerHTML = html;

    // 绑定搜索框：输入时即时过滤（不刷新页面）
    var input = document.getElementById('searchInput');
    input.addEventListener('input', function () {
      searchText = this.value.trim();
      renderHome(route);
      // 重新聚焦并让光标停在末尾，避免输入时失焦
      var el = document.getElementById('searchInput');
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    });
  }

  /** 站点外链 */
  function linksHtml(links) {
    if (!links || !links.length) return '';
    return '<div class="profile-links">' + links.map(function (l) {
      return '<a href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(l.name) + '</a>';
    }).join('') + '</div>';
  }

  /** 单篇文章卡片 */
  function cardHtml(p) {
    return '' +
      '<a class="post-card" href="#/post/' + encodeURIComponent(p.id) + '">' +
        (p.cover ? '<div class="post-cover"><img src="' + esc(p.cover) + '" alt="" loading="lazy"></div>' : '') +
        '<div class="post-main">' +
          '<div class="post-meta">' + fmtDate(p.date) + ' · 约 ' + readMinutes(p.content) + '</div>' +
          '<h2 class="post-title">' + esc(p.title) + '</h2>' +
          '<p class="post-summary">' + esc(p.summary || Markdown.plain(p.content, 100)) + '</p>' +
          '<div class="post-tags">' + (p.tags || []).map(function (t) {
            return '<span class="tag-mini">#' + esc(t) + '</span>';
          }).join('') + '</div>' +
        '</div>' +
      '</a>';
  }

  /** 分页器（保留标签筛选状态） */
  function pagerHtml(page, totalPages, tag) {
    if (totalPages <= 1) return '';
    function url(n) {
      return tag ? '#/tag/' + encodeURIComponent(tag) + '/page/' + n : '#/page/' + n;
    }
    var html = '<nav class="pager">';
    html += '<a class="pager-btn' + (page > 1 ? '' : ' disabled') + '" href="' + (page > 1 ? url(page - 1) : 'javascript:void(0)') + '">‹ 上一页</a>';
    html += '<span class="pager-info">' + page + ' / ' + totalPages + '</span>';
    html += '<a class="pager-btn' + (page < totalPages ? '' : ' disabled') + '" href="' + (page < totalPages ? url(page + 1) : 'javascript:void(0)') + '">下一页 ›</a>';
    return html + '</nav>';
  }

  /* =========================================================
   * 五、文章详情页：Markdown 渲染 + 上一篇/下一篇
   * ========================================================= */
  function renderPost(id) {
    var post = Store.getPost(id);
    if (!post) {
      app.innerHTML = '<div class="empty-box">这篇文章不存在或已被删除。<br><br><a class="btn" href="#/">返回首页</a></div>';
      return;
    }

    var all = Store.listPosts();
    var idx = all.map(function (p) { return String(p.id); }).indexOf(String(id));
    var prev = all[idx - 1];   // 更新的那一篇
    var next = all[idx + 1];   // 更早的那一篇

    document.title = post.title + ' · ' + data.site.title;

    var html = '' +
      '<article class="post-detail">' +
        '<a class="back-link" href="#/">‹ 返回列表</a>' +
        '<h1 class="detail-title">' + esc(post.title) + '</h1>' +
        '<div class="detail-meta">' +
          '<span>' + fmtDate(post.date) + '</span>' +
          '<span>约 ' + readMinutes(post.content) + '</span>' +
          (post.tags || []).map(function (t) {
            return '<a class="tag-mini" href="#/tag/' + encodeURIComponent(t) + '">#' + esc(t) + '</a>';
          }).join('') +
        '</div>' +
        (post.cover ? '<div class="detail-cover"><img src="' + esc(post.cover) + '" alt=""></div>' : '') +
        // 正文中所有的 HTML 都由 Markdown 渲染器转义后再生成，安全可靠
        '<div class="markdown-body">' + Markdown.render(post.content) + '</div>' +
      '</article>' +
      '<nav class="post-nav">' +
        (next ? '<a href="#/post/' + encodeURIComponent(next.id) + '"><small>上一篇</small>' + esc(next.title) + '</a>' : '<span></span>') +
        (prev ? '<a href="#/post/' + encodeURIComponent(prev.id) + '"><small>下一篇</small>' + esc(prev.title) + '</a>' : '<span></span>') +
      '</nav>';

    app.innerHTML = html;
  }

  init();
})();
