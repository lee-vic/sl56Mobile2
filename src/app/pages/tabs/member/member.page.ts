import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Menu, MenuRow, Menus } from '../../../interfaces/menu';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { UserService } from '../../../providers/user.service';
import { CookieService } from 'ngx-cookie-service';
import { CurrencyAmount, User } from 'src/app/interfaces/user';
import { Subject, Subscription } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { UiFeedbackService } from 'src/app/providers/ui-feedback.service';
import { LoadingController } from '@ionic/angular';

interface LoginFormValue {
  username: string;
  password: string;
  clientType: number | string;
  userType: number;
  rememberMe: boolean;
  isBind: boolean;
  openId: string;
  unionId: string;
}

interface AuthResult {
  Success: boolean;
  ErrMsg?: string;
}

interface ReorderDetail {
  from: number;
  to: number;
  complete: (data?: Array<string>) => void;
}

@Component({
  selector: 'app-member',
  templateUrl: './member.page.html',
  styleUrls: ['./member.page.scss'],
})
export class MemberPage implements OnInit, OnDestroy {
  readonly quickMenuMin = 3;
  readonly quickMenuLimit = 6;
  private readonly quickMenuStoragePrefix = 'member_quick_menu_custom_v2_';
  private readonly quickMenuStorageVersion = 6;
  private readonly quickMenuTitles = [
    '价格查询',
    '业务公告',
    '快速预报',
    '交货记录',
    '退货管理',
    '偏远查询',
  ];
  private readonly promotedMenuTitleSet = new Set([
    '交货清单确认',
    '问题跟进',
    '合同签署',
    '微信支付',
  ]);

  allMenus: Array<Menu> = [
    { title: '价格查询', image: 'assets/imgs/member-2.png', icon: 'calculator-outline', tone: 'blue', summary: '测算运输报价', type: [0, 1], url: '/member/calculation' },
    { title: '业务公告', image: 'assets/imgs/member-19.png', icon: 'megaphone-outline', tone: 'amber', summary: '服务和渠道通知', type: [0, 1], url: '/member/notice-list' },
    { title: '偏远查询', image: 'assets/imgs/member-3.png', icon: 'location-outline', tone: 'cyan', summary: '查询偏远附加', type: [0, 1], url: '/member/remote' },
    { title: '备案查询', image: 'assets/imgs/member-10.png', icon: 'document-attach-outline', tone: 'blue', summary: '公司名备案管理', type: [0, 1], url: '/member/company-name' },
    { title: '交货清单确认', image: 'assets/imgs/member-5.png', icon: 'checkbox-outline', tone: 'blue', summary: '核对待交货清单', type: [0, 1], url: '/member/confirmation' },
    { title: '交货记录', image: 'assets/imgs/member-6.png', icon: 'cube-outline', tone: 'green', summary: '查看历史交货', type: [0, 1], url: '/member/delivery-record/list' },
    { title: '快速预报', image: 'assets/imgs/member-4.png', icon: 'paper-plane-outline', tone: 'blue', summary: '快速创建预报', type: [0, 1], url: '/member/import-manifest/list' },
    { title: '问题跟进', image: 'assets/imgs/member-18.png', icon: 'alert-circle-outline', tone: 'amber', summary: '处理异常问题件', type: [0, 1], url: '/member/problem-list' },
    { title: '退货管理', image: 'assets/imgs/member-20.png', icon: 'refresh-circle-outline', tone: 'cyan', summary: '管理退货申请', type: [0, 1], url: '/member/return-list' },
    { title: '微信支付', image: 'assets/imgs/member-8.png', icon: 'wallet-outline', tone: 'green', summary: '支付运费欠款', type: [0, 1], url: '/member/wechat-pay/0?cid=1' },
    { title: '银行账号', image: 'assets/imgs/member-23.png', icon: 'card-outline', tone: 'slate', summary: '查看收款账户', type: [0, 1], url: '/member/bank' },
    { title: '消息订阅', image: 'assets/imgs/member-22.png', icon: 'notifications-outline', tone: 'blue', summary: '配置业务提醒', type: [0, 1], url: '/member/message-subscription/list' },
    { title: '联系客服', image: 'assets/imgs/member-6.png', icon: 'headset-outline', tone: 'cyan', summary: '联系专属客服', type: [0, 1], url: '/member/chat/0' },
    { title: '修改登录密码', image: 'assets/imgs/member-11.png', icon: 'lock-closed-outline', tone: 'slate', summary: '保护账号安全', type: [0], url: '/member/modify-password' },
    { title: '修改交货密码', image: 'assets/imgs/member-11.png', icon: 'key-outline', tone: 'slate', summary: '更新交货口令', type: [0], url: '/member/modify-deliverypassword' },
    { title: '子账号管理', image: 'assets/imgs/member-12.png', icon: 'people-outline', tone: 'blue', summary: '管理团队账号', type: [0], url: '/member/sub-account' },
    { title: '微信绑定', image: 'assets/imgs/member-13.png', icon: 'chatbubble-ellipses-outline', tone: 'green', summary: '绑定微信服务', type: [0, 1], url: '/member/wechat-binding' },
    { title: '银行水单上传(优先放货)', image: 'assets/imgs/member-17.png', icon: 'receipt-outline', tone: 'amber', summary: '上传付款凭证', type: [0, 1], url: '/member/bank-slips' },
    { title: '模板下载', image: 'assets/imgs/member-7.png', icon: 'download-outline', tone: 'cyan', summary: '下载业务模板', type: [0, 1], url: '/member/template-list' },
    { title: '查看报价', image: 'assets/imgs/member-10.png', icon: 'pricetags-outline', tone: 'green', summary: '查看报价文件', type: [0], url: '/member/price-list' },
    { title: '合同签署', image: 'assets/imgs/member-24.png', icon: 'document-text-outline', tone: 'blue', summary: '处理电子合同', type: [0, 1], url: '/member/sign-the-contract' },
    { title: '香港入仓申请', image: 'assets/imgs/member-26.png', icon: 'business-outline', tone: 'cyan', summary: '申请香港仓入仓', type: [0, 1], url: '/member/warehouse-application' }
  ];
  menus: Menus;
  quickMenuRows: Array<MenuRow> = [];
  quickMenuList: Array<Menu> = [];
  otherMenuList: Array<Menu> = [];
  quickMenuCustomTitles: Array<string> = [];
  quickMenuManageOpen: boolean = false;
  draftQuickMenuTitles: Array<string> = [];
  visibleMenuOptions: Array<Menu> = [];
  menuColumns: number = 3;
  isLogin: boolean = false;
  isDashboardLoading: boolean = false;
  public authForm: FormGroup;
  userInfo: User;
  username: string = '';
  customerType: number;
  currencyAmount: Array<CurrencyAmount> = [];
  unreadNoticeCount: number = 0;
  totalUnreadCount: number = 0;
  waitToSignTaskCount: number = 0;
  visibleMenuCount: number = 0;
  routerSub: Subscription;
  private readonly destroy$ = new Subject<void>();
  constructor(private userService: UserService,
    private router: Router,
    private cookieService: CookieService,
    private uiFeedbackService: UiFeedbackService,
    private loadingCtrl: LoadingController) {
    this.authForm = new FormGroup({
      username: new FormControl('', Validators.required),
      password: new FormControl('', Validators.required),
      clientType: new FormControl(''),
      userType: new FormControl(0, Validators.required),
      rememberMe: new FormControl(true, Validators.required),
      isBind: new FormControl(true, Validators.required),
      openId: new FormControl(''),
      unionId: new FormControl(''),
    });
  }

  ngOnInit() {
    this.menus = new Menus();
    this.menus.rows = [];
    this.userService.isAuthenticated()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isLogin = true;
          this.loginSuccess();
        },
        error: (err) => {
          if (err.status === 401) {
            this.isLogin = false;
          }
        }
      });

    this.routerSub = this.router.events
      .pipe(
        takeUntil(this.destroy$),
        filter(evt => evt instanceof NavigationEnd)
      )
      .subscribe(() => {
        if (!this.isLogin) {
          return;
        }
        if (this.router.url === '/app/tabs/member' || this.router.url.startsWith('/app/tabs/member')) {
          this.refreshSummary();
        }
      });


  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.routerSub) {
      this.routerSub.unsubscribe();
    }
  }
  forgetPasswordClick() {
    this.releaseFocus();
    this.router.navigateByUrl("/member/reset-password");
  }

  async doLogin(formValue: LoginFormValue) {
    this.releaseFocus();
    const loading = await this.loadingCtrl.create({ message: '登录中...' });
    await loading.present();
    const loginFormValue: LoginFormValue = {
      ...formValue,
      clientType: 1,
      openId: this.cookieService.get('OpenId'),
      unionId: this.cookieService.get('UnionId'),
    };
    this.userService.auth(loginFormValue).subscribe({
      next: (res: AuthResult) => {
        loading.dismiss();
        this.isLogin = res.Success;
        if (this.isLogin === true) {
          this.loginSuccess();
        }
        if (!this.isLogin) {
          this.showToast(res.ErrMsg);
        }
        // else {
        //   localStorage.setItem("username", formValue.username);
        // }

      },
      error: (err) => {
        loading.dismiss();
        this.showToast(err.message);
      }
    });

  }
  async showToast(msg: string) {
    await this.uiFeedbackService.presentToast(msg, 2000, 'middle', 'member-theme-toast');
  }
  loginSuccess() {
    this.isDashboardLoading = true;
    this.userService.getHomeInfo()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.isDashboardLoading = false;
          this.userInfo = res;
          this.username = res.CustomerNo;
          this.customerType = res.Classify;
          this.currencyAmount = Array.isArray(res.CurrencyAmount) ? res.CurrencyAmount : [];
          this.waitToSignTaskCount = res.WaitToSignTaskCount;
          this.unreadNoticeCount = res.NoticeUnreadCount || 0;
          this.totalUnreadCount = res.UnReadMessageCount || 0;
          const customerMenus = this.getCustomerMenus(this.customerType);
          const tempMenus = this.getVisibleMenuOptions(this.customerType);
          this.visibleMenuCount = customerMenus.length;
          this.visibleMenuOptions = tempMenus;
          this.applyQuickMenuCustomization(tempMenus, this.getStoredQuickMenuTitles(tempMenus));
        },
        error: () => {
          this.isDashboardLoading = false;
          this.uiFeedbackService.presentToast('数据加载失败，请下拉刷新重试', 2200, 'middle', undefined, 'danger');
        },
      });








  }

  @HostListener('window:resize')
  onWindowResize() {
    if (!this.isLogin) {
      return;
    }

    const nextColumns = this.getMenuColumns();
    if (nextColumns !== this.menuColumns) {
      this.menuColumns = nextColumns;
      this.rebuildMenuRows();
    }
  }

  private getMenuColumns(): number {
    const width = typeof window !== 'undefined' ? (window.innerWidth || 390) : 390;
    if (width >= 992) {
      return 5;
    }
    if (width >= 768) {
      return 4;
    }
    return 3;
  }

  private getCustomerMenus(customerType: number): Array<Menu> {
    return this.allMenus.filter(menu => menu.type.indexOf(customerType) > -1);
  }

  private getVisibleMenuOptions(customerType: number): Array<Menu> {
    return this.getCustomerMenus(customerType)
      .filter(menu => !this.promotedMenuTitleSet.has(menu.title));
  }

  private rebuildMenuRows() {
    this.menuColumns = this.getMenuColumns();
    this.quickMenuRows = this.buildMenuRows(this.quickMenuList, this.menuColumns);
    this.menus.rows = this.buildMenuRows(this.otherMenuList, this.menuColumns);
  }

  private buildMenuRows(items: Array<Menu>, columns: number): Array<MenuRow> {
    const rows: Array<MenuRow> = [];
    let rowIndex = -1;

    for (let i = 0; i < items.length; i++) {
      if (i % columns === 0) {
        rows.push({ items: [] });
        rowIndex++;
      }
      rows[rowIndex].items.push(items[i]);
    }

    return rows;
  }

  menuKeyup(event: KeyboardEvent, item: Menu) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.menuClick(item);
    }
  }

  getMenuAriaLabel(item: Menu): string {
    return '打开' + item.title;
  }

  formatBadgeCount(count: number): string {
    return count > 99 ? '99+' : String(count);
  }

  private getDefaultQuickMenuTitles(tempMenus: Array<Menu>): Array<string> {
    const visibleTitleSet = new Set(tempMenus.map(menu => menu.title));
    return this.quickMenuTitles.filter(title => visibleTitleSet.has(title)).slice(0, this.quickMenuLimit);
  }

  private getQuickMenuStorageKey(): string {
    return this.quickMenuStoragePrefix + (this.username || 'anonymous');
  }

  private normalizeQuickMenuTitles(rawTitles: Array<string>, tempMenus: Array<Menu>): Array<string> {
    const visibleTitleSet = new Set(tempMenus.map(menu => menu.title));
    const titles: Array<string> = [];
    for (const title of rawTitles) {
      if (typeof title !== 'string') {
        continue;
      }
      if (!visibleTitleSet.has(title)) {
        continue;
      }
      if (titles.indexOf(title) > -1) {
        continue;
      }
      titles.push(title);
      if (titles.length >= this.quickMenuLimit) {
        break;
      }
    }
    return titles;
  }

  private ensureQuickMenuMinimum(tempMenus: Array<Menu>, selectedTitles: Array<string>): Array<string> {
    const requiredCount = Math.min(this.quickMenuMin, tempMenus.length);
    if (selectedTitles.length >= requiredCount) {
      return selectedTitles;
    }

    const filledTitles = [...selectedTitles];
    const fallbackTitles = this.getDefaultQuickMenuTitles(tempMenus);
    for (const title of fallbackTitles) {
      if (filledTitles.indexOf(title) > -1) {
        continue;
      }
      filledTitles.push(title);
      if (filledTitles.length >= requiredCount) {
        return filledTitles;
      }
    }

    for (const menu of tempMenus) {
      if (filledTitles.indexOf(menu.title) > -1) {
        continue;
      }
      filledTitles.push(menu.title);
      if (filledTitles.length >= requiredCount) {
        break;
      }
    }

    return filledTitles.slice(0, this.quickMenuLimit);
  }

  private getStoredQuickMenuTitles(tempMenus: Array<Menu>): Array<string> {
    try {
      const key = this.getQuickMenuStorageKey();
      const raw = localStorage.getItem(key);
      if (!raw) {
        const defaults = this.getDefaultQuickMenuTitles(tempMenus);
        this.quickMenuCustomTitles = defaults;
        this.saveQuickMenuCustomization(defaults);
        return defaults;
      }
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        return this.getDefaultQuickMenuTitles(tempMenus);
      }

      if (parsed.version !== this.quickMenuStorageVersion) {
        const defaults = this.getDefaultQuickMenuTitles(tempMenus);
        this.quickMenuCustomTitles = defaults;
        this.saveQuickMenuCustomization(defaults);
        return defaults;
      }

      const parsedTitles = Array.isArray(parsed.titles) ? parsed.titles : [];
      if (parsedTitles.some(title => typeof title === 'string' && this.promotedMenuTitleSet.has(title))) {
        const defaults = this.getDefaultQuickMenuTitles(tempMenus);
        this.quickMenuCustomTitles = defaults;
        this.saveQuickMenuCustomization(defaults);
        return defaults;
      }
      const normalizedTitles = this.ensureQuickMenuMinimum(
        tempMenus,
        this.normalizeQuickMenuTitles(parsedTitles, tempMenus)
      );
      if (normalizedTitles.length === 0) {
        return this.ensureQuickMenuMinimum(tempMenus, this.getDefaultQuickMenuTitles(tempMenus));
      }
      return normalizedTitles;
    } catch {
      return this.ensureQuickMenuMinimum(tempMenus, this.getDefaultQuickMenuTitles(tempMenus));
    }
  }

  private saveQuickMenuCustomization(titles: Array<string>) {
    try {
      localStorage.setItem(this.getQuickMenuStorageKey(), JSON.stringify({
        version: this.quickMenuStorageVersion,
        titles,
      }));
    } catch {
      // Ignore storage write failures in private mode or restricted browsers.
    }
  }

  private applyQuickMenuCustomization(tempMenus: Array<Menu>, selectedTitles: Array<string>) {
    const normalizedTitles = this.ensureQuickMenuMinimum(
      tempMenus,
      this.normalizeQuickMenuTitles(selectedTitles, tempMenus)
    );
    const selectedSet = new Set(normalizedTitles);
    const menuByTitle = new Map(tempMenus.map(menu => [menu.title, menu] as [string, Menu]));

    this.quickMenuList = normalizedTitles
      .map(title => menuByTitle.get(title))
      .filter((menu): menu is Menu => !!menu);
    this.otherMenuList = tempMenus.filter(menu => !selectedSet.has(menu.title));
    this.quickMenuCustomTitles = normalizedTitles;
    this.rebuildMenuRows();
  }

  openQuickMenuManage() {
    this.releaseFocus();
    this.draftQuickMenuTitles = [...this.quickMenuCustomTitles];
    this.quickMenuManageOpen = true;
  }

  closeQuickMenuManage() {
    this.quickMenuManageOpen = false;
  }

  isDraftSelected(title: string): boolean {
    return this.draftQuickMenuTitles.indexOf(title) > -1;
  }

  onDraftSelectionChange(title: string, checked: boolean) {
    if (checked) {
      if (this.draftQuickMenuTitles.length >= this.quickMenuLimit) {
        this.showToast('常用功能最多选择6项');
        return;
      }
      if (!this.isDraftSelected(title)) {
        this.draftQuickMenuTitles = this.draftQuickMenuTitles.concat([title]);
      }
      return;
    }

    const requiredCount = Math.min(this.quickMenuMin, this.visibleMenuOptions.length);
    if (this.isDraftSelected(title) && this.draftQuickMenuTitles.length <= requiredCount) {
      this.showToast('常用功能至少选择' + requiredCount + '项');
      return;
    }

    this.draftQuickMenuTitles = this.draftQuickMenuTitles.filter(item => item !== title);
  }

  onDraftReorder(event: CustomEvent) {
    const detail = event.detail as ReorderDetail;
    const item = this.draftQuickMenuTitles.splice(detail.from, 1)[0];
    this.draftQuickMenuTitles.splice(detail.to, 0, item);
    detail.complete();
  }

  saveDraftQuickMenus() {
    const normalizedTitles = this.normalizeQuickMenuTitles(this.draftQuickMenuTitles, this.visibleMenuOptions);
    const requiredCount = Math.min(this.quickMenuMin, this.visibleMenuOptions.length);
    if (normalizedTitles.length < requiredCount) {
      this.showToast('常用功能至少选择' + requiredCount + '项');
      return;
    }
    this.saveQuickMenuCustomization(normalizedTitles);
    this.applyQuickMenuCustomization(this.visibleMenuOptions, normalizedTitles);
    this.quickMenuManageOpen = false;
    this.showToast('已保存常用功能设置');
  }

  getMenuByTitle(title: string): Menu | undefined {
    return this.visibleMenuOptions.find(menu => menu.title === title);
  }

  getQuickMenuManageHint(): string {
    return this.draftQuickMenuTitles.length + '/' + this.quickMenuLimit;
  }

  getQuickMenuRequiredCount(): number {
    return Math.min(this.quickMenuMin, this.visibleMenuOptions.length);
  }

  getQuickMenuProgressValue(): number {
    return Math.min(this.draftQuickMenuTitles.length / this.quickMenuLimit, 1);
  }

  canSaveDraftQuickMenus(): boolean {
    return this.draftQuickMenuTitles.length >= this.getQuickMenuRequiredCount();
  }

  getQuickMenuRecommendations(): Array<Menu> {
    const selectedSet = new Set(this.draftQuickMenuTitles);
    return this.visibleMenuOptions
      .filter(menu => this.quickMenuTitles.indexOf(menu.title) > -1)
      .filter(menu => !selectedSet.has(menu.title))
      .slice(0, 4);
  }

  addRecommendedQuickMenu(title: string) {
    if (this.isDraftSelected(title)) {
      return;
    }

    if (this.draftQuickMenuTitles.length >= this.quickMenuLimit) {
      this.showToast('常用功能最多选择6项');
      return;
    }

    this.draftQuickMenuTitles = this.draftQuickMenuTitles.concat([title]);
  }

  resetQuickMenus() {
    const defaultTitles = this.getDefaultQuickMenuTitles(this.visibleMenuOptions);
    this.saveQuickMenuCustomization(defaultTitles);
    this.applyQuickMenuCustomization(this.visibleMenuOptions, defaultTitles);
    this.showToast('已恢复默认常用功能');
  }

  menuClick(item: Menu) {
    this.releaseFocus();


    if (item.url === '') {
      this.showToast('功能升级中...');
    }
    else {
      this.router.navigateByUrl(item.url);
    }

  }
  IsMicroMessenger(): boolean {
    return /micromessenger/i.test(navigator.userAgent);
  }
  logOff() {
    this.userService.logOff().pipe(takeUntil(this.destroy$)).subscribe(_res => {
      this.isLogin = false;
    });
  }

  private refreshSummary() {
    this.userService.getHomeInfo()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.userInfo = res;
          this.currencyAmount = Array.isArray(res.CurrencyAmount) ? res.CurrencyAmount : [];
          this.waitToSignTaskCount = res.WaitToSignTaskCount;
          this.unreadNoticeCount = res.NoticeUnreadCount || 0;
          this.totalUnreadCount = res.UnReadMessageCount || 0;
        }
      });
  }
  openMessage() {
    this.releaseFocus();
    this.router.navigateByUrl("/member/unread-message-list");
  }
  openChat() {
    this.releaseFocus();
    //this.router.navigateByUrl("/member/chat/0");
    this.router.navigate(['/member', 'chat', 0]);
  }

  goToConfirmation() {
    this.releaseFocus();
    this.router.navigateByUrl('/member/confirmation');
  }

  goToProblemList() {
    this.releaseFocus();
    this.router.navigateByUrl('/member/problem-list');
  }

  goToSignTasks() {
    this.releaseFocus();
    this.router.navigateByUrl('/member/sign-the-contract');
  }

  wechatPay(id: number | string) {
    this.releaseFocus();
    this.router.navigateByUrl('/member/wechat-pay/0?cid=' + id);
  }
  goToTest() {
    this.releaseFocus();
    this.router.navigateByUrl("/member/test");
  }

  private releaseFocus() {
    const activeElement = document.activeElement as HTMLElement | null;
    if (activeElement && typeof activeElement.blur === 'function') {
      activeElement.blur();
    }
  }

  getMemberInitial(): string {
    return (this.username || '会').slice(0, 1).toUpperCase();
  }

  getCurrencyAmounts(): Array<CurrencyAmount> {
    return Array.isArray(this.currencyAmount) ? this.currencyAmount : [];
  }

  trackByMenuTitle(_index: number, item: Menu): string {
    return item.title;
  }

  trackByCurrencyId(_index: number, item: CurrencyAmount): number {
    return item.Id;
  }
}
