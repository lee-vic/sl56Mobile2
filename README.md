# sl56Mobile2

## 当前环境

- 前端框架：Ionic 6 + Angular 14
- 运行时：Node 24.x（以 CI 环境为准）
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

- 一键门禁：`npm run verify:phase0`
- 门禁内容：`npm run build` + `npm run test:ci`

## E2E 说明

- 默认执行：`npm run e2e`
- 首次安装浏览器：`npm run e2e:install`

## 命令约定

- 推荐统一使用 `npm run ...` 作为团队标准入口（本地与 CI 一致）
- `ionic ...` 可用于本地临时调试或特定 Ionic CLI 场景
