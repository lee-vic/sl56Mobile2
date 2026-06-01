import { expect, test } from '@playwright/test';

const apiBase = 'https://api.sl56.com/api';

test.describe('delivery -> return flow', () => {
  test('shows clear hint and uses bottom entry after adding from delivery record', async ({ page }) => {
    const waitingIds = new Set<number>();

    await page.route(`${apiBase}/**`, async route => {
      const request = route.request();
      const url = request.url();

      if (url.includes('/DeliveryRecord/GetList')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              Id: 101,
              ReferenceNumber: 'REF-101',
              TrackNumber: 'TRK-101',
              CountryNameCN: '美国',
              PriceName: '标准渠道',
              Weight: '1.2',
              Date: '2026-06-01',
              Amount: '25.00'
            }
          ])
        });
        return;
      }

      if (url.includes('/Return/GetWaitReturnList')) {
        const response = Array.from(waitingIds).map(id => ({ Id: id }));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(response)
        });
        return;
      }

      if (url.includes('/Return/AddToWaitReturnList')) {
        const parsed = new URL(url);
        const ids = (parsed.searchParams.get('ids') || '')
          .split(',')
          .map(value => Number(value.trim()))
          .filter(value => Number.isFinite(value));

        ids.forEach(id => waitingIds.add(id));

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ IsSuccess: true })
        });
        return;
      }

      await route.continue();
    });

    await page.goto('/member/delivery-record/list');

    await expect(page.locator('ion-buttons[slot="end"] ion-button')).toContainText('我要退货');

    await page.locator('ion-buttons[slot="end"] ion-button').click();
    await expect(page.locator('ion-buttons[slot="end"] ion-button')).toContainText('结束勾选');

    await page.locator('ion-item.record-head ion-checkbox').first().click();
    await page.locator('ion-footer .footer-action-row ion-button').filter({ hasText: '加入待退货' }).click();

    await expect(page.locator('ion-toast')).toContainText('已加入待退货 1 条，请从底部进入待退货继续');
    await expect(page.locator('ion-toast button')).toHaveCount(0);

    await page.locator('button.footer-summary-link').click();
    await page.waitForURL('**/member/return-waiting');
    await expect(page.locator('app-return-waiting ion-header ion-title')).toContainText('待退货列表');
  });

  test('disables submit when no records are selected', async ({ page }) => {
    await page.route(`${apiBase}/**`, async route => {
      const url = route.request().url();

      if (url.includes('/DeliveryRecord/GetList')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              Id: 301,
              ReferenceNumber: 'REF-301',
              TrackNumber: 'TRK-301',
              CountryNameCN: '英国',
              PriceName: '经济渠道',
              Weight: '0.8',
              Date: '2026-06-01',
              Amount: '18.00'
            }
          ])
        });
        return;
      }

      if (url.includes('/Return/GetWaitReturnList')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
        return;
      }

      await route.continue();
    });

    await page.goto('/member/delivery-record/list');
    await page.locator('ion-buttons[slot="end"] ion-button').click();
    const submitBtn = page.locator('ion-footer .footer-action-row ion-button').filter({ hasText: '加入待退货' });

    await expect(submitBtn).toHaveAttribute('disabled', '');
  });
});
