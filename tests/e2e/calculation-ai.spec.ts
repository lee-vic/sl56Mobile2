import { expect, test, Page } from '@playwright/test';

const baseDraft = {
  CountryName: '美国', ActualWeight: 2, ProductTypeNames: ['不限'], ModeOfTransportNames: ['不限'],
  Sizes: [], CargoAttributeNames: []
};
const transports = [{ Id: 0, Name: '不限' }, { Id: 2, Name: 'DHL' }];

async function prepare(page: Page, draft = {}) {
  const quotes: Record<string, unknown>[] = [];
  await page.route('**/api/**', async route => {
    const action = new URL(route.request().url()).pathname.split('/').pop()?.toLowerCase();
    let json: unknown = [];
    switch (action) {
      case 'getcountrylist': json = [{ Id: 212, Name: 'US 美国' }]; break;
      case 'getmodeoftransportlist': json = transports; break;
      case 'getpieceruletemplates': json = [{ ObjectName: '木箱', ObjectId: 8, Checked: false }]; break;
      case 'getrulelist': json = [{ Id: 9, Name: '关税预付' }]; break;
      case 'parseinquiry':
        expect(route.request().postDataJSON().InquiryText).toBeTruthy();
        json = { ProductId: 0, Transports: transports, Draft: { ...baseDraft, ...draft } };
        break;
      case 'calculate': quotes.push(route.request().postDataJSON()); break;
    }
    await route.fulfill({ json });
  });
  await page.goto('/member/calculation');
  return quotes;
}

async function confirmInquiry(page: Page, text = '美国 2KG') {
  await page.getByRole('button', { name: /AI查价/ }).click();
  await page.locator('ion-modal textarea').fill(text);
  await page.locator('ion-modal textarea').press('Enter');
  await expect(page.locator('ion-modal textarea')).toBeHidden();
}

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

test('简单询价只提交一次，恢复手工范围后不再按快递筛选', async ({ page }) => {
  const quotes = await prepare(page, { Piece: 2 });
  await confirmInquiry(page);
  await expect.poll(() => quotes.length).toBe(1);
  expect(quotes[0]).toMatchObject({ ProductTypeIdList: '0', actualWeight: 2, countryId: 212, ProductContentType: '1' });
  await page.getByRole('button', { name: '恢复手工查价范围' }).click();
  await page.getByRole('button', { name: '立即计算' }).click();
  await expect.poll(() => quotes.length).toBe(2);
  expect(quotes[1].ProductTypeIdList).toBeUndefined();
});

test('完整模式保留邮编及两行尺寸，亚公斤实重可自动计算', async ({ page }) => {
  const rows = [
    { Piece: 2, Weight: 0.5, Length: 20, Width: 10, Height: 5 },
    { Piece: 1, Weight: 1, Length: 40, Width: 20, Height: 15 }
  ];
  const quotes = await prepare(page, { Sizes: rows, Piece: 3, PostalCode: '02108', ModeOfTransportNames: ['DHL'] });
  await confirmInquiry(page);
  await expect.poll(() => quotes.length).toBe(1);
  expect(quotes[0]).toMatchObject({ postalCode: '02108', ModeOfTransportIdList: 2, sizes: rows });
});

test('整票属性误识别时停在原表单，由客户主动勾选', async ({ page }) => {
  const quotes = await prepare(page, { CargoAttributeNames: ['关税预付'] });
  await confirmInquiry(page);
  await expect(page.getByRole('status').filter({ hasText: '核对整票属性' })).toBeVisible();
  expect(quotes).toHaveLength(0);
  const rule = page.getByRole('button', { name: '关税预付' });
  await expect(rule).toHaveAttribute('aria-pressed', 'false');
  await rule.click();
  await page.getByRole('button', { name: '立即计算' }).click();
  await expect.poll(() => quotes.length).toBe(1);
  expect(quotes[0].SeletedTemplateRules).toEqual([9]);
});

test('重量冲突后显示提示，取消下一次识别保留这票', async ({ page }) => {
  const quotes = await prepare(page, { Sizes: [{ Piece: 2, Weight: 2, Length: 10, Width: 10, Height: 10 }] });
  await confirmInquiry(page);
  await expect(page.getByRole('status').filter({ hasText: '不一致' })).toBeVisible();
  await page.getByRole('button', { name: /AI查价/ }).click();
  await page.getByRole('button', { name: '取消' }).click();
  await expect(page.locator('ion-modal textarea')).toBeHidden();
  expect(quotes).toHaveLength(0);
  await expect(page.locator('ion-input[formControlName="actualWeight"] input')).toHaveValue('2');
});

test('多个渠道和欧元金额需要人工选择，不自动提交', async ({ page }) => {
  const quotes = await prepare(page, { ModeOfTransportNames: ['DHL', 'UPS'], DeclaredValue: 100, DeclaredCurrency: 'EUR' });
  await confirmInquiry(page);
  await expect(page.getByRole('status').filter({ hasText: '100 EUR' })).toBeVisible();
  await expect(page.locator('ion-input[formControlName="declaredValue"] input')).toHaveValue('');
  await expect(page.getByRole('button', { name: '立即计算' })).toBeDisabled();
  expect(quotes).toHaveLength(0);
});

test('识别超时保留输入和手工表单，退出后仍可手工查价', async ({ page }) => {
  const quotes = await prepare(page);
  const search = page.locator('ion-searchbar input');
  await search.fill('美国');
  await page.locator('.country-result-list ion-item').filter({ hasText: 'US 美国' }).click();
  await page.locator('ion-input[formControlName="actualWeight"] input').fill('3');
  await page.route('**/Calculation/ParseInquiry', route => route.fulfill({ status: 504, json: { Message: '识别超时' } }));
  await page.getByRole('button', { name: /AI查价/ }).click();
  await page.locator('ion-modal textarea').fill('美国2kg');
  await page.locator('ion-modal textarea').press('Enter');
  await expect(page.locator('ion-modal [role=status]')).toHaveText('识别超时');
  await expect(page.locator('ion-modal textarea')).toHaveValue('美国2kg');
  await page.getByRole('button', { name: '取消' }).click();
  await page.getByRole('button', { name: '立即计算' }).click();
  await expect.poll(() => quotes.length).toBe(1);
  expect(Number(quotes[0].actualWeight)).toBe(3);
  expect(quotes[0].ProductTypeIdList).toBeUndefined();
});

test('有报价时进入原结果页并展示返回金额', async ({ page }) => {
  await prepare(page);
  let requests = 0;
  await page.route('**/Calculation/Calculate', async route => {
    requests++;
    await route.fulfill({ json: [{ PriceType: '出口价', PriceCode: 'DHL-TEST', PriceName: '国际快递', TotalAmount: 123.45 }] });
  });
  await confirmInquiry(page);
  await expect(page).toHaveURL(/calculation-list$/);
  await expect(page.locator('.quote-header-row')).toContainText('DHL-TEST');
  await expect(page.locator('.price-amount')).toHaveText('123.45');
  expect(requests).toBe(1);
});

test('报价明细、预报和重新计算可以返回同一票', async ({ page }) => {
  await prepare(page, { PostalCode: '02108', Piece: 3 });
  const quotes: Record<string, unknown>[] = [];
  await page.route('**/Calculation/Calculate', async route => {
    quotes.push(route.request().postDataJSON());
    await route.fulfill({ json: [{ PriceCode: 'EXP-' + quotes.length, PriceIEType: 0, TotalAmount: 123.45 }] });
  });
  await page.route('**/GetCountryOptions', r => r.fulfill({ json: [{ Id: 212, Name: '美国', Code: 'US' }] }));
  await page.route('**/GetAvailableCustomerPrices', r => r.fulfill({ json: { items: [{ value: 'EXP-1', text: '快递' }] } }));
  await confirmInquiry(page);
  const quote = page.locator('.quote-item:visible');
  await quote.click();
  await expect(page).toHaveURL(/calculation-detail$/);
  await expect(page.locator('.summary-card ion-card-title')).toContainText('EXP-1');
  await page.getByRole('button', { name: '返回结果' }).click();
  await expect(page).toHaveURL(/calculation-list$/);
  await page.getByRole('button', { name: '快速预报' }).click();
  await quote.click();
  await expect(page).toHaveURL(/import-manifest\/form\?/);
  await expect(page.locator('input[formControlName="CountryId"]')).toHaveValue('212');
  await expect(page.locator('ion-input[formControlName="Weight"] input')).toHaveValue('2');
  await expect(page.locator('ion-input[formControlName="Piece"] input')).toHaveValue('3');
  await expect(page.locator('input[formControlName="CustomerPriceCode"]')).toHaveValue('EXP-1');
  await page.locator('.manifest-header ion-back-button').click();
  await expect(page).toHaveURL(/calculation-list$/);
  await page.getByRole('button', { name: '重新计算' }).click();
  await expect(page).toHaveURL(/member\/calculation$/);
  const weight = page.locator('ion-input[formControlName="actualWeight"] input');
  await expect(weight).toHaveValue('2');
  await expect(page.locator('ion-input[formControlName="postalCode"] input')).toHaveValue('02108');
  expect(quotes.length).toBe(1);
  await weight.fill('3');
  await page.getByRole('button', { name: '立即计算' }).click();
  await expect(quote).toContainText('EXP-2');
  expect(Number(quotes[1].actualWeight)).toBe(3);
  expect(quotes.length).toBe(2);
});

test('部分规格切回按实重时恢复本票重量，手工修改后继续使用新值', async ({ page }) => {
  const quotes = await prepare(page, { Sizes: [{ Piece: 1, Weight: 2, Length: 20, Width: 15, Height: null }] });
  await confirmInquiry(page);
  const toggle = page.locator('ion-toggle[formControlName="isEditSize"]');
  await toggle.click();
  const weight = page.locator('ion-input[formControlName="actualWeight"] input');
  await expect(weight).toHaveValue('2');
  await weight.fill('4');
  await toggle.click();
  await toggle.click();
  await expect(weight).toHaveValue('4');
  await page.getByRole('button', { name: '立即计算' }).click();
  await expect.poll(() => quotes.length).toBe(1);
  expect(Number(quotes[0].actualWeight)).toBe(4);
  expect(quotes[0].sizes).toEqual([]);
});

test('明确不用关税预付时只拦截已勾选的表单', async ({ page }) => {
  const quotes = await prepare(page, { ExcludesDutyPrepayment: true });
  const rule = page.getByRole('button', { name: '关税预付' });
  await rule.click();
  await confirmInquiry(page, '美国2kg，不要关税预付');
  await expect(page.getByRole('status').filter({ hasText: '当前已勾选' })).toBeVisible();
  await expect(rule).toHaveAttribute('aria-pressed', 'true');
  expect(quotes).toHaveLength(0);
  await rule.click();
  await confirmInquiry(page, '美国2kg，不要关税预付');
  await expect.poll(() => quotes.length).toBe(1);
  expect(quotes[0].SeletedTemplateRules).toEqual([]);
});

test('公共服务提示尺寸遗漏时先回填，确认按实重后只查询一次', async ({ page }) => {
  const message = '原文提供了长和宽，请补充高度并填写按件尺寸，或确认仅按实重查询';
  const quotes = await prepare(page, { ReviewMessages: [message] });
  await confirmInquiry(page, '美国2公斤，长20cm宽15cm，高还没量');
  await expect(page.getByRole('status').filter({ hasText: message })).toBeVisible();
  await expect(page.locator('ion-input[formControlName="actualWeight"] input')).toHaveValue('2');
  expect(quotes).toHaveLength(0);
  await page.getByRole('button', { name: '立即计算' }).click();
  await expect.poll(() => quotes.length).toBe(1);
  expect(quotes[0]).toMatchObject({ actualWeight: 2, sizes: [] });
});
