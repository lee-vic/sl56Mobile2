import { expect, test } from '@playwright/test';

const apiBase = 'https://api.sl56.com/api';

test.describe('wechat pay flow', () => {
  test('updates selection amount and opens pay history list', async ({ page }) => {
    await page.route(`${apiBase}/**`, async route => {
      const url = route.request().url();

      if (url.includes('/WeChatPay/Query')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            CustomerName: 'IT_TEST',
            Amount: '36.00',
            Amount1: 1,
            Commission: '0.72',
            TotalAmount: '36.72',
            WXPaymentCommission: true,
            WXPaymentCommissionRate: 0.02,
            IsRelease: false,
            ReceiveGoodsDetailList: [
              { Id: 101, ReferenceNumber: 'WB-101', Amount: '16.00', Selected: true },
              { Id: 102, ReferenceNumber: 'WB-102', Amount: '20.00', Selected: true }
            ]
          })
        });
        return;
      }

      if (url.includes('/WeChatPay/GetPrductTypes')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { Key: 1, Value: '国际快递' },
            { Key: 2, Value: '空运专线' }
          ])
        });
        return;
      }

      if (url.includes('/UserHome/Load')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            CurrencyAmount: [
              { Id: 1, Name: '人民币', Amount: 0 },
              { Id: 2, Name: '美元', Amount: 12.6 }
            ]
          })
        });
        return;
      }

      if (url.includes('/WeChatPay/History')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              ObjectNo: 'WX-0001',
              Status: '支付成功',
              FreightAmount: 36,
              CommissionAmount: 0.72,
              TotalAmount: 36.72,
              Date: '2026-06-02 10:00:00'
            }
          ])
        });
        return;
      }

      await route.continue();
    });

    await page.goto('/member/wechat-pay/0?cid=1');

    await expect(page.locator('ion-title')).toContainText('微信支付');
    await expect(page.locator('.selection-summary')).toContainText('已选 2 件');

    await page.locator('.all-select-item ion-checkbox').click();

    await expect(page.locator('.selection-summary')).toHaveCount(0);
    await expect(page.locator('.editable-state')).toBeVisible();

    await page.locator('ion-button.history-btn').click();
    await page.waitForURL('**/member/wechat-pay-list');

    await expect(page.locator('.record-card')).toHaveCount(1);
    await expect(page.locator('.status-badge')).toContainText('支付成功');
  });

  test('shows list error state then recovers on retry', async ({ page }) => {
    let historyRequestCount = 0;

    await page.route(`${apiBase}/**`, async route => {
      const url = route.request().url();

      if (url.includes('/WeChatPay/History')) {
        historyRequestCount += 1;
        if (historyRequestCount === 1) {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ Message: 'server error' })
          });
          return;
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              ObjectNo: 'WX-RECOVER',
              Status: '支付成功',
              FreightAmount: 20,
              CommissionAmount: 0,
              TotalAmount: 20,
              Date: '2026-06-02 11:00:00'
            }
          ])
        });
        return;
      }

      await route.continue();
    });

    await page.goto('/member/wechat-pay-list');

    await expect(page.locator('.error-title')).toContainText('记录加载失败');

    await page.getByRole('button', { name: '重新加载' }).click();

    await expect(page.locator('.record-card')).toHaveCount(1);
    await expect(page.locator('.record-no')).toContainText('WX-RECOVER');
  });
});
