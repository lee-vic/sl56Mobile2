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
      case 'getcalculationproducts':
        json = [
          { Id: 0, Name: '国际快递', Transports: [{ Id: 2, Name: 'DHL' }, { Id: 3, Name: 'UPS' }] },
          { Id: 4, Name: '陆运', Transports: [{ Id: 3, Name: 'UPS' }, { Id: 7, Name: '陆运专线' }] }
        ];
        break;
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
  await expect(page.locator('ion-modal').getByRole('note')).toHaveText('请核对信息是否正确，有误请修改。');
  await page.locator('ion-modal textarea').fill(text);
  await page.locator('ion-modal textarea').press('Enter');
  await expect(page.locator('ion-modal textarea')).toBeHidden();
}

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

test('同一票手工输入与 AI 回填提交相同的查价参数', async ({ page }) => {
  const quotes = await prepare(page);
  await page.locator('ion-searchbar input').fill('美国');
  await page.locator('.country-result-list ion-item').filter({ hasText: 'US 美国' }).click();
  await page.locator('ion-input[formControlName="actualWeight"] input').fill('2');
  await page.getByRole('button', { name: '立即计算' }).click();
  await expect.poll(() => quotes.length).toBe(1);
  await confirmInquiry(page);
  await expect.poll(() => quotes.length).toBe(2);
  expect(quotes[1]).toEqual({ ...quotes[0], actualWeight: 2 });
  expect(quotes[1].ProductTypeIdList).toBe('-1');
  expect(quotes[1]).not.toHaveProperty('volumetric');
  expect(quotes[1]).not.toHaveProperty('volumeWeight');
  await expect(page.locator('.inquiry-review-note')).toContainText('AI 未解析出尺寸，本次按实重查价。');
});

test('完整模式保留邮编及两行尺寸，亚公斤实重可自动计算', async ({ page }) => {
  const rows = [
    { Piece: 2, Weight: 0.5, Length: 20, Width: 10, Height: 5 },
    { Piece: 1, Weight: 1, Length: 40, Width: 20, Height: 15 }
  ];
  const draft = { Sizes: rows, Piece: 3, PostalCode: '02108', ModeOfTransportNames: ['DHL'] };
  const quotes = await prepare(page, draft);
  await confirmInquiry(page);
  await expect.poll(() => quotes.length).toBe(1);
  await expect(page.locator('ion-segment')).toHaveJSProperty('value', '2');
  expect(quotes[0]).toMatchObject({ postalCode: '02108', ModeOfTransportIdList: '2', sizes: rows });

  const duty = page.getByRole('button', { name: '关税预付' });
  await duty.click();
  await page.locator('ion-segment-button[value="1"]').click();
  await expect(duty).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '立即计算' }).click();
  await expect.poll(() => quotes.length).toBe(2);
  expect(quotes[1]).toMatchObject({ postalCode: '', sizes: [], piece: 1, SeletedTemplateRules: [9] });
  await page.locator('ion-segment-button[value="2"]').click();
  await page.getByRole('button', { name: '立即计算' }).click();
  await expect.poll(() => quotes.length).toBe(3);
  expect(quotes[2]).toMatchObject({ postalCode: '02108', sizes: rows, SeletedTemplateRules: [9] });

  // 下一票只含基础条件，即使当前处于完整模式也要切回精简模式。
  Object.assign(draft, { Sizes: [], Piece: null, PostalCode: null });
  await confirmInquiry(page, '美国 2KG DHL');
  await expect(page.locator('ion-segment')).toHaveJSProperty('value', '1');
  await expect.poll(() => quotes.length).toBe(4);
  expect(quotes[3].postalCode).toBeFalsy();
  expect(quotes[3].sizes || []).toHaveLength(0);
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

test('多个渠道同时回填，欧元金额仍需核对', async ({ page }) => {
  const quotes = await prepare(page, { ModeOfTransportNames: ['DHL', 'UPS'], DeclaredValue: 100, DeclaredCurrency: 'EUR' });
  await confirmInquiry(page);
  await expect(page.getByRole('status').filter({ hasText: '100 EUR' })).toBeVisible();
  await expect(page.locator('ion-input[formControlName="declaredValue"] input')).toHaveValue('');
  await expect(page.locator('ion-select[formControlName="ModeOfTransportIdList"]')).toHaveJSProperty('value', [2, 3]);
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
  expect(quotes[0].ProductTypeIdList).toBe('-1');
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
  await expect(page.getByRole('note').filter({ hasText: 'AI 未解析出尺寸' })).toBeVisible();
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

test('产品与渠道多选联动，可恢复不限，AI 与手工使用同一组参数', async ({ page }) => {
  const draft = { ProductTypeNames: ['国际快递', '陆运'], ModeOfTransportNames: ['DHL', 'UPS'] };
  const quotes = await prepare(page, draft);
  const product = page.locator('ion-select[formControlName="ProductTypeIdList"]');
  const channel = page.locator('ion-select[formControlName="ModeOfTransportIdList"]');
  await expect(product).toHaveJSProperty('value', []);
  await expect(channel).toHaveJSProperty('value', []);
  await confirmInquiry(page);
  await expect.poll(() => quotes.length).toBe(1);
  expect(quotes[0]).toMatchObject({ ProductTypeIdList: '0,4', ModeOfTransportIdList: '2,3' });
  await product.click();
  await page.getByRole('checkbox', { name: '国际快递' }).click();
  await page.getByRole('button', { name: '确定', exact: true }).click();
  await expect(channel).toHaveJSProperty('value', [3]);
  await channel.click();
  await expect(page.getByRole('checkbox', { name: 'DHL' })).toHaveCount(0);
  await page.getByRole('checkbox', { name: '陆运专线' }).click();
  await page.getByRole('button', { name: '确定', exact: true }).click();
  await page.getByRole('button', { name: '立即计算' }).click();
  await expect.poll(() => quotes.length).toBe(2);
  expect(quotes[1]).toMatchObject({ ProductTypeIdList: '4', ModeOfTransportIdList: '3,7' });
  await page.getByRole('button', { name: '产品类型恢复不限' }).click();
  await page.getByRole('button', { name: '运输方式恢复不限' }).click();
  await page.getByRole('button', { name: '立即计算' }).click();
  await expect.poll(() => quotes.length).toBe(3);
  expect(quotes[2]).toMatchObject({ ProductTypeIdList: '-1', ModeOfTransportIdList: '0' });
});
