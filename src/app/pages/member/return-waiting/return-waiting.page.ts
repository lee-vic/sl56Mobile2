import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { AlertController, NavController, ToastController } from '@ionic/angular';
import { Observable, Subject } from 'rxjs';
import { filter, finalize, takeUntil } from 'rxjs/operators';
import { ReturnWaitingItem } from 'src/app/interfaces/return';
import { ReturnService } from 'src/app/providers/return.service';
import { WaitingReturnEventsService } from 'src/app/providers/waiting-return-events.service';

@Component({
  selector: 'app-return-waiting',
  templateUrl: './return-waiting.page.html',
  styleUrls: ['./return-waiting.page.scss']
})
export class ReturnWaitingPage implements OnInit, OnDestroy {
  readonly skeletonCards = [1, 2, 3];

  items: ReturnWaitingItem[] = [];
  selectedCount = 0;
  isMutating = false;
  isLoading = false;
  isLoaded = false;
  hasLoadError = false;

  private readonly destroy$ = new Subject<void>();

  constructor(
    public service: ReturnService,
    public alert: AlertController,
    public navCtrl: NavController,
    public toastCtrl: ToastController,
    private readonly waitingReturnEventsService: WaitingReturnEventsService,
    private readonly router: Router
  ) {}

  get hasItems(): boolean {
    return this.items.length > 0;
  }

  get showSkeleton(): boolean {
    return this.isLoading && !this.isLoaded;
  }

  get allSelected(): boolean {
    return this.hasItems && this.selectedCount === this.items.length;
  }

  get canRemove(): boolean {
    return !this.isMutating && this.selectedCount > 0;
  }

  get canClear(): boolean {
    return !this.isMutating && this.hasItems;
  }

  get canSubmit(): boolean {
    return !this.isMutating && this.selectedCount > 0;
  }

  get applyButtonText(): string {
    if (this.isMutating) {
      return '处理中...';
    }
    return `提交退货申请 (${this.selectedCount})`;
  }

  private get selectedIds(): string {
    return this.items.filter(item => item.Selected).map(item => item.Id).toString();
  }

  ngOnInit(): void {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.getWaitingReturnList();
      });

    this.getWaitingReturnList();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  refreshItems(event: CustomEvent): void {
    this.getWaitingReturnList(event);
  }

  check(item: ReturnWaitingItem): void {
    if (this.isMutating) {
      return;
    }
    item.Selected = !item.Selected;
    this.updateSelectedCount();
  }

  getWaitingReturnList(refresherEvent?: CustomEvent): void {
    this.isLoading = true;
    this.isLoaded = false;
    this.hasLoadError = false;
    this.service.getWaitReturnList()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.completeRefresher(refresherEvent);
        })
      )
      .subscribe({
        next: (res) => {
          this.items = (res || []).map(item => ({ ...item, Selected: true }));
          this.isLoaded = true;
          this.updateSelectedCount();
        },
        error: () => {
          this.items = [];
          this.hasLoadError = true;
          this.isLoaded = true;
          this.updateSelectedCount();
        }
      });
  }

  remove(): void {
    if (this.isMutating) {
      return;
    }
    if (this.selectedCount === 0) {
      this.presentToast('请先选择要移除的单号');
      return;
    }

    this.runWaitingMutation(
      () => this.service.removeWaitReturnList(this.selectedIds),
      '已移除所选单号',
      '移除失败，请稍后重试',
      () => {
        this.items = this.items.filter(item => !item.Selected);
      }
    );
  }

  removeOne(item: ReturnWaitingItem, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (this.isMutating || !item || !item.Id) {
      return;
    }

    this.runWaitingMutation(
      () => this.service.removeWaitReturnList(item.Id.toString()),
      '已移除该记录',
      '移除失败，请稍后重试',
      () => {
        this.items = this.items.filter(row => row.Id !== item.Id);
      }
    );
  }

  async clear(): Promise<void> {
    if (this.isMutating || this.items.length === 0) {
      return;
    }
    const alert = await this.alert.create({
      header: '清空待退货列表',
      message: '清空后需重新从交货记录添加，确认清空吗？',
      buttons: [
        {
          text: '取消'
        },
        {
          text: '确认清空',
          handler: () => {
            this.runWaitingMutation(
              () => this.service.clearWaitReturnList(),
              '待退货列表已清空',
              '清空失败，请稍后重试',
              () => {
                this.items = [];
              }
            );
          }
        }
      ]
    });

    await alert.present();
  }

  goReturn(): void {
    if (this.isMutating) {
      return;
    }
    if (this.selectedCount === 0) {
      this.presentToast('请先选择要申请退货的单号');
      return;
    }
    this.navCtrl.navigateForward('/member/return-apply', { queryParams: { type: 0, ids: this.selectedIds } });
  }

  selectAll(event?: CustomEvent): void {
    if (this.isMutating) {
      return;
    }
    const checked = event ? !!(event.detail as { checked?: boolean }).checked : !this.allSelected;
    this.items.forEach(item => {
      item.Selected = checked;
    });
    this.updateSelectedCount();
  }

  back(): void {
    this.waitingReturnEventsService.notifyReloadWaitingReturn();
  }

  retryLoad(): void {
    this.getWaitingReturnList();
  }

  private presentToast(message: string): void {
    this.toastCtrl.create({
      message,
      duration: 1500,
      position: 'middle'
    }).then(toast => toast.present());
  }

  private updateSelectedCount(): void {
    this.selectedCount = this.items.filter(item => !!item.Selected).length;
  }

  private runWaitingMutation(
    requestFactory: () => Observable<unknown>,
    successMessage: string,
    errorMessage: string,
    applySuccess: () => void
  ): void {
    this.isMutating = true;
    requestFactory()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isMutating = false;
        })
      )
      .subscribe({
        next: () => {
          applySuccess();
          this.updateSelectedCount();
          this.waitingReturnEventsService.notifyReloadWaitingReturn();
          this.presentToast(successMessage);
        },
        error: () => {
          this.presentToast(errorMessage);
        }
      });
  }

  private completeRefresher(event?: CustomEvent): void {
    const target = event?.target as HTMLIonRefresherElement | undefined;
    if (target && typeof target.complete === 'function') {
      target.complete();
    }
  }
}
