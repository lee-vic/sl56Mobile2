import { expect, test } from '@playwright/test';

const apiBase = 'https://api.sl56.com/api';
const importManifestBase = `${apiBase}/ImportManifest`;

/**
 * Helper: set up standard API route interception for import-manifest E2E tests.
 */
async function setupImportManifestRoutes(page: any) {
  await page.route(`${apiBase}/**`, async (route: any) => {
    const url = route.request().url();

    // Auth
    if (url.includes('/Account/IsAuthenticated')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
      return;
    }

    // User home
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
        }),
      });
      return;
    }

    // Unread notice count
    if (url.includes('/Notice/GetUnreadCount')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '0',
      });
      return;
    }

    // Import Manifest list
    if (url.includes(`${importManifestBase}/GetList`)) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          TotalRecords: 3,
          Rows: [
            {
              Id: 1,
              ObjectNo: 'TEST001',
              CountryName: 'USA',
              ModeOfTransportName: 'Air',
              CustomerPriceCode: 'PRICE01',
              Piece: 3,
              ContentTypeName: '包裹',
              ContentType: 1,
              PostalCode: '90001',
              CustomerExpressNo: '',
              DeclaredValue: '100.00',
              StatusName: '待交货',
              StatusCode: 0,
              ForwardingDocumentCount: 0,
              IsLabelPrinted: false,
              CreateAt: '2025-06-01',
            },
            {
              Id: 2,
              ObjectNo: 'TEST002',
              CountryName: 'UK',
              ModeOfTransportName: 'Sea',
              CustomerPriceCode: 'PRICE02',
              Piece: 2,
              ContentTypeName: '文件',
              ContentType: 0,
              PostalCode: '',
              CustomerExpressNo: '',
              DeclaredValue: '50.00',
              StatusName: '已交货',
              StatusCode: 1,
              ForwardingDocumentCount: 2,
              IsLabelPrinted: true,
              CreateAt: '2025-05-28',
            },
            {
              Id: 3,
              ObjectNo: 'TEST003',
              CountryName: 'Japan',
              ModeOfTransportName: 'Air',
              CustomerPriceCode: 'PRICE03',
              Piece: 1,
              ContentTypeName: '包裹',
              ContentType: 1,
              PostalCode: '100-0001',
              CustomerExpressNo: 'SF998877',
              DeclaredValue: '30.00',
              StatusName: 'Error',
              StatusCode: 2,
              ForwardingDocumentCount: 0,
              IsLabelPrinted: false,
              CreateAt: '2025-06-02',
            },
          ],
          Summary: { totalRecords: 3, pageIndex: 1, pageSize: 10, currentPageCount: 3 },
        }),
      });
      return;
    }

    // Country options
    if (url.includes(`${importManifestBase}/GetCountryOptions`)) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { Id: 1, Code: 'US', Name: 'USA' },
          { Id: 2, Code: 'GB', Name: 'UK' },
          { Id: 3, Code: 'JP', Name: 'Japan' },
        ]),
      });
      return;
    }

    // Customer price options
    if (url.includes(`${importManifestBase}/GetCustomerPriceOptions`)) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { Id: 1, Code: 'PRICE01', Name: 'Price A' },
          { Id: 2, Code: 'PRICE02', Name: 'Price B' },
          { Id: 3, Code: 'PRICE03', Name: 'Price C' },
        ]),
      });
      return;
    }

    // Dynamic available customer prices
    if (url.includes(`${importManifestBase}/GetAvailableCustomerPrices`)) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: '',
          items: [
            { value: 'PRICE01', text: 'PRICE01-Price A' },
            { value: 'PRICE02', text: 'PRICE02-Price B' },
          ],
        }),
      });
      return;
    }

    if (url.includes('/GetBatteryModelOptions')) {
      await route.fulfill({ json: [] });
      return;
    }

    // Attachment types
    if (url.includes(`${importManifestBase}/GetAttachmentTypes`)) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 58, name: '报关资料', isPrint: true },
          { id: 2, name: '运单', isPrint: true },
        ]),
      });
      return;
    }

    // Upload temp document
    if (url.includes(`${importManifestBase}/UploadTempDocument`)) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          filePath: '/UploadFiles/tmp-abc-123/test.pdf',
          fileName: 'test.pdf',
          attachmentTypeId: 58,
          size: 50000,
        }),
      });
      return;
    }

    // Get forwarding documents
    if (url.includes(`${importManifestBase}/GetForwardingDocuments`)) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, rows: [] }),
      });
      return;
    }

    // Validate ObjectNo
    if (url.includes(`${importManifestBase}/ValidateObjectNo`)) {
      const body = route.request().postDataJSON();
      if (body?.ObjectNo === 'DUP001') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ Success: false, ErrMsg: 'Duplicate' }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ Success: true, ErrMsg: '' }),
        });
      }
      return;
    }

    // Create
    if (url.includes(`${importManifestBase}/Create`)) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ Success: true, ErrMsg: '' }),
      });
      return;
    }

    // GetDetail
    if (url.includes(`${importManifestBase}/GetDetail`)) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ObjectId: 1,
          ObjectNo: 'TEST001',
          CustomerId: 100,
          CountryId: 1,
          CountryName: 'USA',
          ModeOfTransportId: 1,
          ModeOfTransportName: 'Air',
          CustomerPriceCode: 'PRICE01',
          Status: 0,
          StatusName: '待交货',
          Piece: 3,
          PostalCode: '90001',
          ContentType: 1,
          ContentTypeName: '包裹',
          DeclaredValue: 100,
          CustomerExpressNo: '',
          EntryType: 0,
          RequiresSeparateCustomsDeclaration: false,
          RequiresDutiesAndTaxesPrepayment: false,
          RequiresSpecialVatInvoice: false,
          WaybillCreationStatus: 0,
          TrackNumber: '',
          LabelPath: '',
          IsLabelPrinted: false,
          ForwardingDocumentCount: 0,
          CreateAt: '2025-06-01',
          LastChanged: null,
        }),
      });
      return;
    }

    await route.continue();
  });
}

test.describe('import manifest list page', () => {
  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(15_000);
  });

  test('displays list page shell with header and searchbar', async ({ page }) => {
    await setupImportManifestRoutes(page);
    await page.goto('/member/import-manifest/list');

    await expect(page.locator('ion-searchbar')).toBeVisible();
    await expect(page.locator('.forecast-item')).toHaveCount(3);
  });

  test('displays list cards with status badges', async ({ page }) => {
    await setupImportManifestRoutes(page);
    await page.goto('/member/import-manifest/list');

    await expect(page.locator('.forecast-item .item-head h2').first()).toContainText('TEST001');

    const badges = page.locator('.forecast-item ion-badge');
    await expect(badges.nth(0)).toHaveClass(/status-warning/);
    await expect(badges.nth(1)).toHaveClass(/status-success/);
    await expect(badges.nth(2)).toHaveClass(/status-danger/);
  });

  test('shows empty state when no data', async ({ page }) => {
    await page.route(`${apiBase}/**`, async (route: any) => {
      const url = route.request().url();

      if (url.includes('/Account/IsAuthenticated')) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
        return;
      }
      if (url.includes('/UserHome/Load')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            CustomerNo: 'IT_TEST', Classify: 0, CurrencyAmount: [],
            WaitToSignTaskCount: 0, UnReadMessageCount: 0, Quantity1: 0, Quantity2: 0,
          }),
        });
        return;
      }
      if (url.includes('/Notice/GetUnreadCount')) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '0' });
        return;
      }
      if (url.includes(`${importManifestBase}/GetList`)) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ TotalRecords: 0, Rows: [], Summary: { totalRecords: 0, pageIndex: 1, pageSize: 10, currentPageCount: 0 } }),
        });
        return;
      }
      await route.continue();
    });

    await page.goto('/member/import-manifest/list');

    await expect(page.locator('.state-panel')).toBeVisible();
    await expect(page.locator('.state-panel h2')).toBeVisible();
  });

  test('partial label PDF only registers included shipments', async ({ page }) => {
    await setupImportManifestRoutes(page);
    await page.route('**/GetDocumentsFile?**', route => route.fulfill({
      contentType: 'application/pdf', headers: {'X-MergePrint-Included': '1,3',
        'Access-Control-Expose-Headers': 'X-MergePrint-Included'}, body: '%PDF-1.4'
    }));
    await page.route('**/MarkPrinted', route => route.fulfill({json: {Success: true, UpdatedIds: [1,3], Message: ''}}));
    await page.goto('/member/import-manifest/list');
    await page.getByRole('button', {name: '批量选择'}).click();
    await page.getByText('全选当前页', {exact: true}).click();
    await page.getByText('生成打印 PDF', {exact: true}).click();
    await expect(page.locator('ion-alert')).toContainText('TEST002');
    await page.locator('ion-alert button').click();
    await page.getByText('登记已打印', {exact: true}).click();
    const submission = page.waitForRequest(req => req.url().endsWith('/MarkPrinted'));
    await page.locator('ion-alert button').filter({hasText: '已打印'}).click();
    expect((await submission).postDataJSON().Ids).toEqual([1,3]);
  });

  test('can enter selection mode', async ({ page }) => {
    await setupImportManifestRoutes(page);
    await page.goto('/member/import-manifest/list');

    // Enter selection mode via header button
    const selectionBtn = page.getByRole('button', { name: '批量选择' });
    await selectionBtn.click();

    await expect(page.locator('.forecast-item ion-checkbox').first()).toBeVisible();

    await page.getByRole('button', { name: '退出选择' }).click();
    await expect(page.locator('.forecast-item ion-checkbox').first()).not.toBeVisible();
  });
});

test.describe('import manifest form page', () => {
  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(15_000);
  });

  test('displays create form shell with searchbar and card toggle', async ({ page }) => {
    await setupImportManifestRoutes(page);
    await page.goto('/member/import-manifest/form');

    // Required fields should be present
    await expect(page.locator('ion-input[formControlName="ObjectNo"]')).toBeVisible();
    await expect(page.locator('ion-input[formControlName="Piece"]')).toBeVisible();

    // Country and price should use searchbar (autocomplete)
    await expect(page.locator('ion-searchbar').first()).toBeVisible();

    // ContentType should use card toggle
    await expect(page.locator('.ct-card').first()).toBeVisible();
    await expect(page.locator('.ct-card')).toHaveCount(2);

    // Attachment section should be visible
    await expect(page.locator('.attachment-empty')).toBeVisible();

    // Save button
    await expect(page.locator('ion-footer ion-button')).toBeVisible();
  });

  test('calculated quote restores shipping conditions and zero declared value', async ({ page }) => {
    await setupImportManifestRoutes(page);
    await page.goto('/member/import-manifest/form?price=PRICE01&country=1&weight=2.5&piece=3&type=1&value=0&prepaid=1');
    await expect(page.locator('ion-input[formControlName="Weight"] input')).toHaveValue('2.5');
    await expect(page.locator('ion-input[formControlName="DeclaredValue"] input')).toHaveValue('0');
    await expect(page.locator('input[formControlName="CustomerPriceCode"]')).toHaveValue('PRICE01');
  });

  test('content type card toggle works', async ({ page }) => {
    await setupImportManifestRoutes(page);
    await page.goto('/member/import-manifest/form');

    await expect(page.locator('.ct-card').last()).toHaveClass(/ct-active/);
    await page.locator('.ct-card').first().click();
    await expect(page.locator('.ct-card').first()).toHaveClass(/ct-active/);
    await expect(page.locator('.ct-card').last()).not.toHaveClass(/ct-active/);
  });

  test('can fill form and submit with new UI', async ({ page }) => {
    await setupImportManifestRoutes(page);
    await page.goto('/member/import-manifest/form');

    // Fill ObjectNo
    await page.locator('ion-input[formControlName="ObjectNo"] input').fill('NEWTEST001');

    // Type country in searchbar and select from dropdown
    const countrySearchbar = page.locator('ion-searchbar').first();
    await countrySearchbar.locator('input').fill('USA');
    // Click the first dropdown item
    const countryItem = page.locator('.autocomplete-result-list ion-item').first();
    await countryItem.click();

    // Fill piece count
    await page.locator('ion-input[formControlName="Piece"] input').fill('5');

    await page.locator('ion-input[formControlName="Weight"] input').fill('3.5');
    await page.locator('ion-input[formControlName="DeclaredValue"] input').fill('0');

    // Select content type (WPX)
    await page.locator('.ct-card').last().click();

    // Type price code in second searchbar and press Enter
    const priceSearchbar = page.locator('ion-searchbar').last();
    await expect(priceSearchbar).not.toBeDisabled();
    await priceSearchbar.locator('input').fill('PRICE01');
    await page.locator('.autocomplete-result-list ion-item').filter({ hasText: 'PRICE01' }).first().click();
    await expect(page.locator('input[formControlName="CustomerPriceCode"]')).toHaveValue('PRICE01');

    // Click save
    const submitting = page.waitForRequest(request => request.url().includes('/ImportManifest/Create'));
    await page.locator('ion-footer ion-button').click();
    const submitted = (await submitting).postDataJSON();
    expect(submitted.ObjectNo).toBe('NEWTEST001');
    expect(Number(submitted.Weight)).toBe(3.5);
    expect(submitted.DeclaredValue).toBe(0);
    expect(submitted.IsPAK).toBeNull();
  });
});

test.describe('import manifest detail page', () => {
  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(15_000);
  });

  test('displays detail page with correct data', async ({ page }) => {
    await setupImportManifestRoutes(page);
    await page.goto('/member/import-manifest/detail/1');

    // Should show ObjectNo
    await expect(page.locator('ion-content')).toContainText('TEST001');
  });
});

test.describe('import manifest navigation flow', () => {
  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(15_000);
  });

  test('navigates from list to detail page', async ({ page }) => {
    await setupImportManifestRoutes(page);
    await page.goto('/member/import-manifest/list');

    await page.locator('.forecast-item').first().click();

    await page.waitForURL('**/member/import-manifest/detail/*');
  });
});
