/* 自动生成：内容与 data/posts.json 完全一致，用于 file:// 直接双击打开时的兜底读取。
 * 更新内容后请保持两个文件同步：后台导出 JSON 时会同时给出 posts.js。 */
window.SEED_DATA = {
  "updatedAt": 1792000000000,
  "site": {
    "title": "阿泽的个人博客",
    "tagline": "记录生活 · 沉淀技术",
    "bio": "你好，我是阿泽，一名前端工程师。\n这个站点用来记录我的学习笔记、读书感悟和生活碎片。\n内容全部由我一人维护，欢迎安静地阅读。",
    "avatar": "",
    "links": [
      {
        "name": "GitHub",
        "url": "https://github.com/"
      },
      {
        "name": "邮箱",
        "url": "mailto:hello@example.com"
      }
    ]
  },
  "posts": [
    {
      "id": "1760000000001",
      "title": "你好，世界：这个博客是怎么搭起来的",
      "summary": "一个纯静态、不依赖后端与数据库的个人博客：HTML + CSS + 原生 JS，文章数据放在一个 JSON 文件里。",
      "content": "这是本博客的第一篇文章，简单聊聊它的实现思路。\n\n## 设计目标\n\n1. **访客免登录**：任何人打开就能看，没有注册、没有登录框。\n2. **站长可编辑**：访问 `/admin` 输入密码后进入编辑面板。\n3. **零后端**：没有数据库、没有服务器，直接托管到 GitHub Pages。\n\n## 内容是怎么存放的\n\n所有文章都放在一个 JSON 文件里，结构大致如下：\n\n```json\n{\n  \"posts\": [\n    { \"title\": \"文章标题\", \"date\": \"2026-10-16\", \"tags\": [\"技术\"], \"content\": \"Markdown 正文\" }\n  ]\n}\n```\n\n> 在后台写完文章后，点【导出 JSON】，把得到的文件覆盖仓库里的 `data/posts.json` 再推送上去，\n> 全世界就能看到最新内容了。\n\n## 支持哪些 Markdown\n\n- 标题、粗体 **粗体**、斜体 *斜体*、删除线 ~~删除线~~\n- 列表、引用、分割线\n- `行内代码` 与代码块\n- 图片、链接、表格\n\n也可以插入一张图片看看效果：\n\n![示例图片](https://picsum.photos/seed/blog/800/320)\n\n---\n\n如果你也想搭一个，直接把这套代码复制到自己的仓库即可，改 `data/posts.json` 就能改内容。",
      "cover": "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='360'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%234f46e5'/%3E%3Cstop offset='1' stop-color='%230ea5e9'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='360' fill='url(%23g)'/%3E%3Ctext x='48' y='200' font-size='52' fill='white' font-family='sans-serif'%3EHello%20Blog%3C/text%3E%3C/svg%3E",
      "tags": [
        "公告",
        "技术"
      ],
      "date": "2026-10-16",
      "updatedAt": 1792000000000
    },
    {
      "id": "1760000000002",
      "title": "Markdown 语法速查表",
      "summary": "写文章时忘了语法？这一篇就够了，标题、列表、代码、表格、图片全都有示例。",
      "content": "写博客最常用的就是 Markdown，这里放一份速查表，随时回来抄。\n\n## 一、标题\n\n```markdown\n# 一级标题\n## 二级标题\n### 三级标题\n```\n\n## 二、强调\n\n| 语法 | 效果 | 快捷键 |\n| --- | --- | --- |\n| `**粗体**` | **粗体** | Ctrl + B |\n| `*斜体*` | *斜体* | Ctrl + I |\n| `~~删除线~~` | ~~删除线~~ | 无 |\n\n## 三、列表\n\n- 无序列表第一项\n- 无序列表第二项\n  - 嵌套的子项\n\n1. 有序列表第一项\n2. 有序列表第二项\n\n## 四、链接与图片\n\n- 行内锚文本：[我的 GitHub](https://github.com/)\n- 图片：`![图片说明](图片地址)`\n\n## 五、代码块\n\n```javascript\nfunction sum(a, b) {\n  return a + b;\n}\nconsole.log(sum(1, 2)); // 3\n```\n\n## 六、引用\n\n> 把一件事做到极致，胜过把一万件事做到平庸。\n\n## 七、分割线\n\n三个连续的减号即可：\n\n---\n\n以上，够用了。",
      "cover": "",
      "tags": [
        "技术",
        "工具"
      ],
      "date": "2026-10-10",
      "updatedAt": 1791500000000
    },
    {
      "id": "1760000000003",
      "title": "周末徒步：山里没有信号的三小时",
      "summary": "把手机调成飞行模式，沿着溪谷走了十一公里，回来时发现焦虑少了一半。",
      "content": "周六早上六点半出门，天刚蒙蒙亮。\n\n## 出发\n\n背包里只有三样东西：\n\n1. 两瓶水\n2. 一袋坚果\n3. 一本没看完的书\n\n山门口的雾还没散，石板路湿漉漉的，鞋底踩上去有细碎的声响。\n\n## 在路上\n\n> 人一旦离开了提醒事项和消息通知，脑子会安静得让人意外。\n\n走到半山腰遇到一只橘猫，它蹲在石头上看我，毫无戒心。我们僵持了大概十秒，它转身走了。\n\n## 回来以后\n\n- 步数：约 16000 步\n- 距离：约 11 公里\n- 心情：**很好**\n\n下次打算带上帐篷，在山脊上看一次日落。",
      "cover": "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='360'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%230f766e'/%3E%3Cstop offset='1' stop-color='%2384cc16'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='360' fill='url(%23g)'/%3E%3Ctext x='48' y='200' font-size='52' fill='white' font-family='sans-serif'%3EWeekend%20Hike%3C/text%3E%3C/svg%3E",
      "tags": [
        "生活",
        "随笔"
      ],
      "date": "2026-10-05",
      "updatedAt": 1791000000000
    },
    {
      "id": "1760000000004",
      "title": "2026 年读过的好书清单",
      "summary": "今年读过的书不多，但有几本值得反复翻。列个清单，年底再回来看一次。",
      "content": "今年立的 flag 是「少买书、多读书」，勉强完成了一半。\n\n## 技术类\n\n- **《JavaScript 高级程序设计》** —— 第四次重读，每次都有新收获\n- **《重构》** —— 适合在写完一坨代码之后羞愧地翻开\n\n## 非技术类\n\n- **《置身事内》** —— 理解身边经济的运行逻辑\n- **《人类简史》** —— 视角宏大，适合睡前慢慢读\n\n## 一点方法\n\n1. 读完一页就用自己的话复述一遍\n2. 每本书只记三条最重要的收获\n3. 读完立刻写 200 字短评\n\n> 书读完之后能想起来的，才是真正属于你的部分。",
      "cover": "",
      "tags": [
        "生活",
        "阅读"
      ],
      "date": "2026-09-20",
      "updatedAt": 1789000000000
    }
  ]
};
