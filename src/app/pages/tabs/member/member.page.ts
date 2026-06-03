import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Menu, MenuRow, Menus } from '../../../interfaces/menu';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { UserService } from '../../../providers/user.service';
import { CookieService } from 'ngx-cookie-service';
import { User } from 'src/app/interfaces/user';
import { NoticeService } from 'src/app/providers/notice.service';
import { Subject, Subscription } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { UiFeedbackService } from 'src/app/providers/ui-feedback.service';

@Component({
  selector: 'app-member',
  templateUrl: './member.page.html',
  styleUrls: ['./member.page.scss'],
})
export class MemberPage implements OnInit, OnDestroy {
  readonly quickMenuMin = 3;
  readonly quickMenuLimit = 6;
  private readonly quickMenuStoragePrefix = 'member_quick_menu_custom_v2_';
  private readonly quickMenuStorageVersion = 2;
  private readonly quickMenuTitles = [
    '价格查询',
    '交货清单确认',
    '问题跟进',
    '交货记录',
    '偏远查询',
    '微信支付',
  ];

  allMenus: Array<Menu> = [
    { title: "价格查询", image: "assets/imgs/member-2.png", type: [0, 1], url: "/member/calculation" },
    { title: "业务公告", image: "assets/imgs/member-19.png", type: [0, 1], url: "/member/notice-list" },
    { title: "偏远查询", image: "assets/imgs/member-3.png", type: [0, 1], url: "/member/remote" },
    { title: "交货清单确认", image: "assets/imgs/member-5.png", type: [0, 1], url: "/member/confirmation" },
    { title: "交货记录", image: "assets/imgs/member-6.png", type: [0, 1], url: "/member/delivery-record/list" },
    { title: "快速预报", image: "assets/imgs/member-4.png", type: [0, 1], url: "/member/import-manifest/list" },
    { title: "问题跟进", image: "assets/imgs/member-18.png", type: [0, 1], url: "/member/problem-list" },
    { title: "退货管理", image: "assets/imgs/member-20.png", type: [0, 1], url: "/member/return-list" },
    { title: "微信支付", image: "assets/imgs/member-8.png", type: [0, 1], url: "/member/wechat-pay/0?cid=1" },
    { title: "银行账号", image: "assets/imgs/member-23.png", type: [0, 1], url: "/member/bank" },
    { title: "消息订阅", image: "assets/imgs/member-22.png", type: [0, 1], url: "/member/message-subscription/list" },
    { title: "联系客服", image: "assets/imgs/member-6.png", type: [0, 1], url: "/member/chat/0" },
    { title: "修改登录密码", image: "assets/imgs/member-11.png", type: [0], url: "/member/modify-password" },
    { title: "修改交货密码", image: "assets/imgs/member-11.png", type: [0], url: "/member/modify-deliverypassword" },
    { title: "子账号管理", image: "assets/imgs/member-12.png", type: [0], url: "/member/sub-account" },
    { title: "微信绑定", image: "assets/imgs/member-13.png", type: [0, 1], url: "/member/wechat-binding" },
    { title: "银行水单上传(优先放货)", image: "assets/imgs/member-17.png", type: [0, 1], url: "/member/bank-slips" },
    { title: "模板下载", image: "assets/imgs/member-7.png", type: [0, 1], url: "/member/template-list" },
    { title: "查看报价", image: "assets/imgs/member-10.png", type: [0], url: "/member/price-list" },
    { title: "合同签署", image: "assets/imgs/member-24.png", type: [0, 1], url: "/member/sign-the-contract" },
    { title: "香港入仓申请", image: "assets/imgs/member-26.png", type: [0, 1], url: "/member/warehouse-application" }
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
  public loading: any;
  userInfo: User;
  username: string = "";
  customerType: number;
  currencyAmount: any;
  unreadNoticeCount: number = 0;
  waitToSignTaskCount: number = 0;
  visibleMenuCount: number = 0;
  noticeIsClicked: boolean = false;
  routerSub: Subscription;
  private readonly destroy$ = new Subject<void>();
  constructor(private userService: UserService,
    private router: Router,
    private cookieService: CookieService,
    private noticeService: NoticeService,
    private uiFeedbackService: UiFeedbackService) {
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
          if (err.status == 401) {
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
          this.refreshUnreadCount();
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

  doLogin(formValue) {
    this.releaseFocus();
    // Web application - always set clientType to web
    formValue.clientType = 1;
    formValue.openId = this.cookieService.get('OpenId');
    formValue.unionId = this.cookieService.get('UnionId');
    this.userService.auth(formValue).subscribe({
      next: (res: any) => {
        this.isLogin = res.Success;
        if (this.isLogin == true) {
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
          console.log(res);
          this.isDashboardLoading = false;
          this.userInfo = res;
          this.username = res.CustomerNo;
          this.customerType = res.Classify;
          this.currencyAmount = res.CurrencyAmount;
          this.waitToSignTaskCount = res.WaitToSignTaskCount;
          let tempMenus = this.allMenus.filter(p => {
            return p.type.indexOf(this.customerType) > -1;
          });
          this.visibleMenuCount = tempMenus.length;
          this.visibleMenuOptions = tempMenus;
          this.applyQuickMenuCustomization(tempMenus, this.getStoredQuickMenuTitles(tempMenus));
          this.refreshUnreadCount();
        },
        error: () => {
          this.isDashboardLoading = false;
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

      const parsedTitles = Array.isArray(parsed.titles) ? parsed.titles : [];
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
    const detail = event.detail as { from: number; to: number; complete: (data?: any) => void };
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

  menuClick(item) {
    this.releaseFocus();


    if (item.url == "") {
      this.showToast('功能升级中...');
    }
    else {
      if (item.title == "业务公告") {
        this.noticeIsClicked = true;

      }
      this.router.navigateByUrl(item.url);
    }

  }
  IsMicroMessenger(): boolean {
    let ua = navigator.userAgent.toLowerCase();
    let m = ua.match(/MicroMessenger/i);

    if (m != null && m.toString() == "micromessenger") {
      return true;
    }
    return false;
  }
  logOff() {
    this.userService.logOff().pipe(takeUntil(this.destroy$)).subscribe(_res => {
      this.isLogin = false;
    });
  }

  private refreshUnreadCount() {
    this.noticeService.getUnreadCount()
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => {
        this.unreadNoticeCount = res;
      });
  }
  openMessage() {
    this.releaseFocus();
    this.router.navigateByUrl("/member/unread-message-list");
  }
  openChat() {
    this.releaseFocus();
    //this.router.navigateByUrl("/member/chat/0");
    this.router.navigate(["/member", "chat", 0])
  }

  goToConfirmation() {
    this.releaseFocus();
    this.router.navigateByUrl('/member/confirmation');
  }

  goToProblemList() {
    this.releaseFocus();
    this.router.navigateByUrl('/member/problem-list');
  }

  wechatPay(id) {
    this.releaseFocus();
    this.router.navigateByUrl("/member/wechat-pay/0?cid=" + id);
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
}
