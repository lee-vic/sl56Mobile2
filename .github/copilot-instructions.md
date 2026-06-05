# Project Guidelines

> Ionic 8 + Angular 17 客户移动端。环境与命令详见 [README.md](../../README.md)。

## Code Style

- 文件命名 **kebab-case**，组件前缀 `app-`（`angular.json` → `prefix`）
- 页面位于 `src/app/pages/{feature}/{page-name}/`，每页配齐 `.ts` / `.html` / `.scss` / `.module.ts` / `.spec.ts` / 路由模块
- 服务放 `src/app/providers/`，用 `@Injectable({ providedIn: 'root' })`
- 接口放 `src/app/interfaces/`，按功能域拆分
- API 基址统一引用 `src/app/global.ts` 的 `apiUrl` 常量，禁止硬编码
- 禁止 `any`（ESLint warn），常量 `const` / 变量 `let`
- 所有文件编码 **UTF-8 带 BOM**

## Architecture

- 路由全部**懒加载**：`loadChildren: () => import(...).then(m => m.XxxModule)`
- Tab 导航由 `TabsPage` 容器 + `children` 子路由实现
- 表单统一 **Reactive Forms**（`FormBuilder`），禁止 `[(ngModel)]` 双向绑定
- HTTP 全部带 `{ withCredentials: true }`（Cookie 认证），参数用 `HttpParams`

## Build and Test

```bash
npm run start        # 开发：http://localhost:4200
npm run build        # 生产构建 → www/
npm run test:ci      # 单元测试（Jasmine + Karma 无头）
npm run lint         # ESLint
npm run verify       # 门禁：lint + build + test:ci
npm run e2e:smoke    # E2E 冒烟（Playwright Chromium）
```

## Conventions

### UI — Ionic 组件优先
  - 遵循 Ionic 组件库设计，优先使用官方组件实现 UI 和交互，避免自定义复杂组件。
  - 遵循 Ionic 官方推荐的最佳实践和设计模式，确保一致的用户体验和界面风格。
  - UI设计语言需要保持一致，避免使用不同的设计语言。
### Typescript 
  - 使用 TypeScript 的类型系统，定义接口和类型别名，确保代码的类型安全和可维护性。
  - 遵循 Angular 官方的编码规范和最佳实践，使用 Angular CLI 生成组件、服务等代码结构。
### 样式 — 不用内联 `style="..."`

品牌色使用 `--member-*` CSS 变量（定义于 `src/theme/variables.scss`），页面样式写自身 `.scss` 文件。

### 表单 — 提交时禁用按钮

`ion-button[type="submit"]` 在 `isSubmitting` 期间设 `[disabled]`：
```html
<ion-button [disabled]="!form.valid || isSubmitting" type="submit">保存</ion-button>
```

### 单元测试 — Mock 模式

```ts
// 服务 Mock
const spy = jasmine.createSpyObj('XxxService', ['method1', 'method2']);
// 注入
{ provide: XxxService, useValue: spy }
// Ionic 组件需 CUSTOM_ELEMENTS_SCHEMA
// HTTP 测试需 HttpClientTestingModule + HttpTestingController
// afterEach 必须 httpMock.verify()
```

### E2E — API Mock 模式

```ts
await page.route('**/api/**', async route => {
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({...}) });
});
```

### DOM 操作 — 禁止原生 JS

禁止 `document.querySelector` 等原生 DOM API，使用 Angular 数据绑定/Ionic 组件 API。jQuery 仅限历史代码维护，新功能不得引入。

### 微信集成

JS-SDK 通过 `index.html` CDN 引入；OpenId/UnionId 用 `CookieService.get()` 读取；SDK 配置调用 `CommonService.getJsSdkConfig()`。
