# Windows 安装包与防篡改发布

拉压弯扭大师可以构建为 Windows 一键安装 `.exe`。安装包使用 Electron + NSIS，默认安装到系统应用目录。安装后，结构求解、项目文件读写、字母公式计算和三维有限元处理都在使用者自己的电脑上完成。

## 本地构建

```powershell
$env:Path = "$PWD\.local-tools\node-v22.22.2-win-x64;$env:Path"
.\.local-tools\node-v22.22.2-win-x64\npm.cmd run desktop:dist:win
.\.local-tools\node-v22.22.2-win-x64\npm.cmd run release:checksums
```

生成文件：

```text
release/desktop/拉压弯扭大师-<version>-x64-Setup.exe
release/desktop/SHA256SUMS.txt
release/desktop/release-manifest.json
```

## 离线与隐私

- 桌面版通过本地只读协议加载打包内 `dist` 资源。
- Electron 主进程禁止 `http`、`https`、`ws`、`wss` 等外部网络请求。
- 软件不会调用发布者电脑的算力、信息或存储空间。
- 使用者的项目文件保存在使用者自己的电脑上。

## 防篡改建议

当前本地无代码签名证书时生成的是未签名安装包。未签名包仍可安装和校验哈希，但 Windows 不能证明发布者身份。正式公开分发时应使用代码签名证书。

校验安装包：

```powershell
Get-FileHash .\拉压弯扭大师-<version>-x64-Setup.exe -Algorithm SHA256
powershell -ExecutionPolicy Bypass -File .\verify-installer.ps1 .
```

正式签名示例：

```powershell
$env:CSC_LINK="D:\certs\layawanniu-code-signing.pfx"
$env:CSC_KEY_PASSWORD="证书密码"
.\.local-tools\node-v22.22.2-win-x64\npm.cmd run desktop:dist:win
```
