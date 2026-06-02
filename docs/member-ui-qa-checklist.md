# Member Center UI QA Checklist

## Scope

- Page: `app/tabs/member`
- State: logged-in dashboard and logged-out login view
- Goal: verify UX/UI refresh has no functional regression

## Devices

- Small phone: 360x800
- Main phone: 390x844
- Tablet: 768x1024
- Large viewport: >= 992 width

## Visual Checks

- Header gradient is rendered without clipping.
- User number and service icons align on one line.
- KPI cards have equal height and balanced spacing.
- Quick menu and full menu sections are visually distinct.
- Menu title wraps to max two lines without overflow.
- Bottom tab bar has updated border/shadow and selected-state color.

## Interaction Checks

- Message entry button opens unread message page.
- "我的客服专员" button opens chat page.
- KPI and debt cards keep stable press feedback.
- All menu items are clickable and route correctly.
- "业务公告" unread badge still blinks before click.
- "合同签署" badge count still shows when > 0.

## Accessibility Checks

- Menu tiles can be focused by keyboard.
- Enter/Space on focused menu tile triggers navigation.
- Key action buttons have visible focus ring.
- Unread badge value updates are announced (`aria-live`).
- Text remains readable at 200% zoom.

## Responsive Checks

- <= 767 width: menu uses 3 columns.
- 768-991 width: menu uses 4 columns.
- >= 992 width: menu uses 5 columns.
- Window resize triggers menu reflow correctly.

## Regression Checks

- Login flow remains unchanged.
- Logout still clears session and returns to login UI.
- Unread notice count loading still works.
- Wait-to-sign count loading still works.
- Build command `npm run build` succeeds.

## Pass Criteria

- No broken navigation.
- No visual overlap or text truncation issues.
- No console/template runtime errors.
- Build succeeds in production mode.

## Confirmation Page QA (member/confirmation)

### Confirmation Visual Checks

- Hero summary card displays title, subtitle, and 4 stats blocks with balanced spacing.
- Search card includes search bar and segment controls with clear active state.
- Selected record card shows stronger border/shadow highlight than unselected cards.
- Sticky footer remains visually separated from content while scrolling.

### Confirmation Interaction Checks

- Pull-to-refresh reloads data and exits refresh state correctly.
- Search by reference number filters list in real time.
- Segment switch between "全部" and "仅已选" updates list correctly.
- "全选当前页" toggles all visible records only.
- Single confirm shows warning dialog, then submit loading, then success toast.
- Batch confirm button is disabled when selected count is 0.

### Confirmation Accessibility Checks

- Search input has readable aria label and is keyboard focusable.
- Checkbox labels are announced for both row selection and select-all.
- Selected count area in footer updates with aria-live feedback.
- Empty state image has meaningful alt text.

### Confirmation Responsive Checks

- 430 width: stats card switches to two-column grid without overlap.
- 390 width: footer wraps into two rows and primary action remains visible.
- 360 width: amount and confirm button remain tappable with no clipping.
- 768+ width: content is centered and max-width constrained.

### Confirmation Regression Checks

- Detail entry still navigates to /member/delivery-record/detail/:id.
- Return-to-member-center button still navigates to /app/tabs/member.
- Build command npm run build succeeds after confirmation UI refresh.

## Return Flow QA (delivery-record -> return-waiting -> return-apply)

### Return Flow Visual Checks

- 交货记录页 footer 在普通态和勾选态文案清晰区分，均可直达待退货列表。
- 交货记录卡片主单号（原单号）信息层级高于转单号，勾选态点击反馈明显。
- 待退货页统计区同步显示“待退货条数/已选条数”，小屏下不遮挡操作按钮。
- 退货申请页顶部摘要卡显示申请类型与已选条数，表单区域层次清晰。

### Return Flow Interaction Checks

- 在交货记录中勾选多条后，点击“加入待退货”可成功更新待退货计数。
- 对已在待退货中的记录再次加入时，前端静默去重，不重复写入。
- 待退货页“移除/清空”后，返回交货记录页时计数立即刷新。
- 待退货页未勾选项目时，“提交退货申请”按钮应保持禁用。
- 申请页在必填未完成时不可提交，并出现明确错误提示。
- 申请页提交中按钮置灰，成功后返回上级页面，失败后可重试。
- 交货记录页勾选入口文案与行为一致（“选择退货单/结束勾选”）。
- 加入成功提示文案需区分“可直接申请”和“已在待退货”两类场景。
- 对话框按钮文案包含明确动作语义（如“确认清空”而非“确定”）。

### Return Flow Regression Checks

- 交货记录详情入口仍可正常跳转 /member/delivery-record/detail/:id。
- 待退货页“全选”仅影响待退货列表，不影响交货记录页勾选状态。
- 退货申请 type=0/type=1 两条分支均可正常获取默认信息并提交。
- Build command npm run build succeeds after return flow redesign.

## Problem Flow QA (problem-list -> problem-detail)

### Problem Flow Visual Checks

- 问题列表 summary bar 的运单数和待处理问题数与列表内容一致。
- 列表骨架屏、空状态、错误状态三种视图在切换时无闪烁错位。
- 问题详情页 Hero 卡片、引导提示、底部操作栏层级清晰。

### Problem Flow Interaction Checks

- 列表搜索输入后约 280ms 防抖触发过滤，结果数量正确更新。
- 列表点击问题项可跳转到 problem-detail 且参数正确传递。
- 自助处理表单填写后可成功提交并进入“问题已完成处理”状态。
- 问题详情切换处理方式时，旧错误提示应被清空。

### Problem Flow Regression Checks

- `problem-detail` 的微信文件状态轮询与上传引导逻辑保持可用。
- 客服入口（chat）路径不受本次重构影响。
- Build command npm run build succeeds after problem flow refactor.

## Delivery Detail + Payment + Calculation QA

### Delivery Detail Checks

- 运单详情页“问题筛选（全部/处理中/已处理）”切换结果正确。
- “我要退货”入口在详情主操作与更多操作中行为一致。

### Wechat Pay Checks

- 外币场景（cid != 1）默认不勾选运单，金额输入保持可编辑。
- 全选/单选改变后金额、手续费、总额联动正确。
- 金额小于 0.01 时继续支付会给出明确提示。
- 支付按钮提交中显示“正在发起支付...”，且按钮禁用避免重复触发。
- 点击“支付说明”可正确跳转说明页，返回后主页面选择状态不丢失。
- 支付说明页两种模式卡片与操作建议卡在 360/390/430 宽度下无裁切。
- 支付记录页首次加载显示骨架屏，失败时进入错误态并可重试。
- 支付记录页下拉刷新可恢复列表，滚动分页到末页后无限加载自动停止。
- 支付记录页空态、错误态、列表态互斥展示，不应同时出现。

### Calculation Checks

- 精简/完整模式切换后必填约束与默认运输方式（不限）正确。
- 规格件规则勾选后 `SeletedTemplateRules` 同步更新。

## Remote Query QA (member/remote)

### Remote Query Visual Checks

- 顶部 Hero 卡片文案与层级清晰，背景渐变无裁切和锯齿。
- 查询条件卡片中的表单行间距一致，字段标题和输入区不重叠。
- 国家下拉结果列表在 360/390/430 宽度下可完整滚动且无遮挡。
- 查询结果卡片在偏远/不偏远/失败三种状态下颜色和文案区分明显。

### Remote Query Interaction Checks

- 进入页面后可成功加载运输方式和国家列表，默认运输方式自动选中。
- 国家输入仅手动输入但未选择有效项时，提交按钮不可触发查询。
- 国家输入支持回车快速确认，单条匹配时可自动选中。
- 查询提交中按钮显示“查询中...”，并禁用避免重复点击。
- 查询失败时出现页面内错误卡片，点击“再次尝试”可重新提交。
- 点击“清除查询结果”后，结果区域和错误提示均被清空。

### Remote Query Accessibility Checks

- 运输方式、国家、邮编、城市输入均具备可读 aria 标签。
- 查询表单在提交期间带有 `aria-busy` 状态，读屏可感知。
- 错误态和校验提示文案在键盘 Tab 导航时可读。

### Remote Query Responsive Checks

- 360 宽度下 Hero 主标题自动换行，查询按钮始终完整可见。
- 390 宽度下国家结果列表最大高度生效，底部按钮区不被键盘遮挡。
- 430 宽度下卡片圆角、阴影和间距节奏保持一致。
- 768+ 宽度下主体容器居中且最大宽度限制生效。

### Remote Query Regression Checks

- 会员中心“偏远查询”菜单入口仍指向 `/member/remote`。
- 查询请求参数中的 `countryId` 继续使用国家 Id，不回退为国家名称。
- Build command npm run build succeeds after remote page UX refresh.

## Automated Test Artifacts

- Unit specs: calculation / wechat-pay / delivery-record-detail / return-apply / problem-list / problem-detail / confirmation / return-waiting / delivery-record.
- Playwright e2e: tests/e2e/delivery-return-flow.spec.ts, tests/e2e/confirmation-flow.spec.ts, tests/e2e/problem-flow.spec.ts, tests/e2e/member-detail-flow.spec.ts, tests/e2e/wechat-pay-flow.spec.ts.
