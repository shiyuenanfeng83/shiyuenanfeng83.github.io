/* =========================================================================
 * markdown.js —— 自己写的极简 Markdown 渲染器（零依赖）
 * -------------------------------------------------------------------------
 * 支持语法：
 *   标题 # ~ ######    粗体 **x**    斜体 *x*    删除线 ~~x~~
 *   行内代码 `x`       代码块 ```lang ... ```    引用 >
 *   无序列表 - * +     有序列表 1.              分割线 --- 或 ***
 *   链接 [文字](url)   图片 ![说明](url)         表格 | a | b |
 *   段落（空行分段）
 * 安全策略：先把 HTML 全部转义，再按 Markdown 规则生成标签，
 *          并过滤 javascript: 等危险协议，避免文章内容里注入脚本。
 * ========================================================================= */
(function (global) {
  'use strict';

  /** HTML 转义，防止内容里的尖括号被当成标签执行 */
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /** 过滤危险 URL：图片只放行 http(s)、data:image/ 与相对路径 */
  function safeUrl(url, isImage) {
    var u = String(url || '').trim();
    if (/^https?:\/\//i.test(u)) return u;
    if (/^data:image\//i.test(u) && isImage) return u;
    if (/^mailto:/i.test(u) && !isImage) return u;
    if (/^#/.test(u) && !isImage) return u;
    if (/^[\w./\-?=&%]+$/.test(u)) return u; // 相对路径
    return '#';
  }

  /**
   * 行内语法解析（转义之后的字符串）
   * @param {string} text
   */
  function inline(text) {
    var out = text;

    // 1) 图片 ![alt](src) —— 放在链接前处理，避免被链接规则吃掉
    out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g, function (m, alt, src) {
      return '<img class="md-img" src="' + safeUrl(src, true) + '" alt="' + alt + '" loading="lazy">';
    });

    // 2) 链接 [文字](url)
    out = out.replace(/\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g, function (m, label, href) {
      var url = safeUrl(href, false);
      var external = /^https?:/i.test(url);
      return '<a href="' + url + '"' + (external ? ' target="_blank" rel="noopener"' : '') + '>' + label + '</a>';
    });

    // 3) 粗体 **x** 或 __x__
    out = out.replace(/(\*\*|__)(?=\S)([\s\S]*?\S)\1/g, '<strong>$2</strong>');

    // 4) 斜体 *x* 或 _x_（下划线不会被英文单词内的 _ 误伤）
    out = out.replace(/(^|[^*])\*(?=\S)([^*]*?\S)\*/g, '$1<em>$2</em>');
    out = out.replace(/(^|[^_\w])_(?=\S)([^_]*?\S)_/g, '$1<em>$2</em>');

    // 5) 删除线 ~~x~~
    out = out.replace(/~~(?=\S)([\s\S]*?\S)~~/g, '<del>$1</del>');

    return out;
  }

  /** 把列表项数组渲染成 ul / ol（支持一层嵌套） */
  function renderList(items) {
    if (!items.length) return '';
    var root = { children: [], ordered: false };
    var stack = [{ indent: -1, node: root }];

    items.forEach(function (it) {
      var node = { children: [], text: it.text, ordered: it.ordered };
      // 遇到缩进更小的项，往上回溯到合适的父级
      while (stack.length > 1 && it.indent <= stack[stack.length - 1].indent) stack.pop();
      stack[stack.length - 1].node.children.push(node);
      stack.push({ indent: it.indent, node: node });
    });

    return nodeToHtml(root);
  }

  function nodeToHtml(node) {
    if (!node.children.length) return '';
    var ordered = node.children.some(function (c) { return c.ordered; });
    var tag = ordered ? 'ol' : 'ul';
    var html = '<' + tag + '>';
    node.children.forEach(function (c) {
      html += '<li>' + inline(c.text);
      if (c.children.length) html += nodeToHtml(c);
      html += '</li>';
    });
    return html + '</' + tag + '>';
  }

  /** 渲染表格：第一行表头、第二行分隔线 --- */
  function renderTable(rows) {
    if (rows.length < 2) return '';
    function cells(line) {
      return line.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map(function (c) { return c.trim(); });
    }
    var head = cells(rows[0]);
    var html = '<div class="md-table-wrap"><table><thead><tr>';
    head.forEach(function (c) { html += '<th>' + inline(c) + '</th>'; });
    html += '</tr></thead><tbody>';
    for (var i = 2; i < rows.length; i++) {
      var tds = cells(rows[i]);
      html += '<tr>';
      head.forEach(function (_, idx) { html += '<td>' + inline(tds[idx] || '') + '</td>'; });
      html += '</tr>';
    }
    return html + '</tbody></table></div>';
  }

  /** 渲染 Markdown 全文 */
  function render(src) {
    if (!src) return '';
    var codeBlocks = [];   // 抽取出来的代码块
    var inlineCodes = [];  // 抽取出来的行内代码

    var text = String(src).replace(/\r\n?/g, '\n');

    // ---- 第一步：先抽走代码块（占位符不含 HTML 特殊字符，转义后依然安全） ----
    text = text.replace(/```([\w+-]*)[ \t]*\n?([\s\S]*?)```/g, function (m, lang, code) {
      var html = '<pre class="md-code"' + (lang ? ' data-lang="' + escapeHtml(lang) + '"' : '') +
                 '><code>' + escapeHtml(code.replace(/\n$/, '')) + '</code></pre>';
      codeBlocks.push(html);
      return '\u0000CB' + (codeBlocks.length - 1) + '\u0000';
    });

    // ---- 第二步：整体 HTML 转义，杜绝 XSS ----
    text = escapeHtml(text);

    // ---- 第三步：抽走行内代码，避免内部的 * _ 被当成强调语法 ----
    text = text.replace(/(`+)([\s\S]*?)\1/g, function (m, ticks, code) {
      inlineCodes.push('<code class="md-inline">' + code.trim() + '</code>');
      return '\u0000IC' + (inlineCodes.length - 1) + '\u0000';
    });

    var lines = text.split('\n');
    var html = '';
    var para = [];      // 正在攒的段落
    var list = [];      // 正在攒的列表
    var quote = [];     // 正在攒的引用
    var table = [];     // 正在攒的表格

    function flushPara() {
      if (para.length) { html += '<p>' + inline(para.join('<br>')) + '</p>'; para = []; }
    }
    function flushList() {
      if (list.length) { html += renderList(list); list = []; }
    }
    function flushQuote() {
      if (quote.length) { html += '<blockquote>' + render(quote.join('\n')) + '</blockquote>'; quote = []; }
    }
    function flushTable() {
      if (table.length) { html += renderTable(table); table = []; }
    }
    function flushAll() { flushPara(); flushList(); flushQuote(); flushTable(); }

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var trimmed = line.trim();

      // 空行：当前所有区块结束
      if (!trimmed) { flushAll(); continue; }

      // 代码块占位符独占一行时，直接输出
      if (/^\u0000CB\d+\u0000$/.test(trimmed)) { flushAll(); html += trimmed; continue; }

      // 引用 >
      if (/^&gt;\s?/.test(trimmed)) {
        flushPara(); flushList(); flushTable();
        quote.push(trimmed.replace(/^&gt;\s?/, ''));
        continue;
      }

      // 标题 # （注意 < > 已被转义为 &lt; &gt;）
      var h = /^(#{1,6})\s+(.*)$/.exec(trimmed);
      if (h) {
        flushAll();
        var level = Math.min(h[1].length, 6);
        html += '<h' + level + ' id="h-' + i + '">' + inline(h[2]) + '</h' + level + '>';
        continue;
      }

      // 分割线 --- 或 ***
      if (/^(\*\s*){3,}$/.test(trimmed) || /^(-\s*){3,}$/.test(trimmed) || /^(_\s*){3,}$/.test(trimmed)) {
        flushAll(); html += '<hr>'; continue;
      }

      // 表格分隔行：判断当前行是否为 |---|，是的话把上一行当作表头
      if (/^\|?[\s:\-|]+\|[\s:\-|]*$/.test(trimmed) && trimmed.indexOf('-') > -1 && i > 0) {
        // 上一行在上一轮循环里已被当作普通段落塞进 para，这里取出来当表头，避免重复输出
        var headLine = lines[i - 1].trim();
        if (para.length && para[para.length - 1] === headLine) para.pop();
        flushAll();
        table.push(headLine, trimmed);
        continue;
      }
      if (table.length && /\|/.test(trimmed)) { table.push(trimmed); continue; }
      if (table.length) flushTable();

      // 列表 - * + 或 1.
      var ul = /^([ \t]*)([-*+])\s+(.*)$/.exec(line);
      var ol = /^([ \t]*)(\d+)[.)]\s+(.*)$/.exec(line);
      if (ul || ol) {
        flushPara(); flushQuote();
        var item = ul ? { indent: ul[1].replace(/\t/g, '  ').length, ordered: false, text: ul[3] }
                      : { indent: ol[1].replace(/\t/g, '  ').length, ordered: true, text: ol[3] };
        list.push(item);
        continue;
      }

      flushList(); flushQuote();
      para.push(trimmed);
    }
    flushAll();

    // ---- 第四步：把占位符还原成真正的代码块 / 行内代码 ----
    html = html.replace(/\u0000CB(\d+)\u0000/g, function (m, idx) { return codeBlocks[idx]; });
    html = html.replace(/\u0000IC(\d+)\u0000/g, function (m, idx) { return inlineCodes[idx]; });

    return html;
  }

  /** 生成文章摘要：去掉 Markdown 标记，截取前 n 个字 */
  function plain(src, n) {
    var s = String(src || '')
      .replace(/```[\s\S]*?```/g, '')     // 代码块
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // 图片
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/[#>*`~\-_]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return n ? s.slice(0, n) + (s.length > n ? '…' : '') : s;
  }

  global.Markdown = { render: render, plain: plain, escapeHtml: escapeHtml };
})(window);
