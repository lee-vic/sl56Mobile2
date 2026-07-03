import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AlertController, IonInfiniteScroll } from '@ionic/angular';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { ReturnActionResult, ReturnCompletedItem, ReturnInProgressItem, ReturnMobileUpdateResponse } from 'src/app/interfaces/return';
import { ReturnService } from 'src/app/providers/return.service';
import { UiFeedbackService } from 'src/app/providers/ui-feedback.service';
import { isMainlandChinaMobilePhone } from 'src/app/validators/mobile-phone';

type ReturnListTab = 'ongoing' | 'completed';

@Component({
  selector: 'app-return-list',
  templateUrl: './return-list.page.html',
  styleUrls: ['./return-list.page.scss'],
})
export class ReturnListPage implements OnInit, OnDestroy {
  readonly skeletonCards = [1, 2, 3];
  readonly pageSize = 10;
  readonly completedSearchDebounceMs = 280;

  activeTab: ReturnListTab = 'ongoing';
  completedItems: ReturnCompletedItem[] = [];
  ongoingItems: ReturnInProgressItem[] = [];
  allOngoingItems: ReturnInProgressItem[] = [];
  completedPageIndex = 1;
  searchKeyword = '';
  ongoingSearchKeyword = '';
  waitingCount = 0;

  isWaitingCountLoading = false;
  isCompletedLoading = false;
  isOngoingLoading = false;
  isCompletedLoaded = false;
  isOngoingLoaded = false;
  completedLoadError = false;
  ongoingLoadError = false;
  completedHasMore = true;

  isMobileEditOpen = false;
  mobileEditItem: ReturnInProgressItem | null = null;
  mobileDraft = '';
  mobileEditError = '';
  isMobileSaving = false;
  mutatingObjectId: number | null = null;

  private readonly destroy$ = new Subject<void>();
  private completedRequestRunning = false;
  private searchDebounceTimer?: ReturnType<typeof setTimeout>;

  @ViewChild(IonInfiniteScroll, { static: false })
  completedInfiniteScroll?: IonInfiniteScroll;

  constructor(
    private readonly router: Router,
    private readonly service: ReturnService,
    private readonly alertCtrl: AlertController,
    private readonly uiFeedbackService: UiFeedbackService
  ) {}

  ngOnInit(): void {
    this.loadWaitingCount();
    this.loadOngoingList();
    this.loadCompletedFirstPage('');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.clearCompletedSearchDebounce();
  }

  get showOngoingSkeleton(): boolean {
    return this.isOngoingLoading && !this.isOngoingLoaded;
  }

  get showCompletedSkeleton(): boolean {
    return this.isCompletedLoading && !this.isCompletedLoaded;
  }

  get completedCountText(): string {
    if (!this.isCompletedLoaded && this.isCompletedLoading) {
      return '加载中';
    }
    return `${this.completedItems.length} 条`;
  }

  get ongoingCountText(): string {
    if (!this.isOngoingLoaded && this.isOngoingLoading) {
      return '加载中';
    }
    if (this.ongoingSearchKeyword) {
      return `匹配 ${this.ongoingItems.length}/${this.allOngoingItems.length} 条`;
    }
    return `${this.allOngoingItems.length} 条`;
  }

  get waitingCountText(): string {
    return this.isWaitingCountLoading ? '加载中' : `${this.waitingCount} 条`;
  }

  get activeSearchValue(): string {
    return this.activeTab === 'ongoing' ? this.ongoingSearchKeyword : this.searchKeyword;
  }

  get activeSearchPlaceholder(): string {
    return this.activeTab === 'ongoing'
      ? '搜索退货中：单号 / 手机号 / 取件码'
      : '搜索已完成退货：原单号 / 转单号 / 国家 / 渠道';
  }

  get activeSearchAriaLabel(): string {
    return this.activeTab === 'ongoing' ? '搜索退货中记录' : '搜索已完成退货';
  }

  get canSaveMobilePhone(): boolean {
    return !this.isMobileSaving && isMainlandChinaMobilePhone(this.mobileDraft);
  }

  onSegmentChange(event: CustomEvent): void {
    const value = (event.detail as { value?: ReturnListTab }).value;
    if (!this.isReturnListTab(value)) {
      return;
    }
    this.activeTab = value;
  }

  refreshActive(event: CustomEvent): void {
    this.loadWaitingCount();
    if (this.activeTab === 'completed') {
      this.loadCompletedFirstPage(this.searchKeyword, event);
      return;
    }
    this.loadOngoingList(event);
  }

  onSearchInput(event: CustomEvent): void {
    const keyword = this.getEventTextValue(event);
    if (this.activeTab === 'ongoing') {
      this.ongoingSearchKeyword = keyword;
      this.applyOngoingFilter();
      return;
    }

    this.searchKeyword = keyword;
    this.clearCompletedSearchDebounce();
    this.searchDebounceTimer = setTimeout(() => {
      this.loadCompletedFirstPage(keyword);
    }, this.completedSearchDebounceMs);
  }

  clearSearch(): void {
    if (this.activeTab === 'ongoing') {
      this.ongoingSearchKeyword = '';
      this.applyOngoingFilter();
      return;
    }

    this.searchKeyword = '';
    this.clearCompletedSearchDebounce();
    this.loadCompletedFirstPage('');
  }

  scrollCompleted(event: CustomEvent): void {
    if (!this.completedHasMore || this.completedLoadError || this.completedRequestRunning) {
      this.completeInfiniteScroll(event);
      return;
    }
    this.loadCompletedPage(this.searchKeyword, true, event);
  }

  goWaitingList(): void {
    this.router.navigate(['/member/return-waiting']);
  }

  switchTo(tab: ReturnListTab): void {
    this.activeTab = tab;
  }

  detail(item: ReturnCompletedItem): void {
    this.router.navigate(['/member/delivery-record/detail', item.Id]);
  }

  trackCompleted(_index: number, item: ReturnCompletedItem): number {
    return item.Id;
  }

  trackOngoing(_index: number, item: ReturnInProgressItem): number {
    return item.ObjectId;
  }

  getCountryLabel(item: ReturnCompletedItem): string {
    const cnName = (item.CountryNameCN || '').trim();
    if (cnName) {
      return cnName;
    }
    const name = (item.CountryName || '').trim();
    return name || '未标注国家';
  }

  getApplyTypeText(item: ReturnInProgressItem): string {
    return item.ApplyType === 0 ? '退货申请' : '提货资料';
  }

  hasPickupCode(item: ReturnInProgressItem): boolean {
    return !!(item.PickupCode || '').trim();
  }

  isPickupCodeExpired(item: ReturnInProgressItem): boolean {
    const expiredAt = Date.parse(item.ExpiredTime || '');
    return Number.isFinite(expiredAt) && expiredAt < Date.now();
  }

  isMutating(item: ReturnInProgressItem): boolean {
    return this.mutatingObjectId === item.ObjectId;
  }

  async copyPickupCode(item: ReturnInProgressItem): Promise<void> {
    const pickupCode = (item.PickupCode || '').trim();
    if (!pickupCode) {
      this.presentToast('暂无可复制取件码', 'medium');
      return;
    }

    try {
      await this.copyTextToClipboard(pickupCode);
      this.presentToast('取件码已复制', 'success');
    } catch {
      this.presentToast('复制失败，请长按取件码复制', 'danger');
    }
  }

  openMobileEdit(item: ReturnInProgressItem): void {
    if (this.isMutating(item)) {
      return;
    }
    this.mobileEditItem = item;
    this.mobileDraft = item.MobilePhone || '';
    this.mobileEditError = '';
    this.isMobileEditOpen = true;
  }

  closeMobileEdit(force: boolean = false): void {
    if (this.isMobileSaving && !force) {
      return;
    }
    this.isMobileEditOpen = false;
    this.mobileEditItem = null;
    this.mobileDraft = '';
    this.mobileEditError = '';
  }

  onMobileDraftInput(event: CustomEvent): void {
    this.mobileDraft = this.getEventTextValue(event);
    this.validateMobileDraft();
  }

  submitMobilePhone(): void {
    if (!this.mobileEditItem) {
      return;
    }
    if (!this.validateMobileDraft()) {
      return;
    }

    const item = this.mobileEditItem;
    this.isMobileSaving = true;
    this.service.updateMobilePhone(item.ObjectId, this.mobileDraft)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isMobileSaving = false;
        })
      )
      .subscribe({
        next: (response) => {
          const result = this.resolveMobileUpdateResponse(response);
          if (!result.success) {
            this.mobileEditError = result.message;
            return;
          }
          item.MobilePhone = this.mobileDraft;
          this.closeMobileEdit(true);
          this.presentToast('手机号码已更新');
        },
        error: () => {
          this.mobileEditError = '保存失败，请稍后重试';
        }
      });
  }

  resetPickupCode(item: ReturnInProgressItem): void {
    if (!this.isPickupCodeExpired(item) || this.isMutating(item)) {
      return;
    }
    this.mutatingObjectId = item.ObjectId;
    this.service.resetPickupCode(item.ObjectId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.mutatingObjectId = null;
        })
      )
      .subscribe({
        next: (message) => {
          if (message && message.length > 0) {
            this.presentAlert('重新获取失败', message);
            return;
          }
          this.presentToast('已重新获取取件码，请稍后留意短信');
          this.loadOngoingList();
        },
        error: () => {
          this.presentAlert('重新获取失败', '网络或服务暂不可用，请稍后重试。');
        }
      });
  }

  async cancelApply(item: ReturnInProgressItem): Promise<void> {
    if (item.ApplyType !== 0 || this.isMutating(item)) {
      return;
    }
    const alert = await this.alertCtrl.create({
      header: '取消退货申请',
      message: '取消后如需退货，需要重新提交申请。确认取消吗？',
      buttons: [
        {
          text: '继续保留',
          role: 'cancel'
        },
        {
          text: '确认取消',
          role: 'destructive',
          handler: () => {
            this.doCancelApply(item);
          }
        }
      ]
    });
    await alert.present();
  }

  retryActive(): void {
    if (this.activeTab === 'completed') {
      this.loadCompletedFirstPage(this.searchKeyword);
      return;
    }
    this.loadOngoingList();
  }

  private doCancelApply(item: ReturnInProgressItem): void {
    this.mutatingObjectId = item.ObjectId;
    this.service.terminate(item.ObjectId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.mutatingObjectId = null;
        })
      )
      .subscribe({
        next: (res) => {
          if (res.Success === false) {
            this.presentToast(res.ErrMsg || res.Message || '取消失败，请稍后重试', 'danger');
            return;
          }
          this.presentToast('退货申请已取消');
          this.loadOngoingList();
        },
        error: () => {
          this.presentToast('取消失败，请稍后重试', 'danger');
        }
      });
  }

  private loadWaitingCount(): void {
    this.isWaitingCountLoading = true;
    this.service.getWaitReturnList()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isWaitingCountLoading = false;
        })
      )
      .subscribe({
        next: (res) => {
          this.waitingCount = (res || []).length;
        },
        error: () => {
          this.waitingCount = 0;
        }
      });
  }

  private loadOngoingList(refresherEvent?: CustomEvent): void {
    this.isOngoingLoading = true;
    this.isOngoingLoaded = false;
    this.ongoingLoadError = false;
    this.service.getList2()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isOngoingLoading = false;
          this.completeRefresher(refresherEvent);
        })
      )
      .subscribe({
        next: (res) => {
          this.allOngoingItems = (res || []).map(item => this.normalizeOngoingItem(item));
          this.applyOngoingFilter();
          this.isOngoingLoaded = true;
        },
        error: () => {
          this.allOngoingItems = [];
          this.ongoingItems = [];
          this.ongoingLoadError = true;
          this.isOngoingLoaded = true;
        }
      });
  }

  private loadCompletedFirstPage(keyword: string, refresherEvent?: CustomEvent): void {
    this.completedPageIndex = 1;
    this.completedItems = [];
    this.completedHasMore = true;
    this.completedLoadError = false;
    this.isCompletedLoaded = false;
    this.loadCompletedPage(keyword, false, refresherEvent);
  }

  private loadCompletedPage(keyword: string, isScroll: boolean, event?: CustomEvent): void {
    if (this.completedRequestRunning) {
      this.completeInfiniteScroll(event);
      this.completeRefresher(event);
      return;
    }

    this.completedRequestRunning = true;
    this.isCompletedLoading = true;
    this.service.getList1(this.completedPageIndex, keyword)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.completedRequestRunning = false;
          this.isCompletedLoading = false;
          this.completeInfiniteScroll(isScroll ? event : undefined);
          this.completeRefresher(!isScroll ? event : undefined);
        })
      )
      .subscribe({
        next: (res) => {
          const rows = res || [];
          this.completedItems = this.completedItems.concat(rows);
          this.completedHasMore = rows.length >= this.pageSize;
          this.completedPageIndex++;
          this.completedLoadError = false;
          this.isCompletedLoaded = true;
        },
        error: () => {
          this.completedLoadError = true;
          this.isCompletedLoaded = true;
        }
      });
  }

  private normalizeOngoingItem(item: ReturnInProgressItem): ReturnInProgressItem {
    const referenceNumbers = this.parseReferenceNumbers(item.ReferenceNumber);
    return {
      ...item,
      referenceNumbers,
      displayReferenceNumber: referenceNumbers.join(', ')
    };
  }

  private applyOngoingFilter(): void {
    const keyword = this.ongoingSearchKeyword.trim().toLowerCase();
    if (!keyword) {
      this.ongoingItems = this.allOngoingItems.slice();
      return;
    }

    this.ongoingItems = this.allOngoingItems.filter(item => {
      return this.getOngoingSearchText(item).includes(keyword);
    });
  }

  private getOngoingSearchText(item: ReturnInProgressItem): string {
    return [
      item.ReferenceNumber,
      item.displayReferenceNumber,
      item.MobilePhone,
      item.PickupCode,
      item.Remark,
      item.CreateAt,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
  }

  private parseReferenceNumbers(value: string): string[] {
    return (value || '')
      .split(',')
      .map(part => {
        const trimmed = part.trim();
        const index = trimmed.indexOf('_');
        return index >= 0 ? trimmed.substring(index + 1) : trimmed;
      })
      .filter(part => part.length > 0);
  }

  private completeInfiniteScroll(event?: CustomEvent): void {
    if (event && event.target && typeof (event.target as HTMLIonInfiniteScrollElement).complete === 'function') {
      (event.target as HTMLIonInfiniteScrollElement).complete();
      return;
    }
    if (this.completedInfiniteScroll) {
      this.completedInfiniteScroll.complete();
    }
  }

  private completeRefresher(event?: CustomEvent): void {
    const target = event?.target as HTMLIonRefresherElement | undefined;
    if (target && typeof target.complete === 'function') {
      target.complete();
    }
  }

  private getEventTextValue(event: CustomEvent): string {
    return (((event.detail as { value?: string | null }).value) || '').trim();
  }

  private isReturnListTab(value: unknown): value is ReturnListTab {
    return value === 'ongoing' || value === 'completed';
  }

  private validateMobileDraft(): boolean {
    if (isMainlandChinaMobilePhone(this.mobileDraft)) {
      this.mobileEditError = '';
      return true;
    }

    this.mobileEditError = '请输入中国大陆手机号码';
    return false;
  }

  private resolveMobileUpdateResponse(response: ReturnMobileUpdateResponse): { success: boolean; message: string } {
    if (response === null || response === undefined) {
      return { success: true, message: '' };
    }

    if (typeof response === 'string') {
      const message = response.trim();
      return message === ''
        ? { success: true, message: '' }
        : { success: false, message };
    }

    const result = response as ReturnActionResult;
    if (result.Success === false || result.IsSuccess === false || result.Result === false) {
      return {
        success: false,
        message: result.ErrMsg || result.ErrorMessage || result.Message || '保存失败，请稍后重试'
      };
    }

    if (result.Success === true || result.IsSuccess === true || result.Result === true) {
      return { success: true, message: '' };
    }

    return { success: false, message: result.ErrMsg || result.ErrorMessage || result.Message || '保存失败，请稍后重试' };
  }

  private clearCompletedSearchDebounce(): void {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = undefined;
    }
  }

  private async copyTextToClipboard(text: string): Promise<void> {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return;
      } catch {
        // Continue to the textarea fallback for WebViews without clipboard permission.
      }
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', 'true');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);

    try {
      textarea.focus();
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);
      if (!document.execCommand('copy')) {
        throw new Error('copy failed');
      }
    } finally {
      document.body.removeChild(textarea);
    }
  }

  private presentToast(
    message: string,
    color?: 'success' | 'warning' | 'danger' | 'medium'
  ): void {
    this.uiFeedbackService.presentToast(message, 1800, 'middle', undefined, color);
  }

  private async presentAlert(header: string, message: string): Promise<void> {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['知道了']
    });
    await alert.present();
  }
}
