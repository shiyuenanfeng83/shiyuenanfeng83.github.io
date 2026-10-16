/* =========================================================================
 * admin.js —— 站长后台：登录校验 + 文章增删改 + 图片上传 + 导入导出备份
 * -------------------------------------------------------------------------
 * 说明：
 *   1. 密码只在本地校验，校验方式是比对 sha256 哈希，配置文件里不出现明文密码。
 *   2. 文章内容保存在浏览器 localStorage（单台机器、单人维护足够用）。
 *   3. 想让改动生效到线上：导出 JSON → 覆盖仓库 data/posts.json → 推送 GitHub。
 * ========================================================================= */
(function () {
  'use strict';

  var CFG = window.BlogConfig;
  function $(id) { return document.getElementById(id); }

  /* 页面元素（顺序和 index.html 里的 id 一一对应） */
  var loginView = $('loginView'), adminView = $('adminView');
  var postListEl = $('postList'), postCountEl = $('postCount');
  var titleInput = $('titleInput'), dateInput = $('dateInput');
  var tagsInput = $('tagsInput'), summaryInput = $('summaryInput');
  var coverInput = $('coverInput'), coverPreview = $('coverPreview');
  var contentInput = $('contentInput'), previewBox = $('previewBox');
  var siteInput = {
    title: $('siteTitle'), tagline: $('siteTagline'), bio: $('siteBio'),
    avatar: $('siteAvatar'), links: $('siteLinks')
  };

  var currentId = null;  // 当前正在编辑的文章 id；null 表示新建

  /* =========================================================
   * 一、登录与权限
   * ========================================================= */
  var PWD_KEY = CFG.STORAGE_KEY + ':pwd';   // 站长自己修改后的密码哈希
  var AUTH_TTL = 12 * 60 * 60 * 1000;       // 登录有效期：12 小时

  function acceptedHash() {
    return localStorage.getItem(PWD_KEY) || CFG.DEFAULT_PASSWORD_HASH;
  }

  function readAuth() {
    try { return JSON.parse(localStorage.getItem(CFG.AUTH_KEY) || 'null'); } catch (e) { return null; }
  }

  function isLogged() {
    var a = readAuth();
    return !!(a && Date.now() - a.t < AUTH_TTL);
  }

  $('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var pwd = $('passwordInput').value;
    if (!pwd) { $('loginError').textContent = '请输入密码'; return; }
    if (sha256(pwd) === acceptedHash()) {
      localStorage.setItem(CFG.AUTH_KEY, JSON.stringify({ t: Date.now() }));
      $('loginError').textContent = '';
      start();
    } else {
      $('loginError').textContent = '密码不正确，请重试';
      $('passwordInput').select();
    }
  });

  $('btnLogout').addEventListener('click', function () {
    localStorage.removeItem(CFG.AUTH_KEY);
    adminView.classList.add('hidden');
    loginView.classList.remove('hidden');
    $('passwordInput').value = '';
  });

  /** 修改密码：生成新哈希，提示站长同步到 config.js */
  $('btnPwd').addEventListener('click', function () {
    var p1 = prompt('请输入新的管理密码（至少 6 位）：');
    if (p1 === null) return;
    if (p1.length < 6) { toast('密码太短了，至少需要 6 位'); return; }
    var p2 = prompt('请再输入一次以确认：');
    if (p2 !== p1) { toast('两次输入不一致，未修改'); return; }

    var hash = sha256(p1);
    localStorage.setItem(PWD_KEY, hash);   // 当前浏览器立即生效
    prompt('密码已在本机生效。为保证换设备也生效，请复制下面这行哈希，粘贴到 assets/js/config.js 的 DEFAULT_PASSWORD_HASH：', hash);
    toast('密码修改成功');
  });

  /* =========================================================
   * 二、启动：先过登录，再拉数据
   * ========================================================= */
  function start() {
    loginView.classList.add('hidden');
    adminView.classList.remove('hidden');
    Store.load().then(function () {
      fillSiteForm();
      renderList();
      if (Store.listPosts().length) selectPost(Store.listPosts()[0].id);
      else newPost();
      checkStorageSize();
    });
  }

  if (isLogged()) start();

  /* =========================================================
   * 三、左侧文章列表
   * ========================================================= */
  function renderList() {
    var posts = Store.getState().posts.slice().sort(function (a, b) {
      return String(b.date).localeCompare(String(a.date));
    });

    postCountEl.textContent = '共 ' + posts.length + ' 篇';
    if (!posts.length) {
      postListEl.innerHTML = '<p style="color:var(--color-text-weak);font-size:13px">还没有内容，点右上角【新建文章】开始吧。</p>';
      return;
    }

    postListEl.innerHTML = posts.map(function (p) {
      return '<div class="post-item' + (String(p.id) === String(currentId) ? ' active' : '') +
        '" data-id="' + p.id + '">' +
        '<span class="pi-title">' + Markdown.escapeHtml(p.title) + '</span>' +
        '<span class="pi-meta">' + p.date + ' · ' + (p.tags || []).map(function (t) { return '#' + t; }).join(' ') + '</span>' +
        '</div>';
    }).join('');

    // 点击列表切换正在编辑的文章（未保存会先提示）
    Array.prototype.forEach.call(postListEl.querySelectorAll('.post-item'), function (el) {
      el.addEventListener('click', function () {
        if (dirty() && !confirm('当前文章有未保存的修改，确定要切换吗？')) return;
        selectPost(el.dataset.id);
      });
    });
  }

  /** 表单是否被改动过（简单的脏检查，避免误操作丢失内容） */
  function dirty() {
    if (!currentId) return true;
    var p = Store.getPost(currentId);
    if (!p) return true;
    return p.title !== titleInput.value.trim() ||
           p.content !== contentInput.value ||
           p.date !== dateInput.value;
  }

  /** 把选中文章的内容填进右侧表单 */
  function selectPost(id) {
    var p = Store.getPost(id);
    if (!p) return;
    currentId = p.id;
    titleInput.value = p.title;
    dateInput.value = p.date;
    tagsInput.value = (p.tags || []).join(',');
    summaryInput.value = p.summary || '';
    coverInput.value = p.cover || '';
    contentInput.value = p.content;
    updateCoverPreview();
    switchTab('write');
    renderList();
  }

  /** 清空表单，进入新建状态 */
  function newPost() {
    currentId = null;
    titleInput.value = '';
    dateInput.value = Store.today();
    tagsInput.value = '';
    summaryInput.value = '';
    coverInput.value = '';
    contentInput.value = '';
    coverPreview.classList.add('hidden');
    switchTab('write');
    renderList();
    titleInput.focus();
  }
  $('btnNew').addEventListener('click', function () {
    if (dirty() && !confirm('当前文章有未保存的修改，确定要新建吗？')) return;
    newPost();
  });

  /* =========================================================
   * 四、保存 / 删除
   * ========================================================= */
  $('btnSave').addEventListener('click', function () {
    var title = titleInput.value.trim();
    if (!title) { toast('标题不能为空'); titleInput.focus(); return; }
    if (!dateInput.value) dateInput.value = Store.today();

    var tags = tagsInput.value.split(/[,，]/).map(function (t) { return t.trim(); })
      .filter(function (t, i, arr) { return t && arr.indexOf(t) === i; });  // 去重

    var saved = Store.savePost({
      id: currentId,                    // null 时会自动新建
      title: title,
      date: dateInput.value,
      tags: tags,
      summary: summaryInput.value.trim(),
      cover: coverInput.value.trim(),
      content: contentInput.value
    });

    currentId = saved.id;
    renderList();
    toast('已保存到本机 ✅ 记得【导出 JSON】后上传才能同步到线上');
  });

  $('btnDelete').addEventListener('click', function () {
    if (!currentId) { toast('请先选择一篇文章'); return; }
    var p = Store.getPost(currentId);
    if (!confirm('确定删除《' + p.title + '》吗？此操作不可恢复。')) return;
    Store.deletePost(currentId);
    var rest = Store.getState().posts;
    toast('已删除');
    if (rest.length) selectPost(rest[0].id); else newPost();
  });

  /* =========================================================
   * 五、编辑 / 预览切换与 Markdown 快捷插入
   * ========================================================= */
  Array.prototype.forEach.call(document.querySelectorAll('.tab-btn'), function (btn) {
    btn.addEventListener('click', function () { switchTab(btn.dataset.tab); });
  });

  function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(function (b) {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
    if (tab === 'preview') {
      previewBox.innerHTML = Markdown.render(contentInput.value) || '<p style="color:var(--color-text-weak)">还没有内容…</p>';
      previewBox.classList.remove('hidden');
      contentInput.classList.add('hidden');
    } else {
      contentInput.classList.remove('hidden');
      previewBox.classList.add('hidden');
    }
  }

  /** 在光标处插入文本，并把光标放到中间（如已经选中文字则包裹它） */
  function insertText(before, after, placeholder) {
    var start = contentInput.selectionStart, end = contentInput.selectionEnd;
    var sel = contentInput.value.slice(start, end) || placeholder || '';
    var text = before + sel + after;
    contentInput.setRangeText(text, start, end, 'end');
    // 光标落在插入内容的中间
    var pos = start + before.length + sel.length;
    contentInput.setSelectionRange(pos, pos);
    contentInput.focus();
  }

  // 插入链接：[文字](url)
  $('btnLink').addEventListener('click', function () { insertText('[', '](https://)', '链接文字'); });
  // 插入代码块
  $('btnCode').addEventListener('click', function () {
    insertText('\n```javascript\n', '\n```\n', 'console.log("hello");');
  });

  /* =========================================================
   * 六、图片上传（压缩后转 base64 存进文章里，不需要图床）
   * ========================================================= */
  var imageFile = $('imageFile');

  /** 正文里插入图片 */
  $('btnImage').addEventListener('click', function () {
    imageFile.dataset.target = 'content';
    imageFile.click();
  });

  /** 封面图上传 */
  $('btnCoverUpload').addEventListener('click', function () {
    imageFile.dataset.target = 'cover';
    imageFile.click();
  });

  imageFile.addEventListener('change', function () {
    var files = Array.prototype.slice.call(this.files || []);
    if (!files.length) return;
    var target = this.dataset.target || 'content';

    files.forEach(function (file) {
      compressImage(file, 1400, 0.82, function (dataUrl) {
        if (target === 'cover') {
          coverInput.value = dataUrl;
          updateCoverPreview();
        } else {
          insertText('![', '](' + dataUrl + ')', file.name.replace(/\.\w+$/, ''));
        }
        toast('图片已插入：' + file.name);
      });
    });
    this.value = '';  // 允许重复选同一个文件
  });

  /**
   * 图片压缩：等比缩放到最大宽度 maxWidth，用 JPEG 质量 quality 输出 base64。
   * 目的是避免 localStorage 爆掉（浏览器一般只有 5MB 左右配额）。
   */
  function compressImage(file, maxWidth, quality, callback) {
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        var scale = Math.min(1, maxWidth / img.width);
        var canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        callback(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = function () { toast('图片读取失败'); };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function updateCoverPreview() {
    if (coverInput.value) {
      coverPreview.src = coverInput.value;
      coverPreview.classList.remove('hidden');
    } else {
      coverPreview.classList.add('hidden');
    }
  }
  coverInput.addEventListener('input', updateCoverPreview);

  /* =========================================================
   * 七、备份导出与导入恢复
   * ========================================================= */
  function download(filename, text) {
    var blob = new Blob([text], { type: 'application/json;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  /** 导出 posts.json：拿到这个文件后覆盖仓库里的 data/posts.json 即可更新全站 */
  $('btnExport').addEventListener('click', function () {
    download('posts-' + Store.today().replace(/-/g, '') + '.json', Store.exportJSON());
    toast('已导出 JSON 备份');
  });

  /** 导出 posts.js：内容与 posts.json 相同，用于 file:// 双击打开时的兜底 */
  $('btnExportJs').addEventListener('click', function () {
    download('posts.js', 'window.SEED_DATA = ' + JSON.stringify(Store.getState(), null, 2) + ';\n');
    toast('已导出 posts.js');
  });

  /** 导入 JSON：从备份文件一键恢复全部内容 */
  $('btnImport').addEventListener('click', function () { $('importFile').click(); });
  $('importFile').addEventListener('change', function () {
    var file = this.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var n = Store.importJSON(reader.result);
        renderList();
        newPost();
        toast('已导入 ' + n + ' 篇文章');
      } catch (e) {
        alert('导入失败：' + e.message);
      }
    };
    reader.readAsText(file);
    this.value = '';
  });

  /** 丢弃本机改动，重新以仓库里的 data/posts.json 为准 */
  $('btnSync').addEventListener('click', function () {
    if (!confirm('将放弃本机未导出的修改，重新读取仓库 data/posts.json，确定吗？')) return;
    Store.resetToRemote().then(function () {
      fillSiteForm(); renderList(); newPost();
      toast('已同步为仓库数据');
    });
  });

  /* =========================================================
   * 八、站点设置（首页标题 / 简介 / 头像 / 友链）
   * ========================================================= */
  $('btnSite').addEventListener('click', function () {
    $('sitePanel').classList.toggle('hidden');
  });

  function fillSiteForm() {
    var s = Store.getState().site;
    siteInput.title.value = s.title || '';
    siteInput.tagline.value = s.tagline || '';
    siteInput.bio.value = s.bio || '';
    siteInput.avatar.value = s.avatar || '';
    siteInput.links.value = JSON.stringify(s.links || [], null, 2);
  }

  $('btnSaveSite').addEventListener('click', function () {
    var links = [];
    try {
      var txt = siteInput.links.value.trim();
      links = txt ? JSON.parse(txt) : [];
      if (!Array.isArray(links)) throw new Error('格式应为数组');
    } catch (e) {
      alert('友情链接格式不对，请用 [] 包起来的 JSON，例如：\n[{"name":"GitHub","url":"https://github.com/xxx"}]');
      return;
    }
    Store.saveSite({
      title: siteInput.title.value.trim() || '个人博客',
      tagline: siteInput.tagline.value.trim(),
      bio: siteInput.bio.value,
      avatar: siteInput.avatar.value.trim(),
      links: links
    });
    toast('站点信息已保存');
  });

  /** 头像上传 */
  $('btnAvatarUpload').addEventListener('click', function () { $('avatarFile').click(); });
  $('avatarFile').addEventListener('change', function () {
    var file = this.files[0];
    if (!file) return;
    compressImage(file, 300, 0.85, function (dataUrl) {
      siteInput.avatar.value = dataUrl;
      toast('头像已选择，记得点【保存站点设置】');
    });
    this.value = '';
  });

  /* =========================================================
   * 九、小工具：轻提示 + 存储容量提醒
   * ========================================================= */
  var toastTimer;
  function toast(msg) {
    var el = $('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2600);
  }

  /** localStorage 接近上限时提醒站长导出并清理 */
  function checkStorageSize() {
    try {
      var size = (localStorage.getItem(CFG.STORAGE_KEY) || '').length;
      if (size > 2 * 1024 * 1024) {
        toast('本地数据已超过 2MB，建议导出备份并把图片换成外链');
      }
    } catch (e) { /* 忽略 */ }
  }
})();
