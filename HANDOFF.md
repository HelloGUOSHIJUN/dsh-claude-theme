# dsh-claude-theme 项目交接说明

> 最后更新：2026-11-29
> 仓库：https://github.com/HelloGUOSHIJUN/dsh-claude-theme
> 本地：`~/Desktop/DeepSeek Harness/dsh-claude-theme`

---

## 这是什么

给 DeepSeek Harness 的 Web 界面换一套 Claude 风格的皮肤。

目标用户是中国 DSH 用户。国外用户本来就在用 Claude，不需要这个主题，所以文档只有中文。插件页另有一份英文标题与简介（`locale/en.json`），正文仍是中文。

---

## 当前状态

| 项目 | 状态 |
|---|---|
| GitHub 仓库 | ✅ 已推送，main 分支 |
| 当前版本 | ✅ **1.3.1**（`package.json` 是唯一版本源） |
| 版本 tag | ✅ `v1.3.1`（可用 tag：v1.0.0 / v1.1.3 / v1.1.4 / v1.2.0 / v1.2.1 / v1.3.0 / v1.3.1） |
| GitHub Release | ✅ [v1.3.1](https://github.com/HelloGUOSHIJUN/dsh-claude-theme/releases/tag/v1.3.1) |
| 回归检查 | ✅ 38 组全部通过（组数以 `check.mjs` 输出为准） |
| npm 发布 | ✅ `dsh-theme-claude@1.3.1` — https://www.npmjs.com/package/dsh-theme-claude |
| 插件市场收录 | ✅ 已收录，PR #18259 已合并 |
| GitHub topics | ✅ 10 个（dsh / dsh-plugin / theme / claude 等） |
| 截图 | ✅ 有（空白会话截图，`docs/previews/`） |

---

## 关键文件

| 文件 | 作用 | 注意 |
|---|---|---|
| `scripts/build.mjs` | **唯一源头**（1918 行） | 令牌表 + 组件规则，改这里 |
| `theme.css` | 产物（1805 行） | **自动生成，不要手改** |
| `client.js` | 产物，内嵌 CSS | **自动生成，不要手改** |
| `scripts/check.mjs` | 回归守卫（注册式计数，跑完打印真实组数） | 改完必跑 |
| `README.md` | 中文说明 | 含“界面变化”章节 |
| `CHANGELOG.md` | 中文更新日志 | 已被检查覆盖 |
| `docs/DETAIL.md` | 插件面板详情页 | 中文 |
| `docs/REVIEW-2026-11-28.md` | 对照 open-claude-ui 的审查记录 | 含行号，改产物后要同步 |
| `locale/zh.json`、`locale/en.json` | 插件页标题与简介 | `detail` 指向 DETAIL |
| `NOTICE.md` | 版权商标声明 | **保持英文**（法律文本惯例） |

---

## 日常工作流

```bash
cd ~/Desktop/DeepSeek\ Harness/dsh-claude-theme

# 1. 改主题：编辑 scripts/build.mjs
# 2. 重新生成 + 校验
npm run check

# 3. 在 DSH 里刷新页面（⌘R）看效果
#    因为是 link: 安装，改完刷新就生效，不用重装

# 4. 提交
git add -A && git commit -m "..."
git push origin main
```

---

## 安装方式（给自己或别人）

项目用 `link:` 装在本地 profile 里：

```
~/.dsh/profiles/desktop/package.json
  "dsh-theme-claude": "link:<项目目录的绝对路径>"
```

（实际值就是本地 clone 这个仓库的路径。）

改完源码跑 `build`，刷新页面即可，不需要重装。停用：**插件 → Claude 主题 → 关闭 → 刷新**。

---

## 检查覆盖什么

1. **令牌取值**：亮暗两套关键令牌不能丢；文档引用的取值必须和产物一致。
2. **CDS 时长标尺**：动画时长只能是 60 / 120 / 200 / 300 / 450 ms。
3. **悬停回归**：容器不加悬停背景；嵌套卡片只让最外层响应且不投影；板块行不铺底色；暗色 `_card` 不浮影。
4. **焦点回归**：文本输入框不画焦点环；菜单和列表行不画主题焦点环；选中行保留状态色。
5. **排版**：字号 delta 接线在 `html`；行高由字号推导（倍数 ≥1.45）；三个 base 令牌不写死 px；暗色正文 400。
6. **动效与组件**：骨架屏呼吸 2s 加 90ms 级联、扫光独立；滚动渐隐用 `scroll(self)`；分段控件内缩与容器查询；按压 0.975；菜单无入场动画；模型和权限触发器字重一致；菜单材质由主题色派生；导入按钮同色；文档选区同色；Retina 发丝边按 2x / 3x 降宽。
7. **布局与几何**：任务面板间距；宽表用 `!important` 钉列且不裁横向滚动；代码块 `<pre>` 几何重述带 `!important`；同一选择器不重复声明。
8. **宿主钩子**：组件层依赖的 12 个 `data-*` / 类名主干仍在 bundle 里。

这些守卫都做过负向测试，确认能真抓到问题。

**计数方式**：每个断言前调用 `entry()`（或包在 `guard(() => …)` 里），跑完打印的就是实际执行组数。以前用手写的 `FIXED_GUARDS` 常数累加，文档里的 64 就是这样和实际漂开的。

---

## 踩过的坑

### 1. 容器不能加悬停背景

`[data-step-process]` / `[data-turn-process]` 是**容器**，包 header 和 body。给容器加 `background-color` 会填满整个盒子并溢出圆角，看起来像凸出一块。规则已移除，只在运行时保留圆角给呼吸光晕。

### 2. 嵌套卡片会层层上浮

`[class*='_card']` 是子串匹配，会选中卡片组内部的每个小卡片。裸写 `:hover` 会让每个小块各自上浮投影。加 `:not([class*='_card'] [class*='_card'])` 只让最外层响应。CSS Level 4 的 `:not()` 支持复合选择器，Chromium 88+ 可用。

### 3. 板块元素不要悬停底色

列表行、设置卡片、插件卡片是**板块**，不是控件，本就不该有悬停反馈。1.1.1 和 1.1.2 反复给灰底加圆角、改暖色，方向从一开始就错了。

现在 `_panelEntry` / `_panelRow` / `_newSession` / `_cardContent` 悬停一律 `transparent`，展开卡片的内部盒子也不铺色。开关、按钮、链接自己的悬停保留。选中态 `_panelEntryActive` 用陶土橙，那是状态不是悬停。

### 4. 插件页的类名主干是 _card

插件设置页是 `_cards`（grid）> `_card`（18px 圆角加 `overflow:hidden`）> `_cardContent`（button），不是 `_panelEntry`。1.1.1 按 `_panelEntry` 写的规则从未命中。

查真实类名：CSS-in-JS 模块在 `app.asar` 里，例如 `node_modules/@deepseek-ai/dsh-client-ui-settings-plugin-inventory/lib/client.js`。读出 `const css=\`...\``，哈希前缀（如 `uuMOda_`）之后的主干可作子串匹配。

### 5. 焦点环要按控件区分

全局 `:focus-visible` 会给所有可聚焦元素打 1.5px 陶土橙描边，文本框上看起来像报错。现在只给按钮、链接、标签页这类离散控件画环，文本输入类控件用原生光标和字段边框表达焦点。

菜单和列表行也不画主题焦点环。DSH 在指针移动时把真实焦点移到该行（模型菜单的 `onMouseMove` 调 `focus()`），Chromium 又把它算作 `:focus-visible`，画环就变成跟鼠标走的红框。键盘焦点由宿主的底色表达。

### 6. 字号变量不能定义在读取它的同一个节点上

`--dsh-content-font-size` 要挂在 `html`，不能挂在 `body`。`--dsw-font-markdown-*` 这些排版令牌本身也定义在 `body` 上，并且要读取 `--dsh-content-font-size`。两者在同一个节点会构成自引用循环，浏览器把整组值判成无效，不报错，静默失效。`check.mjs` 有两项守卫盯着这点。

### 7. 改主题后必须硬刷新

Host 下发的插件 bundle 带缓存头 `public, max-age=31536000, immutable`，浏览器把 `client.js` 当作**永不过期、永不改变**的资源。普通刷新和重启 DSH 都没用，旧字节已经在浏览器侧。必须用 `⌘+Shift+R`，或在开发者工具里“清空缓存并硬性重新加载”。

1.1.1 到 1.1.3 那几轮“改了但没变化”都是这个原因。改完先确认新版已生效，再判断样式对不对。

### 8. 停用不等于卸载，停用后必须刷新

别用“卸载”来临时关掉主题。卸载会把插件从 profile 的 `bundles` 列表里删掉，要重新装才能恢复。

正确做法：插件面板里点“停用”，再刷新页面（`⌘R`）。已注入的 CSS 不会自动撤销，不刷新会看起来像停用没生效。

### 9. 插件生效需要三处配置同时齐全

profile（`~/.dsh/profiles/desktop/`）里缺一不可：

| 位置 | 内容 |
|---|---|
| `package.json` → `dependencies` | `"dsh-theme-claude": "link:<项目绝对路径>"` |
| `package.json` → `dsh.profile.bundles` | 数组里要有 `"dsh-theme-claude"` |
| `node_modules/` | 指向项目目录的**符号链接**，不是实体目录 |

改完 `bundles` 必须重启 DSH（`⌘Q` 再打开），热重载不生效。

### 10. 别在界面里安装自己正在开发的插件

在“添加插件”里装 npm 版，会把 `node_modules` 里的符号链接替换成实体目录，之后改源码就不再生效。要测 npm 版请换台机器，或测完改回 `link:`。

### 11. 不要在 build.mjs 的注释里用反引号

整个 CSS 在模板字符串里，注释里的反引号会提前闭合字符串，构建失败。代码里已经没有反引号。

### 12. 改文件名或结构后同步 package.json 的 files 白名单

之前 `scripts/` 漏在 `files` 外，npm 用户拿不到构建脚本。

### 13. 任务面板的两个间距坑（1.1.4 修复）

面板本体在 `@deepseek-ai/dsh-client-ui-conversation/TodoPanel.module.css`：

- `_body` 的 `padding: 6px 12px` 让最后一条任务贴住卡片底边，已改为 `10px / 12px`。
- 包裹它的 dock（`_6DJyyG_dock`）用 `margin: 0 auto calc(0px - var(--dsh-composer-stack-gap) - 3px)`，`--dsh-composer-stack-gap` 是 `6px`，即负 9px，主动把面板拉向输入框。已改为正 `8px`。

选择器要点：面板根节点有稳定钩子 `[data-testid='todo-panel']`，三条规则都锚定它。不要用 `_body` / `_list` / `_item` 裸匹配，这些后缀在整个 UI 里极常见，会波及无关组件。`check.mjs` 有一条守卫盯着裸匹配回归。

### 14. 宽表会被推到正文右边（1.1.5 修复）

宿主 `.X_body .md-table-wide` 的“宽表铺满正文区”规则是运行时注入的模块 CSS，排在主题之后，且没有 `!important`。同一段消息里只要先有一张窄表（无 `md-table-wide`），宽表的 `margin-left: calc(-1 * lead)` 就会把它推到正文中线之后，第一列出画面。单独一张宽表时不复现，复现需要“窄表 + 宽表”同屏。

改法：宽表 wrapper 用 `!important` 钉回正文列（`width/max-width: 100%`、去内边距和负边距），单元格恢复 16px 左右内边距并允许任意换行；外框画在 `<table>` 上，竖线交给单元格画。

不要再试给 wrapper 加“滚动阴影 + 常驻滚动条”的渐变背景。为了左对齐去掉了 wrapper 的横向内边距后，滚动的内层盒子正好盖住 5px 滚动条槽位，阴影和滚动条都画不出来；把 `padding-bottom` 加到 16px 又会把表格下方撑开一大块空白。

### 15. 复查同类 bug 的方法

“宽表偏到右边”的根因是**类名子串匹配 + 宿主规则后注入**。按这两条把整个主题重新过一遍：

1. 从 `app.asar` 里抓 `Name_hash_N` 形式的类名全表，看每个 `[class*='_stem']` 实际会命中谁。`_chip` 命中 `refChip` / `slashChip`，无首下划线的 `[class*='_dot']` 命中 `_step_1i3xo_97`，把完成勾缩成 6px 小点。短模式串必须扫全表，不能靠“应该不会撞”。
2. 注意 `display: contents` 的盒子。宿主代码块的 `_content` 是 `contents`，外层 `overflow:hidden` 裁掉的是 `<pre>` 的圆角。加边框或裁切之前先想清楚盒子到底是谁。
3. 同一选择器的规则写两遍会被后一条重置。`check.mjs` 会扫“同一选择器基态重复声明”。
4. 复现统一用 `chrome-mac-arm64/Google Chrome for Testing.app` 的 `--headless=new`。`chrome-headless-shell` 对层叠的渲染和真窗口不一致。改前取 `git show HEAD:client.js` 内嵌的 CSS，改后取 `theme.css`，同一份宿主结构页各截一张。

### 16. :where() 加后注入会让主题的普通规则必输（1.1.7 修复）

宿主的代码块把 `<pre>` 规则包在 `:where()` 里，权重压到 0,1,0。主题的 0,2,0 看似能赢，但模块 CSS 是运行时追加到 `<head>` 末尾的，源序更晚时同权重也会反过来赢。

所以凡是宿主用 `:where()` 包了一层的选择器，主题要覆盖就必须同时满足一条：权重更高、带 `!important`，或确认宿主那条确实更早注入。代码块标题条的 `box-sizing`、`<pre>` 的 padding 和圆角都是这样丢的。

排查时把宿主 CSS 放进一段 `<script type="text/plain">`，由脚本在主题之后 `document.head.appendChild` 插入，才和真实注入顺序一致。直接写在同一个 `<style>` 里是假阳性。

---

## 有意为之的设计（不是 bug）

这些是作者主动选择，不要当成问题修掉：

- **全局衬线字体（宋体）**：`theme.css` 里 `Noto Serif SC / Songti SC` 字体栈。
- **正文 17px 起步**：在 17px 基线上叠加**设置 → 外观**的字号偏好。声明必须在 `html` 上（见坑 6），且必须带 `--dsh-content-font-delta` 接线。
- **品牌字标行隐藏**：`[class*='_logoRow'] { display:none }`。
- **输入框状态行隐藏**：`[data-composer-stat] { display:none }`。
- **视图标签变 999px 胶囊**。
- **消息操作 tooltip 上翻**。
- **卡片悬停**：亮暗都不上浮、不投影；`_cards` 这类板块容器更不该响应。

---

## 配色对照（CDS 官方值）

| 用途 | 亮色 | 暗色 |
|---|---|---|
| 画布 | `#faf9f5` | `#151515` |
| 侧栏 | `#f0eee6` | `#0b0b0b` |
| 卡片 | `#ffffff` | `#1a1a19`–`#20201f` |
| 浮层 | 无 | `#262624` |
| 主文字 | `#0b0b0b` | `#f0efec` |
| 次文字 | `#52514e` | `#c3c2b7` |
| 弱文字 | `#898781` | `#898781` |
| 陶土橙（焦点环、强调元素） | `#c6613f` | `#d97757` |
| 链接 / 文件链接 | `#c6613f` | `#e0895f` |
| 选区 | `#c6613f` 22% | `#d97757` 30% |

来源：[open-claude-ui](https://github.com/Caho1/open-claude-ui)（MIT）v4 取证报告。

**注意**：`--cds-clay-emphasized` 官方是 `#c6613f`，早期文档写的 `#cc5a36` 是错的。

---

## npm 发布

**已发布：`dsh-theme-claude@1.3.1`**。历史版本见 npm versions 列表，本地 tag：v1.0.0 / v1.1.3 / v1.1.4 / v1.2.0 / v1.2.1 / v1.3.0 / v1.3.1。

https://www.npmjs.com/package/dsh-theme-claude

安装：`dsh plugin add dsh-theme-claude`

### 为什么用这个包名

起初叫 `dsh-claude-theme`，但 npm 上已被占用。查证后发现 `dsh-claude-theme`、`dsh-claude-style`、`dsh-claude-skin` 三个都已被占，最终用 `dsh-theme-claude`。

GitHub 仓库名仍是 `dsh-claude-theme`，两者可以不同。

### 发布时遇到的坎

1. npm 账号必须开 2FA（`auth-and-writes`），否则 `npm publish` 报 403。发布时需要在浏览器确认；手机验证器不可用时，可以用恢复码代替一次性验证码。
2. npmjs.com 网页会被 Cloudflare 拦（403），`registry.npmjs.org` 正常。登录时可能需要换网络。
3. 发布后 registry 约 1 分钟才显示新版本。首次发布出现过 `0.0.0-stage` 占位版本，属正常。

### 以后发新版本

```bash
cd ~/Desktop/DeepSeek\ Harness/dsh-claude-theme
# 改 package.json、CHANGELOG、RELEASE_NOTES 和文档
npm run check
git add -A && git commit -m "chore: 发布 x.y.z"
git tag -a vx.y.z -m "dsh-theme-claude x.y.z"
git push origin main && git push origin vx.y.z
npm publish          # 需要浏览器确认 2FA
```

只改文档也要发新版本，npm 页面和 tarball 才会更新。

---

## 网络注意

- 直连 GitHub 超时，git 已配置代理 `http://127.0.0.1:7890`。
- 推送需要 token，已存在 macOS 钥匙串。
- 当前 token 权限：`repo` 加 `workflow`。

---

## 还没做的

- **CDS 3.0 完整还原**：55 项关键帧和 `data-mode` 三态作用域需要 DSH 暴露宿主容器支持，当前做不到，不建议硬追。`@property` 滚动渐隐已经用纯 CSS 落地。

---

## 快速排查

| 现象 | 先看 |
|---|---|
| 样式没生效 | 刷新页面（`⌘R`），或硬刷新（`⌘+Shift+R`） |
| 插件显示“异常” | `engines.dsh >=0.2.2-0` 的 `-0` 后缀不能丢 |
| 某处悬停怪怪的 | 检查是不是容器加了背景，或裸 `:hover` 命中了嵌套元素 |
| 文档和实际不符 | 跑 `npm run check`；版本号以 `package.json` 为准 |
