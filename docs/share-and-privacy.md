# 分享与隐私说明

拉压弯扭大师可以通过 GitHub Pages 静态站点、Windows 一键安装包或离线压缩包分享给其他人。这些方式都不会调用发布者电脑的算力、信息或存储空间。

## 推荐方式一：Windows 安装包

将以下文件上传到 GitHub Release 或其他文件分发平台：

```text
release/desktop/拉压弯扭大师-<version>-x64-Setup.exe
release/desktop/SHA256SUMS.txt
release/desktop/release-manifest.json
```

接收者下载后在自己的电脑上安装和运行。所有计算都在接收者本机完成。

## 推荐方式二：GitHub Pages

GitHub Pages 只负责提供静态文件。结构求解、字母公式计算、项目文件打开与保存都在访问者自己的浏览器中完成。

## 推荐方式三：离线压缩包

本地生成离线包：

```bash
npm run build
npm run package:offline
```

生成目录：

```text
release/layawanniu-master-offline
```

对方下载后在自己的电脑运行：

```bash
node serve-local.mjs app 4173
```

然后打开：

```text
http://127.0.0.1:4173/
```

`serve-local.mjs` 默认只监听 `127.0.0.1`，不会把使用者电脑暴露为公网服务。

## 发布者电脑不会被调用

只要不要把开发服务器地址、远程 API 地址或本机共享目录发给别人，别人使用安装包、离线包或 GitHub Pages 时都不会访问发布者电脑。发布者只负责提供可下载文件；运行时的计算和存储发生在使用者本机。
