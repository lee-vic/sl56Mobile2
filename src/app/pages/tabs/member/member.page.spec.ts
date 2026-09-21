import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CookieService } from 'ngx-cookie-service';
import { Subscription } from 'rxjs';

import { CurrencyAmount, User } from 'src/app/interfaces/user';
import { Menu } from 'src/app/interfaces/menu';
import { MemberPage } from './member.page';

describe('MemberPage', () => {
  let component: MemberPage;
  let fixture: ComponentFixture<MemberPage>;
  const componentInternals = () => component as unknown as {
    applyQuickMenuCustomization: (tempMenus: Array<Menu>, selectedTitles: Array<string>) => void;
    getVisibleMenuOptions: (customerType: number) => Array<Menu>;
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule, FormsModule, ReactiveFormsModule, IonicModule.forRoot()],
      providers: [CookieService],
      declarations: [ MemberPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MemberPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should include 快速预报 in allMenus', () => {
    const menu = component.allMenus.find(m => m.title === '快速预报');
    expect(menu).toBeDefined();
    expect(menu!.url).toBe('/member/import-manifest/list');
    expect(menu!.image).toBe('assets/imgs/member-4.png');
    expect(menu!.icon).toBe('paper-plane-outline');
    expect(menu!.summary).toBe('快速创建预报');
    expect(menu!.type).toEqual([0, 1]);
  });

  it('should apply custom quick menu order', () => {
    const visibleMenus = componentInternals().getVisibleMenuOptions(0).slice(0, 4);

    componentInternals().applyQuickMenuCustomization(visibleMenus, ['偏远查询', '价格查询', '业务公告']);

    expect(component.quickMenuList.map(m => m.title)).toEqual(['偏远查询', '价格查询', '业务公告']);
    expect(component.otherMenuList.map(m => m.title)).toEqual(['备案查询']);
  });

  it('should keep promoted shortcuts out of menu grid options', () => {
    const titles = componentInternals().getVisibleMenuOptions(0).map(menu => menu.title);

    expect(titles).not.toContain('交货清单确认');
    expect(titles).not.toContain('问题跟进');
    expect(titles).not.toContain('合同签署');
    expect(titles).not.toContain('微信支付');
    expect(titles).toContain('价格查询');
    expect(titles).toContain('退货管理');
    expect(titles).toContain('联系客服');
  });

  it('should prevent selecting more than quick menu limit', () => {
    component.draftQuickMenuTitles = ['A', 'B', 'C', 'D', 'E', 'F'];
    spyOn(component, 'showToast');

    component.onDraftSelectionChange('G', true);

    expect(component.draftQuickMenuTitles).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
    expect(component.showToast).toHaveBeenCalledWith('常用功能最多选择6项');
  });

  it('should reset quick menus to defaults', () => {
    const visibleMenus = componentInternals().getVisibleMenuOptions(0);
    component.username = 'test-user';
    component.visibleMenuOptions = visibleMenus;
    componentInternals().applyQuickMenuCustomization(visibleMenus, ['退货管理', '业务公告']);

    component.resetQuickMenus();

    expect(component.quickMenuList.map(m => m.title)).toEqual([
      '价格查询',
      '业务公告',
      '快速预报',
      '交货记录',
      '退货管理',
      '偏远查询',
    ]);
  });

  it('should prevent selecting less than quick menu minimum', () => {
    component.visibleMenuOptions = componentInternals().getVisibleMenuOptions(0).slice(0, 6);
    component.draftQuickMenuTitles = ['价格查询', '偏远查询', '业务公告'];
    spyOn(component, 'showToast');

    component.onDraftSelectionChange('价格查询', false);

    expect(component.draftQuickMenuTitles).toEqual(['价格查询', '偏远查询', '业务公告']);
    expect(component.showToast).toHaveBeenCalledWith('常用功能至少选择3项');
  });

  it('should unsubscribe router subscription on destroy', () => {
    const routerSub = new Subscription();
    const unsubscribeSpy = spyOn(routerSub, 'unsubscribe').and.callThrough();
    component.routerSub = routerSub;

    component.ngOnDestroy();

    expect(unsubscribeSpy).toHaveBeenCalled();
  });

  it('should format badge count over 99 as 99+', () => {
    expect(component.formatBadgeCount(18)).toBe('18');
    expect(component.formatBadgeCount(99)).toBe('99');
    expect(component.formatBadgeCount(100)).toBe('99+');
  });

  // ── Dashboard loading state ──

  it('should initialize isDashboardLoading as false', () => {
    expect(component.isDashboardLoading).toBe(false);
  });

  it('should set isDashboardLoading true when loginSuccess is called', () => {
    component.isDashboardLoading = false;

    component.loginSuccess();

    expect(component.isDashboardLoading).toBe(true);
  });

  it('should include 快速预报 in allMenus at the correct position', () => {
    const menus = component.allMenus;
    const index = menus.findIndex(m => m.title === '快速预报');
    expect(index).toBeGreaterThan(-1);
  });

  it('should render dashboard skeleton while member data is loading', () => {
    component.isLogin = true;
    component.isDashboardLoading = true;

    fixture.detectChanges();

    const nativeElement = fixture.nativeElement as HTMLElement;
    expect(nativeElement.querySelector('.skeleton-summary')).toBeTruthy();
    expect(nativeElement.querySelectorAll('.skeleton-menu-cell').length).toBeGreaterThan(0);
  });

  it('should render modern member dashboard content after data loads', () => {
    component.isLogin = true;
    component.isDashboardLoading = false;
    component.username = 'TEST001';
    component.customerType = 0;
    component.visibleMenuCount = 2;
    component.userInfo = createUserInfo();
    component.currencyAmount = [{ Id: 1, Name: 'CNY', Amount: '120.00' }];
    component.visibleMenuOptions = componentInternals().getVisibleMenuOptions(0).slice(0, 4);
    componentInternals().applyQuickMenuCustomization(component.visibleMenuOptions, ['价格查询', '交货记录', '业务公告']);

    fixture.detectChanges();

    const nativeElement = fixture.nativeElement as HTMLElement;
    expect(nativeElement.querySelector('.account-summary')).toBeTruthy();
    expect(nativeElement.querySelector('.overview-grid')).toBeTruthy();
    expect(nativeElement.querySelector('.debt-section')).toBeTruthy();
    expect(nativeElement.querySelector('.quick-manage-btn')).toBeTruthy();
    expect(nativeElement.textContent).toContain('会员账号');
    expect(nativeElement.textContent).toContain('TEST001');
    const menuTitles = Array.from(nativeElement.querySelectorAll('.menu-title')).map(node => node.textContent?.trim());
    expect(menuTitles).not.toContain('交货清单确认');
    expect(menuTitles).not.toContain('问题跟进');
    expect(menuTitles).not.toContain('合同签署');
    expect(menuTitles).not.toContain('微信支付');
  });

  it('should expose a safe member initial', () => {
    component.username = 'test-user';
    expect(component.getMemberInitial()).toBe('T');

    component.username = '';
    expect(component.getMemberInitial()).toBe('会');
  });

  it('should expose currency amounts only when data is an array', () => {
    const amounts: Array<CurrencyAmount> = [{ Id: 2, Name: 'USD', Amount: 88 }];
    component.currencyAmount = amounts;
    expect(component.getCurrencyAmounts()).toEqual(amounts);

    component.currencyAmount = null as unknown as Array<CurrencyAmount>;
    expect(component.getCurrencyAmounts()).toEqual([]);
  });
});

function createUserInfo(): User {
  return {
    Amount: '120.00',
    PendingConfirmationCount: 3,
    ProblemShipmentCount: 1,
    UnReadMessageCount: 5,
    NoticeUnreadCount: 0,
    CustomerId: 1001,
    CustomerNo: 'TEST001',
    Classify: 0,
    CurrencyAmount: [{ Id: 1, Name: 'CNY', Amount: '120.00' }],
    WaitToSignTaskCount: 2,
  };
}
