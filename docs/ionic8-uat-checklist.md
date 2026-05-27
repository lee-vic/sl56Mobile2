# Ionic 8 升级后 UAT 目检清单

## 1. 目标
本清单用于验证 Ionic 7 -> 8 升级后，页面样式与交互在真实业务流程中无明显回归。

## 2. 测试环境
- 构建版本：当前升级分支最新代码
- 浏览器：Chrome (Desktop)、Edge (Desktop)
- 移动端模拟：Chrome DevTools iPhone 13 / Pixel 7
- 分辨率建议：390x844、412x915、1366x768、1920x1080

## 3. 全局视觉检查
### 3.1 字体与文本
- [ ] 页面主标题、卡片标题、按钮文案无错位/截断
- [ ] 中英文混排处不出现异常换行
- [ ] 关键按钮在窄屏下不出现不可读折行

### 3.2 颜色与对比度
- [ ] 主按钮、危险按钮、提示文本颜色符合原设计预期
- [ ] 表单错误态（红色提示）可见且对比清晰
- [ ] 卡片背景与页面背景层级清楚

### 3.3 间距与布局
- [ ] ion-item 内 label 与输入框间距正常
- [ ] 顶部安全区、底部安全区无遮挡
- [ ] Footer 操作栏按钮不被键盘或系统栏遮挡

## 4. 组件专项检查
### 4.1 Select 弹层
- [ ] 所有下拉弹层出现“取消/确定”按钮
- [ ] 选择后值正确回填且不会清空其他字段
- [ ] 弹层可关闭，点遮罩或返回键行为正常

### 4.2 文件上传
- [ ] 文件选择器可正常打开系统文件面板
- [ ] 选择图片/PDF/Word/Excel 后可触发处理逻辑
- [ ] 无法选择不支持格式（或有明确错误提示）

### 4.3 表单标签与错误提示
- [ ] stacked 标签位置正常，不压住输入内容
- [ ] 表单校验提示在触发时出现，修正后消失
- [ ] 输入法弹起时表单可滚动到当前编辑项

### 4.4 Searchbar
- [ ] 输入时清空按钮按既有交互显示
- [ ] 清空后列表回到默认状态
- [ ] 首字母大小写行为符合业务预期

## 5. 关键业务页面回归
### 5.1 登录与密码
- 页面：[src/app/pages/login/login.page.html](src/app/pages/login/login.page.html)
- 页面：[src/app/pages/member/modify-password/modify-password.page.html](src/app/pages/member/modify-password/modify-password.page.html)
- 页面：[src/app/pages/member/modify-deliverypassword/modify-deliverypassword.page.html](src/app/pages/member/modify-deliverypassword/modify-deliverypassword.page.html)
- [ ] 标题、输入框、提交按钮可见且可操作
- [ ] 校验提示文案与触发时机正常

### 5.2 价格计算
- 页面：[src/app/pages/member/calculation/calculation.page.html](src/app/pages/member/calculation/calculation.page.html)
- [ ] 精简模式/完整模式切换正常
- [ ] 国家搜索可输入、可清空、可选择
- [ ] 体积重除数下拉可正常选择
- [ ] Footer“立即计算”按钮状态正确

### 5.3 偏远查询
- 页面：[src/app/pages/member/remote/remote.page.html](src/app/pages/member/remote/remote.page.html)
- [ ] 运输方式下拉可正常操作
- [ ] 国家/邮编/城市输入与清空正常
- [ ] 查询按钮在有效输入下可点击

### 5.4 称重支付
- 页面：[src/app/pages/member/pay-weighing-fee/pay-weighing-fee.page.html](src/app/pages/member/pay-weighing-fee/pay-weighing-fee.page.html)
- [ ] 价格选择弹层按钮正常显示
- [ ] 表单字段显示条件（隐藏/显示）与原逻辑一致
- [ ] 提交流程无明显布局错乱

### 5.5 微信支付
- 页面：[src/app/pages/member/wechat-pay/wechat-pay.page.html](src/app/pages/member/wechat-pay/wechat-pay.page.html)
- [ ] 产品类型下拉正常
- [ ] 金额输入与币种显示正常
- [ ] 支付说明入口可访问

### 5.6 问题跟进上传
- 页面：[src/app/pages/member/problem-detail/problem-detail.page.html](src/app/pages/member/problem-detail/problem-detail.page.html)
- [ ] 文件上传输入可选文件并触发处理
- [ ] 处理中状态（spinner/文案）显示正常
- [ ] 文件失败提示文案正常显示

## 6. 验收通过标准
- [ ] P0/P1 页面无阻断缺陷
- [ ] 样式类缺陷不超过 3 个且均有规避方案
- [ ] 关键流程（登录、查询、提交、上传）可完整走通

## 7. 缺陷记录模板
- 页面路径：
- 设备/分辨率：
- 复现步骤：
- 期望结果：
- 实际结果：
- 严重级别（P0/P1/P2）：
- 截图/录屏：
