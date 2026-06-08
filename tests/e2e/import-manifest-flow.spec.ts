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
          Quantity1: 0,
          Quantity2: 0,
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
              CustomerPriceName: 'PRICE01',
              Piece: 3,
              ContentTypeName: 'Parcel',
              ContentType: 1,
              PostalCode: '90001',
              CustomerExpressNo: '',
              DeclaredValue: '100.00',
              StatusName: 'Pending',
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
              CustomerPriceName: 'PRICE02',
              Piece: 2,
              ContentTypeName: 'Document',
              ContentType: 0,
              PostalCode: '',
              CustomerExpressNo: '',
              DeclaredValue: '50.00',
              StatusName: 'Received',
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
              CustomerPriceName: 'PRICE03',
              Piece: 1,
              ContentTypeName: 'Parcel',
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
          CustomerPriceName: 'PRICE01',
          Status: 0,
          StatusName: 'Pending',
          Piece: 3,
          PostalCode: '90001',
          ContentType: 1,
          ContentTypeName: 'Parcel',
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

    // Searchbar
    await expect(page.locator('ion-searchbar')).toBeVisible();

    // Date filter segment
    await expect(page.locator('.date-filter-segment')).toBeVisible();
    await expect(page.locator('.date-filter-segment ion-segment-button')).toHaveCount(4);

    // Card items should render
    await expect(page.locator('.forecast-card')).toHaveCount(3);
  });

  test('displays list cards with status badges', async ({ page }) => {
    await setupImportManifestRoutes(page);
    await page.goto('/member/import-manifest/list');

    // Each card should show ObjectNo in heading
    await expect(page.locator('.card-object-no').first()).toContainText('TEST001');

    // Status badges with correct color classes
    const badges = page.locator('.status-badge');
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

    await expect(page.locator('.empty-state')).toBeVisible();
    await expect(page.locator('.empty-state-title')).toBeVisible();
  });

  test('date filter segment changes active state', async ({ page }) => {
    await setupImportManifestRoutes(page);
    await page.goto('/member/import-manifest/list');

    const todayBtn = page.locator('.date-filter-segment ion-segment-button').first();
    await todayBtn.click();

    await expect(todayBtn).toHaveClass(/segment-button-checked/);
  });

  test('can enter selection mode', async ({ page }) => {
    await setupImportManifestRoutes(page);
    await page.goto('/member/import-manifest/list');

    // Enter selection mode via header button
    const selectionBtn = page.locator('ion-header ion-buttons[slot="end"] ion-button');
    await selectionBtn.click();

    // Checkboxes should appear
    await expect(page.locator('.card-checkbox ion-checkbox').first()).toBeVisible();

    // Exit selection mode
    await selectionBtn.click();
    await expect(page.locator('.card-checkbox').first()).not.toBeVisible();
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
    await expect(page.locator('ion-buttons[slot="end"] ion-button')).toBeVisible();
  });

  test('content type card toggle works', async ({ page }) => {
    await setupImportManifestRoutes(page);
    await page.goto('/member/import-manifest/form');

    // First card (DOC) should be active by default
    await expect(page.locator('.ct-card').first()).toHaveClass(/ct-active/);
    await expect(page.locator('.ct-card').last()).not.toHaveClass(/ct-active/);

    // Click second card (WPX)
    await page.locator('.ct-card').last().click();

    // Second card should become active
    await expect(page.locator('.ct-card').last()).toHaveClass(/ct-active/);
    await expect(page.locator('.ct-card').first()).not.toHaveClass(/ct-active/);
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

    // Type price code in second searchbar and press Enter
    const priceSearchbar = page.locator('ion-searchbar').last();
    await priceSearchbar.locator('input').fill('PRICE01');
    await priceSearchbar.locator('input').press('Enter');

    // Fill piece count
    await page.locator('ion-input[formControlName="Piece"] input').fill('5');

    // Select content type (WPX)
    await page.locator('.ct-card').last().click();

    // Click save
    await page.locator('ion-buttons[slot="end"] ion-button').click();
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

    // Click first card to navigate to detail
    await page.locator('.forecast-card').first().click();

    await page.waitForURL('**/member/import-manifest/detail/*');
  });
});
