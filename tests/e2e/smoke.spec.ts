import { expect, test } from '@playwright/test';

test.describe('app smoke', () => {
  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(15_000);
  });

  test('redirects root to tabs home', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL('**/app/tabs/home');

    await expect(page.locator('ion-tab-bar')).toBeVisible();
    await expect(page.locator('ion-tab-button[tab="home"] ion-label')).toContainText('首页');
    await expect(page.locator('ion-tab-button[tab="member"] ion-label')).toContainText('会员中心');
  });

  test('renders modify password form shell', async ({ page }) => {
    await page.goto('/member/modify-password');

    await expect(page.locator('ion-header ion-title')).toContainText('修改密码');
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('ion-button[type="submit"]')).toBeVisible();
    await expect(page.locator('form ion-item')).toHaveCount(3);
  });

  test('renders modify-delivery-password form shell', async ({ page }) => {
    await page.goto('/member/modify-deliverypassword');

    await expect(page.locator('ion-header ion-title')).toContainText('修改密码');
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('ion-button[type="submit"]')).toBeVisible();
    await expect(page.locator('form ion-item')).toHaveCount(3);
  });

  test('renders sub-account management shell', async ({ page }) => {
    await page.goto('/member/sub-account');

    await expect(page.locator('ion-header ion-title')).toContainText('子账号管理');
    await expect(page.locator('ion-toolbar ion-buttons[slot="end"] ion-button')).toContainText('新增');
    await expect(page.locator('ion-list')).toBeVisible();
  });

  test('renders notice list shell', async ({ page }) => {
    await page.goto('/member/notice-list');

    await expect(page.locator('ion-header ion-title')).toContainText('业务公告');
    await expect(page.locator('ion-list')).toBeVisible();
    await expect(page.locator('ion-infinite-scroll')).toBeVisible();
  });

  test('renders template list shell', async ({ page }) => {
    await page.goto('/member/template-list');

    await expect(page.locator('ion-header ion-title')).toContainText('模板下载');
    await expect(page.locator('ion-list')).toBeVisible();
    await expect(page.locator('ion-infinite-scroll')).toBeVisible();
  });

  test('renders message subscription menu entries', async ({ page }) => {
    await page.goto('/member/message-subscription/list');

    await expect(page.locator('ion-header ion-title')).toContainText('消息订阅');
    await expect(page.locator('ion-content ion-item')).toHaveCount(3);
    await expect(page.locator('ion-content ion-item:nth-of-type(1) h2')).toContainText('微信公众号消息');
    await expect(page.locator('ion-content ion-item:nth-of-type(2) h2')).toContainText('短信消息');
    await expect(page.locator('ion-content ion-item:nth-of-type(3) h2')).toContainText('邮件消息');
  });

  test('renders confirmation page shell', async ({ page }) => {
    await page.goto('/member/confirmation');

    await expect(page.locator('ion-header ion-title')).toContainText('交货清单确认');
    await expect(page.locator('ion-searchbar')).toBeVisible();
    await expect(page.locator('ion-footer ion-button')).toContainText('确认所选');
  });

  test('renders wechat binding management shell', async ({ page }) => {
    await page.goto('/member/wechat-binding');

    await expect(page.locator('ion-header ion-title')).toContainText('微信绑定管理');
    await expect(page.locator('ion-list')).toBeVisible();
  });

  test('renders bank slips upload shell', async ({ page }) => {
    await page.goto('/member/bank-slips');

    await expect(page.locator('ion-header ion-title')).toContainText('银行水单上传');
    await expect(page.locator('ion-infinite-scroll')).toBeVisible();
    await expect(page.locator('ion-footer ion-button')).toContainText('上传');
  });

  test('renders calculation form shell in simplified mode', async ({ page }) => {
    await page.goto('/member/calculation');

    await expect(page.locator('ion-header ion-title')).toContainText('价格计算');
    await expect(page.locator('ion-segment-button')).toHaveCount(2);
    await expect(page.locator('ion-segment-button:nth-of-type(1) ion-label')).toContainText('精简模式');
    await expect(page.locator('ion-segment-button:nth-of-type(2) ion-label')).toContainText('完整模式');
    await expect(page.locator('ion-button[type="submit"]')).toBeVisible();
  });

  test('renders problem-list shell', async ({ page }) => {
    await page.goto('/member/problem-list');

    await expect(page.locator('ion-header ion-title')).toContainText('问题跟进');
    await expect(page.locator('ion-searchbar')).toBeVisible();
    await expect(page.locator('ion-infinite-scroll')).toBeVisible();
  });

  test('renders warehouse-application shell', async ({ page }) => {
    await page.goto('/member/warehouse-application');

    await expect(page.locator('ion-header ion-title')).toContainText('入仓申请');
    await expect(page.locator('ion-content ion-card')).toContainText('香港仓库');
    await expect(page.locator('ion-fab ion-fab-button')).toBeVisible();
  });

  test('renders return-list shell', async ({ page }) => {
    await page.goto('/member/return-list');

    await expect(page.locator('ion-header ion-title')).toContainText('退货管理');
    await expect(page.locator('ion-segment-button')).toHaveCount(2);
    await expect(page.locator('ion-segment-button:nth-of-type(1) ion-label')).toContainText('已完成');
    await expect(page.locator('ion-segment-button:nth-of-type(2) ion-label')).toContainText('退货中');
    await expect(page.locator('ion-searchbar')).toBeVisible();
  });

  test('renders delivery-record shell', async ({ page }) => {
    await page.goto('/member/delivery-record/list');

    await expect(page.locator('ion-header ion-title')).toContainText('交货记录');
    await expect(page.locator('ion-searchbar')).toBeVisible();
    await expect(page.locator('ion-infinite-scroll')).toBeVisible();
    await expect(page.locator('ion-fab ion-fab-button')).toBeVisible();
  });

  test('renders wechat-pay-list shell', async ({ page }) => {
    await page.goto('/member/wechat-pay-list');

    await expect(page.locator('ion-header ion-title')).toContainText('支付记录');
    await expect(page.locator('ion-content')).toBeVisible();
    await expect(page.locator('ion-infinite-scroll')).toBeVisible();
  });

  test('renders unread-message-list shell', async ({ page }) => {
    await page.goto('/member/unread-message-list');

    await expect(page.locator('ion-header ion-title')).toContainText('未读消息');
    await expect(page.locator('ion-content')).toContainText('咨询业务');
    await expect(page.locator('ion-content')).toContainText('单号消息');
  });

  test('renders sign-the-contract shell', async ({ page }) => {
    await page.goto('/member/sign-the-contract');

    await expect(page.locator('ion-header ion-title')).toContainText('合同签署');
    await expect(page.locator('ion-segment-button')).toHaveCount(3);
    await expect(page.locator('ion-segment-button:nth-of-type(1) ion-label')).toContainText('待签署');
    await expect(page.locator('ion-segment-button:nth-of-type(2) ion-label')).toContainText('已签署');
    await expect(page.locator('ion-segment-button:nth-of-type(3) ion-label')).toContainText('其他');
  });

  test('renders reset-password shell', async ({ page }) => {
    await page.goto('/member/reset-password');

    await expect(page.locator('ion-header ion-title')).toContainText('重置密码');
    await expect(page.locator('ion-segment-button')).toHaveCount(3);
    await expect(page.locator('ion-segment-button:nth-of-type(1) ion-label')).toContainText('验证身份');
    await expect(page.locator('form')).toBeVisible();
  });

  test('renders return-waiting shell', async ({ page }) => {
    await page.goto('/member/return-waiting');

    await expect(page.locator('ion-header ion-title')).toContainText('待退货列表');
    await expect(page.locator('ion-footer ion-toolbar')).toBeVisible();
    await expect(page.locator('ion-footer ion-checkbox')).toBeVisible();
  });

  test('renders unread-message-list1 shell', async ({ page }) => {
    await page.goto('/member/unread-message-list1');

    await expect(page.locator('ion-header ion-title')).toContainText('单号消息');
    await expect(page.locator('ion-content')).toBeVisible();
  });
});
