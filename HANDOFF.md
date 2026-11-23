# dsh-claude-theme 项目交接说明

> 最后更新：2026-11-24
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
| 版本 tag | ✅ `v1.0.0` |
| GitHub Release | ✅ 已发布（中文说明） |
| 回归检查 | ✅ 40 项全过 |
| npm 发布 | ⬜ 跳过（包名被占，见下） |
| 截图 | ⬜ 无（会暴露真实会话标题） |

---

## 关键文件

| 文件 | 作用 | 注意 |
|---|---|---|
| `scripts/build.mjs` | **唯一源头**（1422 行） | 令牌表 + 组件规则，改这里 |
| `theme.css` | 产物（1316 行） | **自动生成，不要手改** |
| `client.js` | 产物，内嵌 CSS | **自动生成，不要手改** |
| `scripts/check.mjs` | 回归守卫（148 行，40 项） | 改完必跑 |
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

## 40 项检查覆盖什么

1. **令牌取值** — 亮色/暗色两套关键令牌不能丢
2. **CDS 5 阶时长标尺** — 任何动画时长必须是 60/120/200/300/450ms
3. **文档一致性** — README/DETAIL/CHANGELOG 写的值必须和产物一致
4. **容器悬停回归** — 容器不能加 hover 背景（会溢出圆角）
5. **嵌套卡片回归** — `[class*='_card']:hover` 必须带 `:not()` 守卫

**这些守卫都做过负向测试**，确认能真抓到问题，不是摆设。

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

---

## 已确认的"有意为之"设计（不是 bug）

这些是作者主动选择，**不要当成问题修掉**：

- **全局衬线字体（宋体）** — `theme.css` 里 `Noto Serif SC / Songti SC` 栈
- **正文固定 17px** — **设置 → 外观** 的字号调节会失效
- **品牌字标行隐藏** — `[class*='_logoRow'] { display:none }`
- **输入框状态行隐藏** — `[data-composer-stat] { display:none }`
- **视图标签变 999px 胶囊**
- **消息操作 tooltip 上翻**
- **最外层卡片悬停上浮** — 保留，只是排除了嵌套卡片

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
| 陶土橙 | `#c6613f` | `#d97757` |
| 链接蓝 | `#2a78d6` | `#6da7ec` |

来源：[open-claude-ui](https://github.com/Caho1/open-claude-ui)（MIT）v4 取证报告。
**注意**：`--cds-clay-emphasized` 官方是 `#c6613f`，早期文档写的 `#cc5a36` 是错的。

---

## npm 为什么没发

包名 `dsh-claude-theme` 已被他人占用（`jipika`，2026-09-24 发布 0.1.0）。

如果将来要发，需要：
1. 注册 npm 账号并**验证邮箱**（不验证无法发布）
2. 换名，推荐 `@helloguoshijun/dsh-claude-theme`（scope 包，永远不会被抢）
3. `npm login` → `npm publish`

---

## 网络注意

- 直连 GitHub 超时，git 已配置代理 `http://127.0.0.1:7890`
- 推送需要 token，已存在 macOS 钥匙串
- 当前 token 权限：`repo` + `workflow`

---

## 还没做的（可选）

- **截图** — 可以用空白会话截图，就没有隐私问题
- **npm 发布** — 见上
- **CDS 3.0 完整还原** — `@property` 滚动渐隐、55 项关键帧、`data-mode` 三态作用域。
  这些需要 DSH 暴露宿主容器支持，**当前做不到，不建议硬追**。

---

## 快速排查

| 现象 | 先看 |
|---|---|
| 样式没生效 | 刷新页面（⌘R） |
| 插件显示"异常" | `engines.dsh >=0.2.2-0` 的 `-0` 后缀不能丢 |
| 某处悬停怪怪的 | 检查是不是容器加了背景，或裸 `:hover` 命中了嵌套元素 |
| 文档和实际不符 | 跑 `npm run check`，文档一致性检查会报 |
