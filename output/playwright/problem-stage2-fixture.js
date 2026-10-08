async page => {
  const context = await page.context().browser().newContext({
    isMobile: true, hasTouch: true, viewport: { width: 390, height: 844 }, ignoreHTTPSErrors: true,
    proxy: { server: 'http://127.0.0.1:7890', bypass: 'mobile.sl56.com,api.sl56.com' }
  });
  const testPage = await context.newPage();
  const pending = [11, 12];
  await context.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/GetProblemDetail')) {
      const source = Number(url.searchParams.get('problemId'));
      const id = pending.includes(source) ? source : (pending[0] || source);
      await route.fulfill({ json: {
        Id: 20, No: '阶段2测试单', SourceProblemId: source, DefaultProblemId: pending[0] || null,
        IsCurrentWaybillCompleted: pending.length === 0, OtherWaybillCount: 2, OtherProblemCount: 3,
        NextReceiveGoodsDetailId: 30, NextProblemId: 40, CountryName: '测试目的地',
        ProblemList: pending.map(value => ({ ObjectId: value, ObjectName: '补充资料' + value, EndDate: '(无)' })),
        Problem: { ObjectId: id, ObjectName: '补充资料' + id, Status: pending.length ? 0 : 1,
          Pages: [{ Item1: 'Page1', Item2: '更新信息' }], ProcessTypeList: [2],
          ProcessSetting2: [{ Item1: '内容', Item2: '资料' }], ProcessSetting4: [] },
        ProcessResult: { Id: id }
      } });
    } else if (url.pathname.endsWith('/Complete')) {
      const data = route.request().postDataJSON();
      const index = pending.indexOf(data.Id);
      if (index >= 0) pending.splice(index, 1);
      await route.fulfill({ json: { Result: true } });
    } else {
      await route.fulfill({ json: false });
    }
  });
  await testPage.goto('https://mobile.sl56.com/member/problem-detail/20?problemid=10');
  await testPage.waitForTimeout(1200);
  return { snapshot: await testPage.locator('body').ariaSnapshot() };
}
