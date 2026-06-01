import { expect, test } from '@playwright/test';

const apiBase = 'https://api.sl56.com/api';

test.describe('confirmation flow', () => {
  test('filters selected items by segment', async ({ page }) => {
    await page.route(`${apiBase}/**`, async route => {
      const url = route.request().url();

      if (url.includes('/Confirmation/GetReceiveGoodsDetailList')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              Id: 501,
              ReferenceNumber: 'CF-501',
              CountryName: '美国',
              PriceName: '标准渠道',
              Weight: '1.1',
              Date: '2026-06-01',
              Amount: '32.50',
              Selected: true
            },
            {
              Id: 502,
              ReferenceNumber: 'CF-502',
              CountryName: '英国',
              PriceName: '经济渠道',
              Weight: '0.9',
              Date: '2026-06-01',
              Amount: '18.00',
              Selected: false
            }
          ])
        });
        return;
      }

      if (url.includes('/Confirmation/Confirm')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
        return;
      }

      await route.continue();
    });

    await page.goto('/member/confirmation');

    await expect(page.locator('ion-segment')).toBeVisible();
    await expect(page.locator('ion-card.record-card')).toHaveCount(2);

    await page.locator('ion-segment-button[value="selected"]').click();
    await expect(page.locator('ion-card.record-card')).toHaveCount(1);
    await expect(page.locator('ion-card.record-card .record-top-line')).toContainText('CF-501');
  });

  test('confirms selected records and shows success toast', async ({ page }) => {
    await page.route(`${apiBase}/**`, async route => {
      const request = route.request();
      const url = request.url();

      if (url.includes('/Confirmation/GetReceiveGoodsDetailList')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              Id: 801,
              ReferenceNumber: 'CF-801',
              CountryName: '加拿大',
              PriceName: '优先渠道',
              Weight: '1.3',
              Date: '2026-06-01',
              Amount: '48.00',
              Selected: false
            }
          ])
        });
        return;
      }

      if (url.includes('/Confirmation/Confirm')) {
        const payload = request.postDataJSON() as { SelectIdList?: string };
        expect(payload.SelectIdList).toBe('801');

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
        return;
      }

      await route.continue();
    });

    await page.goto('/member/confirmation');

    await page.locator('ion-card.record-card ion-checkbox').first().click();
    await page.locator('ion-footer ion-button').filter({ hasText: '确认所选' }).click();

    await expect(page.locator('ion-alert')).toBeVisible();
    await page.locator('ion-alert button.alert-button').filter({ hasText: '确认' }).click();

    await expect(page.locator('ion-toast')).toContainText('已确认1票运单');
  });
});
