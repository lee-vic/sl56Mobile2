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
            PendingConfirmationCount: 0,
            ProblemShipmentCount: 0,
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

    await expect(header.locator('.menu-title').first()).toHaveText('业务公告');

    await page.reload();

    const headerAfterReload = page.locator('section.menu-section').first();
    await expect(headerAfterReload.locator('.menu-title').first()).toHaveText('业务公告');
  });

  test('resets quick menu to default business shortcuts', async ({ page }) => {
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
    const remoteRow = chooseSection.locator('ion-item', { hasText: '偏远查询' });
    const customerServiceRow = chooseSection.locator('ion-item', { hasText: '联系客服' });

    await remoteRow.locator('ion-checkbox').click();
    await customerServiceRow.locator('ion-checkbox').click();
    await page.locator('ion-modal ion-button', { hasText: '保存' }).click();

    await expect(quickSection.locator('.menu-title')).toContainText(['联系客服']);

    await quickSection.locator('button.quick-reset-btn').click();

    const quickTitles = quickSection.locator('.menu-title');
    await expect(quickTitles).toHaveCount(6);
    await expect(quickTitles).toHaveText([
      '价格查询',
      '业务公告',
      '快速预报',
      '交货记录',
      '退货管理',
      '偏远查询',
    ]);
    await expect(page.locator('.menu-title', { hasText: '交货清单确认' })).toHaveCount(0);
    await expect(page.locator('.menu-title', { hasText: '问题跟进' })).toHaveCount(0);
    await expect(page.locator('.menu-title', { hasText: '合同签署' })).toHaveCount(0);
    await expect(page.locator('.menu-title', { hasText: '微信支付' })).toHaveCount(0);
  });
});
