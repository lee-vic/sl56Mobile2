# sl56Mobile2

## E2E 执行（团队统一方式）

本项目 E2E 基于 Protractor，已在配置中固定使用本地 ChromeDriver 文件并以 headless 模式运行。

### 推荐命令

- 直接执行稳定命令（推荐）：
  - `npm run e2e:stable`
- 兼容旧方式（等价）：
  - `npm run e2e -- --webdriver-update=false`

### 为什么用 e2e:stable

- 自动带上 `NODE_OPTIONS=--openssl-legacy-provider`
- 自动带上 `--webdriver-update=false`
- 避免每次手动追加参数，降低团队执行差异

### 运行前检查

- 已安装依赖：`npm install`
- 机器上存在可用浏览器：
  - 优先读取 `CHROME_BIN`
  - 否则按 Protractor 配置中的候选路径查找 Chrome/Edge
- 保持网络与权限正常，避免本机安全策略拦截浏览器启动

### 常见问题

- 启动失败且提示 OpenSSL 相关错误：
  - 请使用 `npm run e2e:stable`，不要直接调用 `ng e2e`
- 报 webdriver-manager 更新相关问题：
  - 请确认使用了 `--webdriver-update=false`
- 仅需看最终结果：
  - 关注末尾是否出现 `Executed N of N specs SUCCESS`

### 相关文件

- `package.json`
- `e2e/protractor.conf.js`
- `e2e/src/app.e2e-spec.ts`
