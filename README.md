# sl56Mobile2

## 当前环境

- 前端框架：Ionic 8 + Angular 17
- 运行时：Node 24.x（以 CI 环境为准）
- 包管理：npm 11（约束：`>=10 <12`，当前锁定 `npm@11.12.1`）
- 单元测试：Jasmine + Karma
- E2E：Playwright

## 标准命令

### 开发

- 启动开发服务：`npm run start`
- 单元测试（本地交互）：`npm run test`
- E2E 冒烟（本地）：`npm run e2e:smoke`

### 提测

- 生产构建：`npm run build`
- 单元测试（CI 模式）：`npm run test:ci`
- E2E 冒烟（CI 模式）：`npm run e2e:smoke:ci`

### 发布门禁

- 一键门禁：`npm run verify`
- 门禁内容：`npm run lint` + `npm run build` + `npm run test:ci`

## E2E 说明

- 默认执行：`npm run e2e`
- 首次安装浏览器：`npm run e2e:install`

## 环境自检

- 检查 Node 版本：`node -v`（期望 `v24.x`）
- 检查 npm 版本：`npm -v`（建议 `11.x`，约束 `>=10 <12`）
- 检查引擎约束是否可见：`npm pkg get engines`
- 执行发布门禁：`npm run verify`
- 如需安装 E2E 浏览器：`npm run e2e:install`

```powershell
$ErrorActionPreference = 'Stop'

Write-Host '== Runtime ==' -ForegroundColor Cyan
node -v
npm -v

Write-Host "`n== Engines ==" -ForegroundColor Cyan
npm pkg get engines

Write-Host "`n== Verify ==" -ForegroundColor Cyan
npm run verify

Write-Host "`n环境自检完成" -ForegroundColor Green
```

## 命令约定

- 推荐统一使用 `npm run ...` 作为团队标准入口（本地与 CI 一致）
- `ionic ...` 可用于本地临时调试或特定 Ionic CLI 场景
