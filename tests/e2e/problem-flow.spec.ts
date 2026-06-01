import { expect, test } from '@playwright/test';

const apiBase = 'https://api.sl56.com/api';

test.describe('problem flow', () => {
  test('searches and opens problem detail from list', async ({ page }) => {
    await page.route(`${apiBase}/**`, async route => {
      const url = route.request().url();

      if (url.includes('/Problem/GetList')) {
        const parsed = new URL(url);
        const key = (parsed.searchParams.get('key') || '').trim();
        const all = [
          {
            Id: 901,
            No: 'P-901',
            ProblemList: [{ ObjectId: 3001, ObjectName: '发票缺失' }]
          },
          {
            Id: 902,
            No: 'P-902',
            ProblemList: [{ ObjectId: 3002, ObjectName: '渠道变更' }]
          }
        ];

        const filtered = key ? all.filter(item => item.No.includes(key)) : all;

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(filtered)
        });
        return;
      }

      if (url.includes('/Problem/GetProblemDetail')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            Id: 901,
            CountryName: '美国',
            PriceName: '标准渠道',
            Problem: {
              ObjectId: 3001,
              ObjectName: '发票缺失',
              Status: 0,
              Amount: 0,
              ProcessTypeList: [2],
              ProcessSetting2: [{ Item1: '补充说明', Item2: '文字说明' }],
              ProcessSetting4: [],
              Pages: [{ Item1: 'Page1', Item2: '更新信息' }]
            },
            ProcessResult: {
              Id: 1001,
              Type1Result: { Value: null },
              Type2Result: { Items: [] },
              Type3Result: { AttachmentTypeId: '', FileName: null, Value: null },
              Type4Result: { Values: [] }
            }
          })
        });
        return;
      }

      await route.continue();
    });

    await page.goto('/member/problem-list');

    await expect(page.locator('.shipment-card')).toHaveCount(2);

    await page.locator('ion-searchbar input').fill('P-901');
    await page.waitForTimeout(350);
    await expect(page.locator('.shipment-card')).toHaveCount(1);

    await page.locator('.problem-item').first().click();
    await page.waitForURL('**/member/problem-detail/**');
    await expect(page.locator('app-problem-detail .hero-name')).toContainText('发票缺失');
  });

  test('submits problem self-service form successfully', async ({ page }) => {
    await page.route(`${apiBase}/**`, async route => {
      const request = route.request();
      const url = request.url();

      if (url.includes('/Problem/GetList')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              Id: 905,
              No: 'P-905',
              ProblemList: [{ ObjectId: 3100, ObjectName: '补充资料' }]
            }
          ])
        });
        return;
      }

      if (url.includes('/Problem/GetProblemDetail')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            Id: 905,
            Problem: {
              ObjectId: 3100,
              ObjectName: '补充资料',
              Status: 0,
              Amount: 0,
              ProcessTypeList: [2],
              ProcessSetting2: [{ Item1: '处理说明', Item2: '请填写' }],
              ProcessSetting4: [],
              Pages: [{ Item1: 'Page1', Item2: '更新信息' }]
            },
            ProcessResult: {
              Id: 3100,
              Type1Result: { Value: null },
              Type2Result: { Items: [] },
              Type3Result: { AttachmentTypeId: '', FileName: null, Value: null },
              Type4Result: { Values: [] }
            }
          })
        });
        return;
      }

      if (url.includes('/Problem/IsWeAppUploadFile')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(false)
        });
        return;
      }

      if (url.includes('/Problem/Complete')) {
        const payload = request.postDataJSON() as { Type2Result?: { Items?: Array<{ Name: string; Value: string }> } };
        const value = payload?.Type2Result?.Items?.[0]?.Value;
        expect(value).toBe('已补充处理说明');

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ Result: true })
        });
        return;
      }

      await route.continue();
    });

    await page.goto('/member/problem-list');
    await page.locator('.problem-item').first().click();

    await page.waitForURL('**/member/problem-detail/**');
    await page.getByRole('textbox').first().fill('已补充处理说明');
    await page.locator('app-problem-detail ion-footer ion-button').filter({ hasText: '提交处理结果' }).click();

    await expect(page.locator('app-problem-detail .done-title')).toContainText('问题已完成处理');
  });
});
