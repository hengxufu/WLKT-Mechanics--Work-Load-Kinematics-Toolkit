# Windows 安装包与防篡改发布

WLKT Mechanics 可以构建为 Windows 一键安装 `.exe`。安装包使用 Electron + NSIS，默认安装到系统应用目录，安装后所有计算、项目文件读写和符号表达式处理仍然只在使用者自己的电脑上完成。

## 本地构建

```powershell
$env:Path = "$PWD\.local-tools\node-v22.22.2-win-x64;$env:Path"
$env:ELECTRON_MIRROR = "https://npmmirror.com/mirrors/electron/"
.\.local-tools\node-v22.22.2-win-x64\npm.cmd ci
.\.local-tools\node-v22.22.2-win-x64\npm.cmd run desktop:dist:win
.\.local-tools\node-v22.22.2-win-x64\npm.cmd run release:checksums
```

生成位置：

```text
release/desktop/WLKT-Mechanics-<version>-x64-Setup.exe
release/desktop/SHA256SUMS.txt
```

## 防篡改边界

任何下载安装到用户电脑上的软件都无法在物理意义上做到“绝对不能被篡改”。推荐的工程做法是让篡改可被系统和用户识别：

- 使用 Windows 代码签名证书签署安装包和可执行文件。
- 发布 `SHA256SUMS.txt`，让用户下载后核对哈希。
- 通过 GitHub Release 发布安装包，不通过个人电脑向外提供下载。
- 安装器采用一键安装并优先安装到系统应用目录，降低普通用户误改安装文件的概率。
- Electron 主进程禁止 `http`、`https`、`ws`、`wss` 等外部网络请求，避免运行期连接云端服务器。

当前本地无代码签名证书时生成的是未签名安装包。未签名包仍可安装和校验哈希，但 Windows 不能替你证明发布者身份；正式公开分发时应使用代码签名证书。

## 正式发布签名

正式分发前建议购买 OV 或 EV 代码签名证书，并在本地或 GitHub Actions 中配置：

```powershell
$env:CSC_LINK="D:\certs\wlkt-code-signing.pfx"
$env:CSC_KEY_PASSWORD="证书密码"
.\.local-tools\node-v22.22.2-win-x64\npm.cmd run desktop:dist:win
```

如果使用 GitHub Actions，请把证书和密码分别配置为仓库 Secrets：

```text
CSC_LINK
CSC_KEY_PASSWORD
```

签名后的 `.exe` 被修改后，数字签名会失效。用户可以在文件属性的“数字签名”页查看发布者，也可以用 PowerShell 校验哈希：

```powershell
Get-FileHash .\WLKT-Mechanics-1.0.6-x64-Setup.exe -Algorithm SHA256
```

然后与 Release 中的 `SHA256SUMS.txt` 比对。
