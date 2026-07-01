# WLKT Mechanics

**Work-Load-Kinematics Toolkit for Mechanics of Materials**

WLKT Mechanics 是一款面向材料力学、结构力学和基础杆系分析教学场景的交互式求解器。它将节点、杆件、约束、荷载、材料、截面、内力图和变形图组织在同一个可视化工作流中，帮助学习者把“受力分析 -> 建模 -> 求解 -> 校核”的过程真正看清楚。

> Never Retreat. Mechanics of Materials Must Be Made Clear.

## 项目定位

材料力学不是只靠背公式就能学清楚的课程。轴力、剪力、弯矩、扭矩、应力、应变、挠度、转角、应变能与稳定性，每一个概念背后都对应着严格的受力逻辑和变形关系。

WLKT Mechanics 的目标不是简单给出答案，而是把典型问题的分析路径工具化、可视化、流程化，让使用者能够从载荷识别、约束判断、单元建模、结果读取到工程校核逐步理解问题。

当前界面采用偏蓝白、理工、航空航天风格的视觉语言，并提供本地离线安装能力。该项目不是北京航空航天大学官方软件，仅作为材料力学的学习与辅助，不得用于任何商业目的。本项目直接面向材料力学的应试目标开发不可用于任何实际工程问题。

## 功能亮点

- 中文界面：默认简体中文，保留英文语言包。
- 二维杆系建模：支持节点、梁单元、材料、截面、边界约束和荷载工况。
- 荷载类型：支持节点荷载、单元荷载、均布荷载、梯形分布荷载、集中力矩和温度荷载等。
- 结果查看：支持支反力、轴力、剪力、弯矩、变形图和单元端力。
- 快速建模流程：按照“材料截面 -> 节点 -> 单元 -> 荷载 -> 结果”的顺序引导操作。
- 本地离线 App：通过 PWA 安装到本机，运行时不依赖云端服务器。
- 本地符号运算：在荷载、弯矩、刚度、强度等数值输入框中可使用 `F`、`M`、`E`、`I`、`L`、`k`、`sigma`、`fy` 等字母表达式，全部在本机求值。
- 教学助手：提供分步推导面板、典型题库模板和危险截面识别，辅助材料力学建模、分析和校核。
- 项目文件交换：支持保存和打开本地 JSON 项目文件。

## 快速开始

项目需要 Node.js 20 或更高版本。仓库中也可以配合本地 Node 工具链使用。

```bash
npm install
npm run dev
```
开发服务器默认运行在：

```text
http://localhost:3000
```
## 构建本地 App

生成可离线缓存的生产版本：

```bash
npm run app:build
```

启动本地预览服务：

```bash
npm run app:preview
```

然后在 Edge 或 Chrome 中打开：

```text
http://127.0.0.1:4173
```

浏览器地址栏右侧会出现“安装应用”入口。安装后，WLKT Mechanics 可以像本地 App 一样从系统启动菜单打开。首次安装需要本地预览服务提供安装入口；安装并打开过一次后，应用资源会被 service worker 缓存，可在离线状态继续使用。当前版本不包含外部遥测、云端计算或周期性自动更新检查，结构求解、符号表达式和项目文件处理均在用户本机完成。

## 分享与发布

推荐使用 GitHub Pages 发布静态版本，或使用 GitHub Release 提供 Windows 一键安装包与离线压缩包。三种方式都不会调用发布者电脑的算力、信息或存储空间。

### GitHub Pages 静态版

仓库已内置 `.github/workflows/pages.yml`。启用步骤：

1. 在 GitHub 仓库进入 `Settings -> Pages`。
2. 将 `Build and deployment` 的 Source 设为 `GitHub Actions`。
3. 推送 `main` 分支，等待 `Deploy GitHub Pages` 工作流完成。
4. 分享工作流生成的 Pages 地址。

GitHub Pages 只负责提供静态文件，结构求解、符号表达式、项目文件打开与保存都在访问者自己的浏览器中完成。

### 离线压缩包

仓库已内置 `.github/workflows/offline-package.yml`。可以在 Actions 中手动运行 `Build Offline Package`，也可以推送 `v*` 标签自动生成 Release 附件。

本地生成离线包：

```bash
npm run build
npm run package:offline
```

生成目录：

```text
release/wlkt-mechanics-offline
```

对方下载后在自己的电脑上运行：

```bash
node serve-local.mjs app 4173
```

然后打开：

```text
http://127.0.0.1:4173/
```

`serve-local.mjs` 默认只监听 `127.0.0.1`，不会把使用者的电脑暴露为公网服务。更多说明见 [分享与隐私保证](docs/share-and-privacy.md)。

### Windows 一键安装包

仓库已内置 `.github/workflows/windows-installer.yml`。可以在 Actions 中手动运行 `Build Windows Installer`，也可以推送 `v*` 标签自动生成 Release 附件。

本地生成安装包：

```powershell
$env:Path = "$PWD\.local-tools\node-v22.22.2-win-x64;$env:Path"
$env:ELECTRON_MIRROR = "https://npmmirror.com/mirrors/electron/"
.\.local-tools\node-v22.22.2-win-x64\npm.cmd run desktop:dist:win
.\.local-tools\node-v22.22.2-win-x64\npm.cmd run release:checksums
```

生成文件：

```text
release/desktop/WLKT-Mechanics-<version>-x64-Setup.exe
release/desktop/SHA256SUMS.txt
```

正式公开分发前建议接入 Windows 代码签名证书。没有证书时，安装包可以安装使用，但只能依赖 `SHA256SUMS.txt` 识别篡改；有证书后，被修改的 `.exe` 会显示签名失效。更多说明见 [Windows 安装包与防篡改发布](docs/windows-installer.md)。

## 常用命令

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run app:build    # 构建本地离线 App
npm run app:preview  # 预览生产构建并用于浏览器安装
npm run package:offline # 生成离线分享目录
npm run desktop:dist:win # 生成 Windows 一键安装包
npm run release:checksums # 生成 Release 文件 SHA256 校验
npm run serve:dist   # 使用 127.0.0.1 预览 dist
npm run test:run     # 运行单元测试
npm run lint         # 运行代码检查
```

## 操作流程

1. 在“材料截面”中确认材料参数和截面参数。
2. 在画布或底部工作台中添加节点，并设置支座约束。
3. 连接节点形成梁单元或杆系结构。
4. 添加节点荷载、单元荷载或温度荷载。
5. 点击“结果”求解并查看支反力、内力和变形。
6. 保存项目 JSON，便于后续继续编辑或分享。

## 技术栈

- Vue 3
- TypeScript
- Vite
- Vuetify
- Pinia
- vue-i18n
- vite-plugin-pwa
- ts-fem

## 目录结构

```text
src/
  components/        # 主要交互组件、SVG 视图和对话框
  components/svg/    # 节点、单元、荷载等 SVG 绘制组件
  locales/           # 多语言文案
  plugins/           # Vuetify、i18n 等插件配置
  store/             # Pinia 状态管理
  tests/             # 单元与单位换算测试
  utils/             # 建模、序列化、校验与单位工具
public/
  changelog/         # 本地更新日志与媒体资源
  docs/              # 本地说明页
.github/workflows/   # GitHub Pages 与离线包发布工作流
scripts/             # 本地静态服务与离线包脚本
```

## 已完成的本地化与离线化改造

- 默认语言切换为简体中文。
- 移除运行时 Google Analytics、Sentry 和远程字体加载。
- 添加本地说明页和中文更新日志。
- 配置 PWA manifest 与 service worker。
- 移除周期性自动更新检查，运行时不连接外部服务器。
- 增加本地符号参数表与表达式求值能力。
- 增加 GitHub Pages 静态部署与离线压缩包工作流。
- 增加教学助手：典型题库、平衡/边界/内力推导摘要、最大正应力/剪应力/挠度和安全系数识别。
- 更新依赖锁文件，生产依赖审计通过。

## 后续路线图

- 分步推导面板：展示平衡方程、边界条件、内力方程和符号约定。
- 典型题库模板：悬臂梁、简支梁、外伸梁、刚架、桁架、组合杆、温度荷载等。
- 危险截面识别：自动标出最大正应力、最大剪应力、最大挠度和安全系数。
- 单位一致性检查：降低 N、kN、m、mm、MPa 混用造成的建模错误。
- 报告导出：导出模型图、荷载图、支反力、内力图、变形图和关键结果。
- 教学模式：支持逐步隐藏答案，引导学生先判断约束、内力和变形趋势。

## 许可

本项目保留原仓库许可文件。使用、修改和分发前请阅读仓库中的 `LICENSE`。

## 致谢

WLKT Mechanics 基于开源结构分析与 Web 前端生态持续迭代。欢迎提交 issue、建议和改进方案，让材料力学学习工具变得更清晰、更可靠。
