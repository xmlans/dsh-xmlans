# 打包与发布

本仓库的 npm 包由 GitHub Actions（`.github/workflows/publish.yml`）通过 npm trusted publishing 发布；不要在本地执行 `npm publish`。Windows、Linux x64 和 macOS universal 的 Helper 在各自的原生 runner 上构建并冒烟测试，最后装配成同一个 `.tgz`。

## 发布前

1. 更新 `package.json` 的版本；npm 版本不可重复使用。
2. 在 `CHANGELOG.md` 写发布说明。
3. 同步 `README.md`、`README_EN.md`、`docs/UPDATING.md` 中的版本号和包名。
4. 提交到 `main`，保持工作区干净。已发布的版本标签不得移动、删除或复用。

## 本地打包离线 `.tgz`

不要在 pnpm 安装（符号链接式 `node_modules`）的目录里直接 `npm pack`：打进去的依赖会损坏。与上游 CI 一样，先装成平铺依赖再打包：

```powershell
npm install --ignore-scripts --no-package-lock --omit=dev
npm pack
```

产物为 `dsh-xmlans-<version>.tgz`。打包后如需继续开发，重新执行 `pnpm install --frozen-lockfile` 恢复开发依赖。

## 安装验证

DSH 的插件管理器需要 `pnpm` 在 PATH 中，否则安装会失败。先完全退出对应 Host，再安装：

```powershell
npx -y @deepseek-ai/dsh plugin --profile web add "C:\path\to\dsh-xmlans-0.1.0.tgz"
dsh web
```

`dsh web` 本身就使用 `web` profile，不需要再加 `--profile`。官方桌面端必须使用应用自带的 `dsh`（`--profile desktop`）。

## 通过版本标签发布

推送 `v<package 版本>` 标签会触发发布工作流。预发布版本使用 npm 的 `alpha` 标签，稳定版使用 `latest`；工作流会拒绝与 `package.json` 版本不一致的标签。npm 的 trusted publishing 只提供短期 OIDC 凭据，不能执行 `npm dist-tag`，不要为此保存长期 npm token。

## 失败与重试

- 测试或任一平台的 Helper 构建失败，发布会在 npm 之前停止。
- npm 上已有内容完全相同的包时，重试会跳过 npm，只补建 GitHub Release。
- 同一版本号但内容不同时工作流会停止，请升版本号，不要覆盖已发布的包。
- 从 fork 发布会失败，npm 只信任本仓库的工作流。
