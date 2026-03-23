import { AppPage } from './app.po';
import { browser } from 'protractor';

describe('upgrade regression smoke', () => {
  let page: AppPage;

  beforeAll(async () => {
    await browser.waitForAngularEnabled(false);
  });

  beforeEach(() => {
    page = new AppPage();
  });

  it('redirects root traffic into the upgraded tab shell', async () => {
    await page.navigateTo('/');
    await page.waitForUrlContains('/app/tabs/home');
    await page.waitForVisible('ion-tab-bar');

    expect(await page.getCurrentUrl()).toContain('/app/tabs/home');
    expect(await page.getText('ion-tab-button[tab="home"] ion-label')).toContain('首页');
    expect(await page.getText('ion-tab-button[tab="member"] ion-label')).toContain('会员中心');
  });

  it('renders the swiper-based home hero and news list', async () => {
    await page.navigateTo('/app/tabs/home');
    await page.waitForVisible('swiper.hero-swiper');
    await page.waitForVisible('ion-list-header h2');

    expect(await page.count('swiper.hero-swiper img')).toBeGreaterThan(0);
    expect(await page.getText('ion-list-header h2')).toContain('升蓝动态');
    expect(await page.count('ion-list ion-item')).toBeGreaterThan(0);
  });

  it('renders invoice preview controls around the migrated pdf viewer', async () => {
    await page.navigateTo('/member/invoice-preview?rgdId=1&problemId=2&isWeAppFile=false&filePath=test.pdf');
    await page.waitForVisible('ion-header ion-title');
    await page.waitForVisible('pdf-viewer');
    await page.waitForVisible('ion-footer ion-title');

    expect(await page.getText('ion-header ion-title')).toContain('发票预览');
    expect(await page.isPresent('pdf-viewer')).toBe(true);
    expect(await page.getText('ion-header ion-buttons[slot="start"] ion-button')).toContain('重选');
    expect(await page.getText('ion-header ion-buttons[slot="end"] ion-button')).toContain('确认');
    expect(await page.getText('ion-footer ion-title')).toContain('当前页：1/共 0 页');
  });

  it('renders the member modify-password form shell', async () => {
    await page.navigateTo('/member/modify-password');
    await page.waitForVisible('ion-header ion-title');
    await page.waitForVisible('form');
    await page.waitForVisible('ion-button[type="submit"]');

    expect(await page.getText('ion-header ion-title')).toContain('修改密码');
    expect(await page.count('form ion-item')).toBe(3);
    expect(await page.getText('ion-item:nth-of-type(1) ion-label')).toContain('旧登录密码');
    expect(await page.getText('ion-item:nth-of-type(2) ion-label')).toContain('新登录密码');
    expect(await page.getText('ion-item:nth-of-type(3) ion-label')).toContain('确认新登录密码');
    expect(await page.getAttribute('ion-button[type="submit"]', 'disabled')).toBe('true');
  });

  it('renders the member modify-delivery-password form shell', async () => {
    await page.navigateTo('/member/modify-deliverypassword');
    await page.waitForVisible('ion-header ion-title');
    await page.waitForVisible('form');
    await page.waitForVisible('ion-button[type="submit"]');

    expect(await page.getText('ion-header ion-title')).toContain('修改密码');
    expect(await page.count('form ion-item')).toBe(3);
    expect(await page.getText('ion-item:nth-of-type(1) ion-label')).toContain('旧交货密码');
    expect(await page.getText('ion-item:nth-of-type(2) ion-label')).toContain('新交货密码');
    expect(await page.getText('ion-item:nth-of-type(3) ion-label')).toContain('确认新交货密码');
    expect(await page.getAttribute('ion-button[type="submit"]', 'disabled')).toBe('true');
  });

  it('renders the sub-account management shell and add entry', async () => {
    await page.navigateTo('/member/sub-account');
    await page.waitForVisible('ion-header ion-title');
    await page.waitForVisible('ion-toolbar ion-buttons[slot="end"] ion-button');
    await page.waitForVisible('ion-list');

    expect(await page.getText('ion-header ion-title')).toContain('子账号管理');
    expect(await page.getText('ion-toolbar ion-buttons[slot="end"] ion-button')).toContain('新增');
    expect(await page.isPresent('ion-list')).toBe(true);
  });

  it('renders the notice list shell and infinite scroll container', async () => {
    await page.navigateTo('/member/notice-list');
    await page.waitForVisible('ion-header ion-title');
    await page.waitForVisible('ion-list');
    await page.waitForVisible('ion-infinite-scroll');

    expect(await page.getText('ion-header ion-title')).toContain('业务公告');
    expect(await page.isPresent('ion-infinite-scroll')).toBe(true);
  });

  it('renders the template download shell and infinite scroll container', async () => {
    await page.navigateTo('/member/template-list');
    await page.waitForVisible('ion-header ion-title');
    await page.waitForVisible('ion-list');
    await page.waitForVisible('ion-infinite-scroll');

    expect(await page.getText('ion-header ion-title')).toContain('模板下载');
    expect(await page.isPresent('ion-infinite-scroll')).toBe(true);
  });

  it('renders the price list shell and download footer area', async () => {
    await page.navigateTo('/member/price-list');
    await page.waitForVisible('ion-header ion-title');
    await page.waitForVisible('ion-content');
    await page.waitForVisible('ion-infinite-scroll');

    expect(await page.getText('ion-header ion-title')).toContain('查看报价');
    expect(await page.isPresent('ion-infinite-scroll')).toBe(true);
  });

  it('renders the weight bill list shell', async () => {
    await page.navigateTo('/member/weight-bill-list');
    await page.waitForVisible('ion-header ion-title');
    await page.waitForVisible('ion-content');
    await page.waitForVisible('ion-toolbar');

    expect(await page.getText('ion-header ion-title')).toContain('称重记录');
    expect(await page.isPresent('ion-content')).toBe(true);
  });

  it('renders the message subscription menu entries', async () => {
    await page.navigateTo('/member/message-subscription/list');
    await page.waitForVisible('ion-header ion-title');
    await page.waitForVisible('ion-content ion-item');

    expect(await page.getText('ion-header ion-title')).toContain('消息订阅');
    expect(await page.count('ion-content ion-item')).toBe(3);
    expect(await page.getText('ion-content ion-item:nth-of-type(1) h2')).toContain('微信公众号消息');
    expect(await page.getText('ion-content ion-item:nth-of-type(2) h2')).toContain('短信消息');
    expect(await page.getText('ion-content ion-item:nth-of-type(3) h2')).toContain('邮件消息');
  });

  it('renders the remote query form shell', async () => {
    await page.navigateTo('/member/remote');
    await page.waitForVisible('ion-header ion-title');
    await page.waitForVisible('form');
    await page.waitForVisible('ion-select');
    await page.waitForVisible('ion-button[type="submit"]');

    expect(await page.getText('ion-header ion-title')).toContain('偏远查询');
    expect(await page.count('form ion-item')).toBeGreaterThan(3);
    expect(await page.getAttribute('ion-button[type="submit"]', 'disabled')).toBe('true');
  });

  it('renders the confirmation page shell with search and footer actions', async () => {
    await page.navigateTo('/member/confirmation');
    await page.waitForVisible('ion-header ion-title');
    await page.waitForVisible('ion-searchbar');
    await page.waitForVisible('ion-footer ion-toolbar');

    expect(await page.getText('ion-header ion-title')).toContain('交货清单确认');
    expect(await page.isPresent('ion-searchbar')).toBe(true);
    expect(await page.getText('ion-footer ion-button')).toContain('确认所选');
  });

  it('renders the wechat binding management shell', async () => {
    await page.navigateTo('/member/wechat-binding');
    await page.waitForVisible('ion-header ion-title');
    await page.waitForVisible('ion-list');

    expect(await page.getText('ion-header ion-title')).toContain('微信绑定管理');
    expect(await page.isPresent('ion-list')).toBe(true);
  });

  it('renders the bank slips upload shell and footer action', async () => {
    await page.navigateTo('/member/bank-slips');
    await page.waitForVisible('ion-header ion-title');
    await page.waitForVisible('ion-content');
    await page.waitForVisible('ion-infinite-scroll');
    await page.waitForVisible('ion-footer ion-button');

    expect(await page.getText('ion-header ion-title')).toContain('银行水单上传');
    expect(await page.getText('ion-footer ion-button')).toContain('上传');
  });

  it('renders the calculation form shell in simplified mode', async () => {
    await page.navigateTo('/member/calculation');
    await page.waitForVisible('ion-header ion-title');
    await page.waitForVisible('ion-segment');
    await page.waitForVisible('form');
    await page.waitForVisible('ion-button[type="submit"]');

    expect(await page.getText('ion-header ion-title')).toContain('价格计算');
    expect(await page.count('ion-segment-button')).toBe(2);
    expect(await page.getText('ion-segment-button:nth-of-type(1) ion-label')).toContain('精简模式');
    expect(await page.getText('ion-segment-button:nth-of-type(2) ion-label')).toContain('完整模式');
  });

  // ─── Batch 6: remaining stable member pages ───────────────────────────────

  it('renders the bank account info page with static card content', async () => {
    await page.navigateTo('/member/bank');
    await page.waitForVisible('ion-header ion-title');
    await page.waitForVisible('ion-content ion-card');

    expect(await page.getText('ion-header ion-title')).toContain('银行账户');
    expect(await page.count('ion-content ion-card')).toBe(2);
    expect(await page.getText('ion-content')).toContain('中国银行');
    expect(await page.getText('ion-content')).toContain('招商银行');
  });

  it('renders the wechat-pay description page with mode cards', async () => {
    await page.navigateTo('/member/wechat-pay-description');
    await page.waitForVisible('ion-header ion-title');
    await page.waitForVisible('ion-content ion-card');

    expect(await page.getText('ion-header ion-title')).toContain('支付说明');
    expect(await page.count('ion-content ion-card')).toBe(2);
    expect(await page.getText('ion-content')).toContain('输入模式');
    expect(await page.getText('ion-content')).toContain('选择模式');
  });

  it('renders the problem-list shell with searchbar and infinite scroll', async () => {
    await page.navigateTo('/member/problem-list');
    await page.waitForVisible('ion-header ion-title');
    await page.waitForVisible('ion-searchbar');
    await page.waitForVisible('ion-infinite-scroll');

    expect(await page.getText('ion-header ion-title')).toContain('问题跟进');
    expect(await page.isPresent('ion-searchbar')).toBe(true);
    expect(await page.isPresent('ion-infinite-scroll')).toBe(true);
  });

  it('renders the warehouse-application shell with tip card and add fab', async () => {
    await page.navigateTo('/member/warehouse-application');
    await page.waitForVisible('ion-header ion-title');
    await page.waitForVisible('ion-content ion-card');
    await page.waitForVisible('ion-fab ion-fab-button');

    expect(await page.getText('ion-header ion-title')).toContain('入仓申请');
    expect(await page.getText('ion-content ion-card')).toContain('香港仓库');
    expect(await page.isPresent('ion-fab ion-fab-button')).toBe(true);
  });

  // ─── Batch 7: remaining list/record pages ─────────────────────────────────

  it('renders the return-list shell with segment tabs and searchbar', async () => {
    await page.navigateTo('/member/return-list');
    await page.waitForVisible('ion-header ion-title');
    await page.waitForVisible('ion-segment');
    await page.waitForVisible('ion-searchbar');
    await page.waitForVisible('ion-infinite-scroll');

    expect(await page.getText('ion-header ion-title')).toContain('退货管理');
    expect(await page.count('ion-segment-button')).toBe(2);
    expect(await page.getText('ion-segment-button:nth-of-type(1) ion-label')).toContain('已完成');
    expect(await page.getText('ion-segment-button:nth-of-type(2) ion-label')).toContain('退货中');
    expect(await page.isPresent('ion-searchbar')).toBe(true);
  });

  it('renders the delivery-record shell with searchbar, list and batch return fab', async () => {
    await page.navigateTo('/member/delivery-record/list');
    await page.waitForVisible('ion-header ion-title');
    await page.waitForVisible('ion-searchbar');
    await page.waitForVisible('ion-infinite-scroll');
    await page.waitForVisible('ion-fab ion-fab-button');

    expect(await page.getText('ion-header ion-title')).toContain('交货记录');
    expect(await page.isPresent('ion-searchbar')).toBe(true);
    expect(await page.isPresent('ion-fab ion-fab-button')).toBe(true);
  });

  it('renders the wechat-pay-list shell with infinite scroll', async () => {
    await page.navigateTo('/member/wechat-pay-list');
    await page.waitForVisible('ion-header ion-title');
    await page.waitForVisible('ion-content');
    await page.waitForVisible('ion-infinite-scroll');

    expect(await page.getText('ion-header ion-title')).toContain('支付记录');
    expect(await page.isPresent('ion-infinite-scroll')).toBe(true);
  });

  it('renders the unread-message-list shell with static category entries', async () => {
    await page.navigateTo('/member/unread-message-list');
    await page.waitForVisible('ion-header ion-title');
    await page.waitForVisible('ion-content ion-list');

    expect(await page.getText('ion-header ion-title')).toContain('未读消息');
    expect(await page.getText('ion-content')).toContain('咨询业务');
    expect(await page.getText('ion-content')).toContain('单号消息');
  });

  // ─── Batch 8: final stable member pages ───────────────────────────────────

  it('renders the sign-the-contract shell with 3-tab segment', async () => {
    await page.navigateTo('/member/sign-the-contract');
    await page.waitForVisible('ion-header ion-title');
    await page.waitForVisible('ion-content ion-segment');

    expect(await page.getText('ion-header ion-title')).toContain('合同签署');
    expect(await page.count('ion-segment-button')).toBe(3);
    expect(await page.getText('ion-segment-button:nth-of-type(1) ion-label')).toContain('待签署');
    expect(await page.getText('ion-segment-button:nth-of-type(2) ion-label')).toContain('已签署');
    expect(await page.getText('ion-segment-button:nth-of-type(3) ion-label')).toContain('其他');
  });

  it('renders the reset-password shell with 3-step segment', async () => {
    await page.navigateTo('/member/reset-password');
    await page.waitForVisible('ion-header ion-title');
    await page.waitForVisible('ion-content ion-segment');

    expect(await page.getText('ion-header ion-title')).toContain('重置密码');
    expect(await page.count('ion-segment-button')).toBe(3);
    expect(await page.getText('ion-segment-button:nth-of-type(1) ion-label')).toContain('验证身份');
    expect(await page.isPresent('form')).toBe(true);
  });

  it('renders the return-waiting shell with footer toolbar', async () => {
    await page.navigateTo('/member/return-waiting');
    await page.waitForVisible('ion-header ion-title');
    await page.waitForVisible('ion-footer ion-toolbar');

    expect(await page.getText('ion-header ion-title')).toContain('待退货列表');
    expect(await page.isPresent('ion-footer ion-toolbar')).toBe(true);
    expect(await page.isPresent('ion-footer ion-checkbox')).toBe(true);
  });

  it('renders the unread-message-list1 shell for tracking-number messages', async () => {
    await page.navigateTo('/member/unread-message-list1');
    await page.waitForVisible('ion-header ion-title');
    await page.waitForVisible('ion-content');

    expect(await page.getText('ion-header ion-title')).toContain('单号消息');
    expect(await page.isPresent('ion-content')).toBe(true);
  });

  // ─── Interaction assertions: form validation behaviour ────────────────────

  it('modify-password: typing valid credentials enables the submit button', async () => {
    await page.navigateTo('/member/modify-password');
    await page.waitForVisible('form');
    await page.waitForVisible('ion-button[type="submit"]');

    // Initially disabled because all fields are empty
    expect(await page.getAttribute('ion-button[type="submit"]', 'disabled')).toBe('true');

    // Fill: old password (any non-empty), new passwords must satisfy
    // pattern: 8-16 chars, mix of letters and digits
    await page.fillForm('app-modify-password', 'myForm', { password: 'oldPass1', newPassword1: 'NewPass12', newPassword2: 'NewPass12' });

    // Wait for Angular reactive form to become valid and button to enable
    await page.waitForEnabled('ion-button[type="submit"]');
    expect(await page.getAttribute('ion-button[type="submit"]', 'disabled')).toBeNull();
  });

  it('modify-deliverypassword: typing valid credentials enables the submit button', async () => {
    await page.navigateTo('/member/modify-deliverypassword');
    await page.waitForVisible('form');
    await page.waitForVisible('ion-button[type="submit"]');

    // Initially disabled
    expect(await page.getAttribute('ion-button[type="submit"]', 'disabled')).toBe('true');

    // delivery password pattern: exactly 6 digits
    await page.fillForm('app-modify-deliverypassword', 'myForm', { password: 'oldpassword', newPassword1: '123456', newPassword2: '123456' });

    await page.waitForEnabled('ion-button[type="submit"]');
    expect(await page.getAttribute('ion-button[type="submit"]', 'disabled')).toBeNull();
  });

  it('reset-password step 1: typing valid mobile and 6-digit code enables submit', async () => {
    await page.navigateTo('/member/reset-password');
    await page.waitForVisible('form');
    await page.waitForVisible('ion-button[type="submit"]');

    // Initially disabled
    expect(await page.getAttribute('ion-button[type="submit"]', 'disabled')).toBe('true');

    // mobile: valid Chinese phone number; code: 6-digit number
    await page.fillForm('app-reset-password', 'myForm2', { mobile: '13812345678', code: '123456' });

    await page.waitForEnabled('ion-button[type="submit"]');
    expect(await page.getAttribute('ion-button[type="submit"]', 'disabled')).toBeNull();
  });
});
