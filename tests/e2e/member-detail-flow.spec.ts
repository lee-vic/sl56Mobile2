import { expect, test } from '@playwright/test';

const apiBase = 'https://api.sl56.com/api';

test.describe('member detail flow', () => {
  test('filters problems on delivery record detail page', async ({ page }) => {
    await page.route(`${apiBase}/**`, async route => {
      const url = route.request().url();

      if (url.includes('/DeliveryRecord/Detail')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ObjectId: 9001,
            ObjectNo: 'ORD-9001',
            CountryName: '美国',
            TrackNumber: 'TRK-9001',
            Piece: 1,
            ProductType: '包裹',
            AttributeNames: '普货',
            Date: '2026-06-01',
            Sizes: [],
            IsShowPackageTracks: false,
            Tracks: [],
            AccountReceivableDetails: [],
            Problems: [
              { Name: 'A', StatusName: '处理中', Remark: '处理中问题' },
              { Name: 'B', StatusName: '已处理', Remark: '已完成问题' }
            ],
            IsReturnCustomer: true,
            AllowDownloadLabel: false,
            HasLabel: false,
            ChatRecords: []
          })
        });
        return;
      }

      await route.continue();
    });

    await page.goto('/member/delivery-record/detail/9001');

    await expect(page.locator('#section-5 ion-list ion-item')).toHaveCount(2);

    await page.locator('#section-5 .problem-filter-row ion-chip').filter({ hasText: '处理中' }).click();
    await expect(page.locator('#section-5 ion-list ion-item')).toHaveCount(1);
    await expect(page.locator('#section-5 ion-list ion-item')).toContainText('处理中');

    await page.locator('#section-5 .problem-filter-row ion-chip').filter({ hasText: '已处理' }).click();
    await expect(page.locator('#section-5 ion-list ion-item')).toHaveCount(1);
    await expect(page.locator('#section-5 ion-list ion-item')).toContainText('已处理');
  });
});
