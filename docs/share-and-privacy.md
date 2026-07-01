# 分享与隐私保证

WLKT Mechanics 可以通过 GitHub Pages 静态站点、Windows 一键安装包或离线压缩包分享给其他人。这些方式都不会调用发布者电脑的算力、信息或存储空间。

## 推荐方式一：GitHub Pages

仓库包含 `.github/workflows/pages.yml`。推送到 `main` 后，GitHub Actions 会构建 `dist` 并部署到 GitHub Pages。

启用方式：

1. 打开 GitHub 仓库的 `Settings -> Pages`。
2. 将 `Build and deployment` 的 Source 设为 `GitHub Actions`。
3. 推送 `main` 分支，等待 `Deploy GitHub Pages` 工作流完成。
4. 将 Pages 地址分享给其他人。

用户访问 Pages 时，HTML、JS、CSS 等静态文件由 GitHub 提供；结构求解、符号表达式、项目 JSON 读写都在用户自己的浏览器中完成。

## 推荐方式二：离线压缩包

仓库包含 `.github/workflows/offline-package.yml`。可以手动运行 `Build Offline Package` 工作流，或推送 `v*` 标签自动创建 Release。

本地生成方式：

```bash
npm ci
npm run build
npm run package:offline
```

生成目录：

```text
release/wlkt-mechanics-offline
```

对方下载后，在自己的电脑上运行：

```bash
node serve-local.mjs app 4173
```

然后打开：

```text
http://127.0.0.1:4173/
```

`serve-local.mjs` 默认只监听 `127.0.0.1`，不会把对方电脑暴露成公网服务。

## 推荐方式三：Windows 一键安装包

仓库包含 `.github/workflows/windows-installer.yml`。可以手动运行 `Build Windows Installer` 工作流，或推送 `v*` 标签自动创建 Release。

本地生成方式：

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

对方下载 `.exe` 后在自己的电脑上安装运行。结构求解和项目数据处理仍然只在对方电脑本地完成。发布时同时提供 `SHA256SUMS.txt`，对方可以用 `Get-FileHash` 校验安装包是否被替换或篡改。

## 不要这样分享

- 不要分享你本机的 `http://127.0.0.1:3000/` 或 `http://localhost:3000/`。
- 不要把开发服务器绑定到公网地址。
- 不要配置路由器端口转发、内网穿透、反向代理到你的电脑。
- 不要让别人通过你的 IP 地址访问开发服务。
- 不要把未校验来源的安装包当作正式版本分发。

## 本地数据边界

- 结构求解在用户浏览器本地执行。
- 项目文件由用户手动保存为本地 JSON。
- 符号参数、界面语言和单位设置保存在用户自己的浏览器本地存储。
- 项目不需要云端账号、数据库或后端计算服务。
