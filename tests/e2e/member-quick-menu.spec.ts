import { expect, test } from '@playwright/test';

const apiBase = 'https://api.sl56.com/api';

test.describe('member quick menu customization', () => {
  test('persists custom quick menu order after reload', async ({ page }) => {
    await page.route(`${apiBase}/**`, async route => {
      const url = route.request().url();

      if (url.includes('/Account/IsAuthenticated')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({})
        });
        return;
      }

      if (url.includes('/UserHome/Load')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            CustomerNo: 'IT_TEST',
            Classify: 0,
            CurrencyAmount: [],
            WaitToSignTaskCount: 0,
            UnReadMessageCount: 0,
            Quantity1: 0,
            Quantity2: 0
          })
        });
        return;
      }

      if (url.includes('/Notice/GetUnreadCount')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: '0'
        });
        return;
      }

      await route.continue();
    });

    await page.goto('/app/tabs/member');

    const header = page.locator('section.menu-section').first();
    await expect(header.locator('h2')).toContainText('常用功能');
    await header.locator('button.quick-manage-btn').click();

    const chooseSection = page.locator('section.quick-manage-section').filter({
      has: page.locator('h3', { hasText: '选择常用功能' })
    });
    const priceRow = chooseSection.locator('ion-item', { hasText: '价格查询' });

    await priceRow.locator('ion-checkbox').click();
    await priceRow.locator('ion-checkbox').click();

    await page.locator('ion-modal ion-button', { hasText: '保存' }).click();

    await expect(header.locator('.menu-title').first()).toHaveText('交货清单确认');

    await page.reload();

    const headerAfterReload = page.locator('section.menu-section').first();
    await expect(headerAfterReload.locator('.menu-title').first()).toHaveText('交货清单确认');
  });

  test('resets quick menu to default list with wechat pay', async ({ page }) => {
    await page.route(`${apiBase}/**`, async route => {
      const url = route.request().url();

      if (url.includes('/Account/IsAuthenticated')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({})
        });
        return;
      }

      if (url.includes('/UserHome/Load')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            CustomerNo: 'IT_TEST',
            Classify: 0,
            CurrencyAmount: [],
            WaitToSignTaskCount: 0,
            UnReadMessageCount: 0,
            Quantity1: 0,
            Quantity2: 0
          })
        });
        return;
      }

      if (url.includes('/Notice/GetUnreadCount')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: '0'
        });
        return;
      }

      await route.continue();
    });

    await page.goto('/app/tabs/member');

    const quickSection = page.locator('section.menu-section').first();
    await expect(quickSection.locator('h2')).toContainText('常用功能');
    await quickSection.locator('button.quick-manage-btn').click();

    const chooseSection = page.locator('section.quick-manage-section').filter({
      has: page.locator('h3', { hasText: '选择常用功能' })
    });
    const wechatPayRow = chooseSection.locator('ion-item', { hasText: '微信支付' });
    const noticeRow = chooseSection.locator('ion-item', { hasText: '业务公告' });

    await wechatPayRow.locator('ion-checkbox').click();
    await noticeRow.locator('ion-checkbox').click();
    await page.locator('ion-modal ion-button', { hasText: '保存' }).click();

    await expect(quickSection.locator('.menu-title')).toContainText(['业务公告']);

    await quickSection.locator('button.quick-reset-btn').click();

    const quickTitles = quickSection.locator('.menu-title');
    await expect(quickTitles).toHaveCount(6);
    await expect(quickTitles).toHaveText([
      '价格查询',
      '交货清单确认',
      '问题跟进',
      '交货记录',
      '偏远查询',
      '微信支付',
    ]);
  });
});
