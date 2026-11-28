# dsh-claude-theme 项目交接说明

> 最后更新：2026-11-29
> 仓库：https://github.com/HelloGUOSHIJUN/dsh-claude-theme
> 本地：`~/Desktop/DeepSeek Harness/dsh-claude-theme`

---

## 这是什么

给 DeepSeek Harness 的 Web 界面换一套 Claude 风格的皮肤。

**目标用户是中国 DSH 用户。** 国外用户本来就在用 Claude，不需要这个主题，所以文档只有中文，不做英文版。

---

## 当前状态：已完成并发布

| 项目 | 状态 |
|---|---|
| GitHub 仓库 | ✅ 已推送，main 分支 |
| 当前版本 | ✅ **1.3.0**（`package.json` 是唯一版本源） |
| 版本 tag | ✅ `v1.3.0`（可用 tag：v1.0.0 / v1.1.3 / v1.1.4 / v1.2.0 / v1.2.1 / v1.3.0） |
| GitHub Release | ✅ 已发布（中文说明） |
| 回归检查 | ✅ 全部守卫通过（组数以 `check.mjs` 输出为准） |
| npm 发布 | ✅ 已发布 `dsh-theme-claude@1.3.0` — https://www.npmjs.com/package/dsh-theme-claude |
| 插件市场收录 | ⏳ PR #18259 待合并 — https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/18259 |
| GitHub topics | ✅ 10 个（dsh / dsh-plugin / theme / claude 等） |
| 截图 | ✅ 有（空白会话截图，`docs/previews/`） |

---

## 关键文件

| 文件 | 作用 | 注意 |
|---|---|---|
| `scripts/build.mjs` | **唯一源头**（1718 行） | 令牌表 + 组件规则，改这里 |
| `theme.css` | 产物（1605 行） | **自动生成，不要手改** |
| `client.js` | 产物，内嵌 CSS | **自动生成，不要手改** |
| `scripts/check.mjs` | 回归守卫（注册式计数，跑完打印真实组数） | 改完必跑 |
| `README.md` | 中文说明 | 含「界面变化」章节 |
| `CHANGELOG.md` | 中文更新日志 | 已被检查覆盖 |
| `docs/DETAIL.md` | 插件面板详情页 | 原本就是中文 |
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
  "dsh-claude-theme": "link:<项目目录的绝对路径>"
```

（实际值就是你本地 clone 这个仓库的路径。）

改完源码跑 `build` → **刷新页面**即可，不需要重装。
停用：**插件 → Claude theme → 关闭 → 刷新**。

---

## 检查覆盖什么（组数以脚本输出为准）

1. **令牌取值** — 亮色/暗色两套关键令牌不能丢
2. **CDS 5 阶时长标尺** — 任何动画时长必须是 60/120/200/300/450ms
3. **文档一致性** — README/DETAIL/CHANGELOG 写的值必须和产物一致
4. **容器悬停回归** — 容器不能加 hover 背景（会溢出圆角）
5. **嵌套卡片回归** — `[class*='_card']:hover` 必须带 `:not()` 守卫，且不得带投影（`:hover` 会命中祖先，`_cards` 容器会整块被点亮）
6. **字号设置回归**（1.1.0 新增）— `--dsh-content-font-size` 必须保留 delta 接线，且不能落在 `body` 上
7. **输入框焦点回归**（1.1.1 新增）— 文本输入类控件不得画焦点环
8. **列表行悬停回归**（1.1.1 新增）— 必须用暖色别名令牌 + 圆角，选中行优先，触屏不保留

9. **任务面板间距** — 面板 body 底部 12px、dock 与输入框正 8px、不得裸匹配 `_body` / `_list` / `_item`
10. **宽表钉列** — 宽表 wrapper 必须带三条 `!important`，且不得裁掉横向滚动
11. **代码块** — `.md-code-block` 不得裁切；`<pre>` 几何重述必须存在且带 `!important`
12. **重复声明** — 同一选择器不得基态重复声明同一属性
13. **宿主钩子漂移** — 组件层依赖的 12 个 `data-*` / 类名主干必须还在 bundle 里
14. **菜单行焦点回归**（1.3.0）— 菜单/列表行不得画主题焦点环，DSH 会把焦点移到指针所在行，画环就变成跟鼠标走的红框
15. **正文行高**（1.3.0）— 行高必须由 `--dsh-content-font-size` 推导（倍数 ≥1.45），三个 base 令牌不得写死 px
16. **骨架屏动效**（1.3.0）— 呼吸 2s `ease-in-out` + 90ms 级联，扫光独立 2s `linear`、105°，只作用于叶子块
17. **滚动渐隐**（1.3.0）— 必须由容器自己的 `scroll(self)` 时间轴驱动两个 `@property` 长度，两端归零；不得退回常驻 mask
18. **分段控件**（1.3.0）— 轨道 1px 内缩，选中态发丝内环（`--claude-ring`）+ 双层投影，暗色单独给值
19. **Retina 发丝边**（1.3.0）— `--claude-ring` 按 2x/3x 降宽；关键盒子用 `::after` 覆盖环（border 会被进位，内阴影会被通栏子元素盖住）
20. **暗色字重**（1.3.0）— 暗色正文 400，代码不继承描边
21. **按压弹簧**（1.3.0）— 全部控件 `--claude-press` 0.975，按下 60ms ease-out，回弹 450ms 弹簧；不得再出现 0.94/0.96/0.985
22. **分段容器查询**（1.3.0）— 标签行 inline-size 容器，254px / 180px 两档压缩；宿主无图标，不隐藏文字
23. **菜单入场**（1.3.0）— 弹出菜单不得有入场动画（`translateY` 会撑大 `scrollHeight` 闪滚动条，淡入又会让前两排闪）；进入态直接显示文字，退场保留
24. **模型/权限一致性**（1.3.0）— 菜单打开即显示文字，无入场动画；模型触发器字重 500，与权限触发器对齐
25. **导入按钮与新建会话同色**（1.3.0）— macOS 宽列导入按钮读 `--dsw-specific-sidebar-glass-fill`；悬停与新会话一样不铺底色，收起成轨道图标时透明
26. **菜单材质**（1.3.0）— `--dsw-menu-surface-fill` 必须从 `--dsw-specific-menu` 派生，不能落回宿主的冷蓝灰默认；宿主默认值也写在 body 上，覆盖要用 `html body` + `!important`
27. **文档预览选区**（1.3.0）— `--dsw-alias-bg-document-selection` 必须跟正文 `::selection` 同一陶土洗色，不能留原生蓝

**这些守卫都做过负向测试**，确认能真抓到问题，不是摆设。

**计数方式**：每个断言前调用 `entry()`（或包在 `guard(() => …)` 里），跑完打印的就是实际执行组数。以前用手写的 `FIXED_GUARDS` 常数累加，文档里的 64 就是这么和实际漂开的。

---

## 踩过的坑（重装/大改时注意）

### 1. 容器不能加悬停背景
`[data-step-process]` / `[data-turn-process]` 是**容器**（包 header + body）。
给容器加 `background-color` 会填满整个盒子并溢出圆角，看起来像"凸出一块"。
**已修复**：移除该规则，只在运行时保留圆角给呼吸光晕。

### 2. 嵌套卡片会层层上浮
`[class*='_card']` 是子串匹配，会选中卡片组内部的每个小卡片。
裸写 `:hover` 会让每个小块各自上浮投影。
**已修复**：加 `:not([class*='_card'] [class*='_card'])` 只让最外层响应。
（CSS Level 4 `:not()` 支持复合选择器，Chromium 88+ 可用）

### 3. 不要在 build.mjs 的注释里用反引号
整个 CSS 在模板字符串里，注释里的 `` ` `` 会提前闭合字符串导致构建失败。
**代码里已经没有反引号了。**

### 4. 改文件名/结构后记得同步 package.json 的 files 白名单
之前 `scripts/` 漏在 `files` 外，导致 npm 用户拿不到构建脚本。

### 5. 停用 ≠ 卸载；停用后必须刷新页面
**别用「卸载」来临时关掉主题。** 卸载会把插件从 profile 的 `bundles` 列表里删掉，
要重新装才能恢复，很麻烦。

正确做法：**插件面板里点「停用」→ 刷新页面（⌘R）**。
已注入的 CSS 不会自动撤销，不刷新会看起来像"停用没生效"。

### 6. 插件生效需要三处配置同时齐全
profile（`~/.dsh/profiles/desktop/`）里缺一不可：

| 位置 | 内容 |
|---|---|
| `package.json` → `dependencies` | `"dsh-theme-claude": "link:<项目绝对路径>"` |
| `package.json` → `dsh.profile.bundles` | 数组里要有 `"dsh-theme-claude"` |
| `node_modules/` | 指向项目目录的**符号链接**（不是实体目录） |

改完 `bundles` **必须重启 DSH**（⌘Q 再打开），热重载不生效。

### 7. 别在界面里安装自己正在开发的插件
在「添加插件」里装 npm 版，会把 `node_modules` 里的符号链接替换成实体目录，
之后改源码就不再生效。要测 npm 版请换台机器，或测完改回 `link:`。

### 14. 任务面板的两个间距坑（1.1.4 修复）
面板本体在 `@deepseek-ai/dsh-client-ui-conversation/TodoPanel.module.css`：
- `_body` 的 `padding: 6px 12px` → 最后一条任务贴住卡片底边。已改为 `10px/12px`。
- 包裹它的 dock（`_6DJyyG_dock`）用 `margin: 0 auto calc(0px - var(--dsh-composer-stack-gap) - 3px)`，
  `--dsh-composer-stack-gap` 是 `6px`，即**负 9px**，主动把面板拉向输入框。已改为正 `8px`。

**选择器要点**：面板根节点有稳定钩子 `[data-testid='todo-panel']`，三条规则都锚定它。
不要用 `_body` / `_list` / `_item` 裸匹配——这些后缀在整个 UI 里极常见，会波及无关组件。
`check.mjs` 里有一条守卫专门盯着"裸匹配回归"。

### 13. 改主题后必须硬刷新，否则改了等于没改（最坑的一条）
Host 下发的插件 bundle 带缓存头 `public, max-age=31536000, immutable`，
浏览器把 `client.js` 当作**永不过期、永不改变**的资源缓存下来。
所以：**普通刷新 `⌘R` 没用，重启 DSH 也没用**——旧字节已经在浏览器侧。

必须用 **`⌘+Shift+R`**（或开发者工具里「清空缓存并硬性重新加载」）。

1.1.1 ~ 1.1.3 那几轮"改了但没变化"全部是这个原因。当时一直在改 CSS 并反复重建，
却从未验证"新代码是否真的执行了"。**教训：改完先确认新版已生效，再判断样式对不对。**

### 11. 板块元素不要悬停底色（1.1.3 最终结论）
**别再想着把列表行 / 设置卡片的悬停灰底"修好看"。** 1.1.1、1.1.2 反复调整它，
方向本身是错的：这些是**板块**，不是控件。

问题有二：
1. 整块在指针下变色，读起来像布局在晃。
2. 插件卡片占满整行时，底色会**溢出卡片边界**——宿主的
   `.uuMOda_card[data-open=true] > .uuMOda_cardContent{background: hover}`
   和 `@media(hover:hover){.uuMOda_cardContent:hover{background: hover}}`
   把底色画在内部 button 上，那个盒子没有外边距，卡片 `overflow` 也管不住。

**正确做法**：`_panelEntry` / `_panelRow` / `_newSession` / `_cardContent` 悬停一律
`transparent`；展开卡片的内部盒子也不铺色。真正的控件（开关/按钮/链接）保留自己的悬停。
**选中态要保留**（`_panelEntryActive` 用陶土橙），那是状态不是悬停。

**教训**：拿到"这里不好看"的反馈时，先问是不是**根本就不该有这个效果**，
不要默认"效果存在，只是不好看"。

### 12. 插件页的类名主干是 _card，不是 _panelEntry
插件设置页的条目是双列 grid 里的卡片：
`_cards`(grid) > `_card`(18px 圆角+overflow:hidden) > `_cardContent`(button)。
1.1.1 按 `_panelEntry` 写规则，从未命中，所以"修了但没变化"。
**查真实类名的办法**：CSS-in-JS 模块在 `app.asar` 里，
`node_modules/@deepseek-ai/dsh-client-ui-settings-plugin-inventory/lib/client.js`，
用 `scripts` 里的 asar 提取思路读出 `const css=\`...\``，哈希前缀（如 `uuMOda_`）之后的主干可作子串匹配。

### 9. 列表行悬停：原生灰底是通栏直角（1.1.1 修复）
插件列表 / 设置项 / 会话行的悬停底色由 DSH 原生提供，是冷灰通栏直角色块。
主题原本只在 `@media (hover: none)` 里清掉它，**鼠标环境完全没管**，于是看起来像贴上去的一条横带。
**已修复**：加暖色别名令牌 + `--dsw-radius-lg`，并用 `:not([class*='_panelEntryActive'])` 让选中行优先。

### 10. `:focus-visible` 一刀切会给输入框画红框（1.1.1 修复）
全局焦点环对被聚焦的文本框打 1.5px 陶土橙描边，观感像报错。
**已修复**：文本输入类控件排除在外，只给按钮/链接/标签页这类离散控件画环；菜单/列表行不画环，改用宿主的焦点底色（见第 14 条守卫）。

### 8. 字号变量不能定义在使用它的同一个节点上（1.1.0 修复）
`--dsh-content-font-size` 要挂在 `html`，不能挂在 `body`。
`--dsw-font-markdown-*` 这些排版令牌本身也定义在 `body` 上，并且要读取
`--dsh-content-font-size`；如果这两者在同一个节点，就构成自引用循环，
浏览器会把整组值判成无效（不报错，静默失效）。`check.mjs` 有两项守卫盯着这点。

---

## 已确认的"有意为之"设计（不是 bug）

这些是作者主动选择，**不要当成问题修掉**：

- **全局衬线字体（宋体）** — `theme.css` 里 `Noto Serif SC / Songti SC` 栈
- **正文 17px 起步** — 在 17px 基线上叠加 **设置 → 外观** 的字号偏好。两者都要保留：
  声明必须在 `html` 上（见下面坑 8），且必须带 `--dsh-content-font-delta` 接线。
- **品牌字标行隐藏** — `[class*='_logoRow'] { display:none }`
- **输入框状态行隐藏** — `[data-composer-stat] { display:none }`
- **视图标签变 999px 胶囊**
- **消息操作 tooltip 上翻**
- **卡片悬停** — 亮暗都不上浮、不投影；`_cards` 这类板块容器更不该响应

---

## 配色对照（CDS 官方值）

| 用途 | 亮色 | 暗色 |
|---|---|---|
| 画布 | `#faf9f5` | `#151515` |
| 侧栏 | `#f0eee6` | `#0b0b0b` |
| 卡片 | `#ffffff` | `#1a1a19`–`#20201f` |
| 浮层 | — | `#262624` |
| 主文字 | `#0b0b0b` | `#f0efec` |
| 次文字 | `#52514e` | `#c3c2b7` |
| 弱文字 | `#898781` | `#898781` |
| 陶土橙（按钮、焦点环） | `#c6613f` | `#d97757` |
| 链接 / 文件链接 | `#c6613f` | `#e0895f` |
| 选区（暖蓝） | `#2a78d6` | `#6da7ec` |

来源：[open-claude-ui](https://github.com/Caho1/open-claude-ui)（MIT）v4 取证报告。
**注意**：`--cds-clay-emphasized` 官方是 `#c6613f`，早期文档写的 `#cc5a36` 是错的。

---

## npm 发布（已完成）

**已发布：`dsh-theme-claude@1.3.0`**（历史版本见 npm versions 列表；本地 tag：v1.0.0 / v1.1.3 / v1.1.4 / v1.2.0 / v1.2.1 / v1.3.0）
https://www.npmjs.com/package/dsh-theme-claude

安装：`dsh plugin add dsh-theme-claude`

### 为什么用这个包名

起初叫 `dsh-claude-theme`，但 npm 上已被占用。查证后发现 `dsh-claude-theme`、`dsh-claude-style`、`dsh-claude-skin` **三个都已被占**，最终用 `dsh-theme-claude`。

GitHub 仓库名仍是 `dsh-claude-theme`，不影响——两者可以不同。

### 发布时遇到的坎

1. **npm 账号必须开 2FA**（`auth-and-writes`），否则 `npm publish` 报 403。开启后发布需要在浏览器授权。
2. **npmjs.com 网页被 Cloudflare 拦（403）**，`registry.npmjs.org` 正常。注册和登录靠浏览器换网络才通。
3. 发布后先出现 `0.0.0-stage` 占位版本，约 60 秒后变成真实版本，属正常。

### 以后发新版本

```bash
cd ~/Desktop/DeepSeek\ Harness/dsh-claude-theme
npm version patch    # 或 minor / major
git push --follow-tags
npm publish          # 需要浏览器授权 2FA
```

---

## 网络注意

- 直连 GitHub 超时，git 已配置代理 `http://127.0.0.1:7890`
- 推送需要 token，已存在 macOS 钥匙串
- 当前 token 权限：`repo` + `workflow`

---

## 还没做的（可选）

- **截图** — 可以用空白会话截图，就没有隐私问题
- **截图** — 可以用空白会话截图，就没有隐私问题
- **插件市场收录** — PR #18259 待合并
- **截图** — 目前只有 `docs/previews/` 里的本地测试页渲染图
- **CDS 3.0 完整还原** — 55 项关键帧、`data-mode` 三态作用域。
  这些需要 DSH 暴露宿主容器支持，**当前做不到，不建议硬追**。
  （`@property` 滚动渐隐已经用纯 CSS 落地，见检查第 17 条。）

---

## 快速排查

| 现象 | 先看 |
|---|---|
| 样式没生效 | 刷新页面（⌘R） |
| 插件显示"异常" | `engines.dsh >=0.2.2-0` 的 `-0` 后缀不能丢 |
| 某处悬停怪怪的 | 检查是不是容器加了背景，或裸 `:hover` 命中了嵌套元素 |
| 文档和实际不符 | 跑 `npm run check`，文档一致性检查会报；版本号也以 `package.json` 为准 |

### 15. 四列以上表格偏到右边被切掉（1.1.5 修复）
**根因**：宿主 `.X_body .md-table-wide` 的「宽表铺满正文区」规则是**运行时注入的模块 CSS**，
排在主题之后，且没有 `!important`。同一段消息里只要先有一张窄表（无 `md-table-wide`），
宽表的 `margin-left: calc(-1 * lead)` 就会把它推到正文中线之后，第一列出画面。
单独一张宽表时不复现——所以别只拿一张表测试，复现需要「窄表 + 宽表」同屏。

**改法**：宽表 wrapper 用 `!important` 钉回正文列（`width/max-width: 100%`、去内边距/负边距），
单元格恢复 16px 左右内边距并允许任意换行；外框画在 `<table>` 上，竖线交给单元格画。

**别再试的**：给 wrapper 加「滚动阴影 + 常驻滚动条」的渐变背景。为了左对齐去掉了 wrapper 的
横向内边距后，滚动的内层盒子正好盖住 5px 滚动条槽位，阴影和滚动条都画不出来；
把 `padding-bottom` 加到 16px 又会把表格下方撑开一大块空白（见 `final-ovf` 那轮的截图）。
验证时用 `chrome-mac-arm64/Google Chrome for Testing.app` 的 `--headless=new` 截图，
`chrome-headless-shell` 对这一组的层叠渲染和真实窗口不一致。

### 16. 复查同类 bug 的方法（1.1.6）
「宽表偏到右边」的根因是**类名子串匹配 + 宿主规则后注入**。按这两条把整个主题重新过了一遍：

1. **枚举宿主真的有哪些类名**：从 `app.asar` 里抓 `Name_hash_N` 形式的类名全表，
   看主题里每个 `[class*='_stem']` 实际会命中谁。`_chip` → `refChip` /
   `slashChip` 就是这样撞上的；`[class*='_dot']`（无首下划线）连 `_step_1i3xo_97` 都命中，
   把完成勾缩成 6px 小点。短模式串必须扫一遍全表，不能靠"应该不会撞"。
2. **`display: contents` 的盒子**：宿主代码块的 `_content` 是 `contents`，外层 `overflow:hidden`
   裁掉的是 `<pre>` 的圆角。给 `display:contents` 的容器加边框/裁切之前先想清楚"盒子到底是谁"。
3. **同一选择器写两遍**：宿主的代码横幅有两条「横幅」规则，后一条把前一条的 `border-bottom` 重置了。
   `check.mjs` 现在会扫"同一选择器基态重复声明"。
4. 复现统一用 `chrome-mac-arm64/Google Chrome for Testing.app` + `--headless=new`（`chrome-headless-shell`
   对层叠的渲染和真窗口不一致），改前取 `git show HEAD:client.js` 里内嵌的 CSS，改后取 `theme.css`，
   同一份宿主结构页各截一张。

### 17. :where() + 后注入 = 主题的普通规则必输（1.1.7）
宿主的代码块把 `<pre>` 规则包在 `:where()` 里，权重压到 0,1,0。看似主题的 0,2,0 能赢，
但模块 CSS 是运行时 append 到 `<head>` 末尾的——源序更晚时，同权重也会反过来赢。
所以凡是「宿主用 :where() 包了一层」的选择器，主题要覆盖就必须**同时**：权重更高、
或者带 `!important`，或者确认宿主那条确实更早注入。代码块标题条的 `box-sizing`、
`<pre>` 的 padding/圆角都是这么丢的。

排查手段：在复现页里把宿主 CSS 放进一段 `<script type="text/plain">`，由脚本在主题之后
`document.head.appendChild` 插入，才和真实注入顺序一致；直接写在一个 `<style>` 里是假阳性。
