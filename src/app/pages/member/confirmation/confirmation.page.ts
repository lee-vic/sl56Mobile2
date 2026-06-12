import { Component, OnDestroy, OnInit } from '@angular/core';
import { ConfirmationService } from 'src/app/providers/confirmation.service';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { DeliveryRecord } from 'src/app/interfaces/delivery-record';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { UiFeedbackService } from 'src/app/providers/ui-feedback.service';

@Component({
  selector: 'app-confirmation',
  templateUrl: './confirmation.page.html',
  styleUrls: ['./confirmation.page.scss'],
})
export class ConfirmationPage implements OnInit, OnDestroy {
  allSelected: boolean = false;
  totalAmount: number = 0;
  selectedCount: number = 0;
  selectedAmount: number = 0;
  showConfirmSuccess: boolean = false;
  lastConfirmedCount: number = 0;
  isLoading: boolean = false;
  searchKeyword: string = '';
  viewFilter: 'all' | 'selected' = 'all';
  receiveGoodsDetailList: DeliveryRecord[] = [];
  searchList: DeliveryRecord[] = [];
  private successHintTimer?: ReturnType<typeof setTimeout>;
  private readonly destroy$ = new Subject<void>();
  constructor(public service: ConfirmationService,
    public alertCtrl: AlertController,
    private readonly uiFeedback: UiFeedbackService,
    private router: Router
    ) { }

  ngOnInit(): void {
    this.loadRecords();
  }

  ngOnDestroy(): void {
    this.clearSuccessHintTimer();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadRecords(event?: CustomEvent): void {
    this.isLoading = true;
    this.service.getReceiveGoodsDetailList()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          event?.detail?.complete();
        })
      )
      .subscribe(res => {
        this.receiveGoodsDetailList = res || [];
        this.applyFilters();
        this.updateStats();
        this.updateAllSelectedState();
      }, () => {
        this.presentToast('清单加载失败，请稍后重试', 'warning', 2200);
      });
  }

  onRefresh(event: CustomEvent) {
    this.loadRecords(event);
  }

  onAllClick() {
    this.resetSuccessHint();
    this.searchList.forEach(element => {
      element.Selected = this.allSelected;
    });
    this.updateStats();
  }

  onItemSelectionChange() {
    this.resetSuccessHint();
    this.updateStats();
    this.updateAllSelectedState();
  }

  private updateAllSelectedState() {
    if (!this.searchList || this.searchList.length === 0) {
      this.allSelected = false;
      return;
    }
    this.allSelected = this.searchList.every(item => item.Selected === true);
  }

  updateStats() {
    this.totalAmount = this.receiveGoodsDetailList
      .reduce((sum, item) => sum + this.parseAmount(item.Amount), 0);

    this.selectedCount = this.receiveGoodsDetailList.filter(item => item.Selected === true).length;
    this.selectedAmount = this.receiveGoodsDetailList
      .filter(item => item.Selected === true)
      .reduce((sum, item) => sum + this.parseAmount(item.Amount), 0);
  }

  getVisibleCount(): number {
    return this.searchList?.length || 0;
  }

  formatAmount(amount: any): string {
    const value = this.parseAmount(amount);
    return isNaN(value) ? '0.00' : value.toFixed(2);
  }

  trackByItemId(_index: number, item: DeliveryRecord): number {
    return item.Id;
  }

  getItems(ev: CustomEvent) {
    this.resetSuccessHint();
    const val = (ev.detail && ev.detail.value) ? ev.detail.value : '';
    this.searchKeyword = val;
    this.applyFilters();
    this.updateAllSelectedState();
    this.updateStats();
  }

  onFilterChange(ev: CustomEvent) {
    this.resetSuccessHint();
    const nextValue = (ev.detail && ev.detail.value) ? ev.detail.value : 'all';
    this.viewFilter = nextValue === 'selected' ? 'selected' : 'all';
    this.applyFilters();
    this.updateAllSelectedState();
    this.updateStats();
  }

  resetFilters() {
    this.resetSuccessHint();
    this.searchKeyword = '';
    this.viewFilter = 'all';
    this.applyFilters();
    this.updateAllSelectedState();
    this.updateStats();
  }

  private applyFilters() {
    const keyword = (this.searchKeyword || '').trim().toLowerCase();
    let nextList = this.receiveGoodsDetailList;

    if (keyword) {
      nextList = nextList.filter((item) => {
        const reference = (item.ReferenceNumber || '').toLowerCase();
        return reference.indexOf(keyword) > -1;
      });
    }

    if (this.viewFilter === 'selected') {
      nextList = nextList.filter(item => item.Selected === true);
    }

    this.searchList = nextList;
  }

  onItemConfirmClick(item: { Id: number | Number }) {
    this.alertCtrl.create({
      header: '确认出货?',
      message: '请仔细核实数据准确无误，运单确认后任何更改将收取操作费！',
      buttons: [
        {
          text: '取消'
        },
        {
          text: '确认',
          handler: () => {
            this.doConfirm(item.Id.toString());
          }
        }
      ]
    }).then(p => p.present());

  }
  onConfirmClick() {
    const selectedItems = this.getSelectedIds();

    if (selectedItems.length === 0) {
      this.presentToast('请选择需要确认的运单', 'warning');
    }
    else {
      this.alertCtrl.create({
        header: '确认出货?',
        message: '本次共选择' + selectedItems.length + "票.请仔细核实数据准确无误，运单确认后任何更改将收取操作费！",
        buttons: [
          {
            text: '取消'
          },
          {
            text: '确认',
            handler: () => {
              this.doConfirm(selectedItems.toString());
            }
          }
        ]
      }).then(p => p.present());

    }
  }
  doConfirm(selectedIdList: string) {
    const selectedIds = selectedIdList
      .split(',')
      .map(id => id.trim())
      .filter(id => id !== '');

    if (selectedIds.length === 0) {
      this.presentToast('未选择有效运单', 'warning');
      return;
    }

    this.uiFeedback.presentLoading('正在提交确认，请稍候...').then(loading => {
      this.service.confirm(selectedIds.toString())
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.uiFeedback.dismissLoading(loading);
        })
      )
      .subscribe({
        next: (res) => {
          this.receiveGoodsDetailList = res || [];
          this.applyFilters();
          this.allSelected = false;
          this.updateStats();
          this.updateAllSelectedState();
          this.showSubmitSuccess(selectedIds.length);
          this.presentToast('已确认' + selectedIds.length + '票运单', 'success');
        },
        error: (err) => {
          this.presentToast(this.getErrorMessage(err), 'danger', 2600);
        }
      });
    });
  }

  private parseAmount(amount: unknown): number {
    const raw = amount == null ? '0' : String(amount);
    const value = parseFloat(raw);
    return isNaN(value) ? 0 : value;
  }

  private getSelectedIds(): number[] {
    return this.receiveGoodsDetailList
      .filter(item => item.Selected === true)
      .map(item => Number(item.Id))
      .filter(id => Number.isFinite(id));
  }

  private getErrorMessage(err: any): string {
    if (err && typeof err.message === 'string' && err.message.trim() !== '') {
      return '提交失败：' + err.message;
    }
    return '提交失败，请稍后重试';
  }

  private showSubmitSuccess(count: number): void {
    this.lastConfirmedCount = count;
    this.showConfirmSuccess = true;
    this.clearSuccessHintTimer();
    this.successHintTimer = setTimeout(() => {
      this.showConfirmSuccess = false;
    }, 1800);
  }

  private resetSuccessHint(): void {
    if (this.showConfirmSuccess) {
      this.showConfirmSuccess = false;
    }
    this.clearSuccessHintTimer();
  }

  private clearSuccessHintTimer(): void {
    if (this.successHintTimer) {
      clearTimeout(this.successHintTimer);
      this.successHintTimer = undefined;
    }
  }

  private presentToast(message: string, color: 'success' | 'warning' | 'danger' = 'success', duration: number = 1500) {
    this.uiFeedback.presentToast(message, duration, 'middle', 'member-theme-toast', color);
  }

  detail(item: { Id: number | Number }) {
    this.router.navigate(["/member/delivery-record/detail",item.Id]);
  }

  goMemberCenter() {
    this.router.navigateByUrl('/app/tabs/member');
  }

}
