import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DeliveryRecord } from 'src/app/interfaces/delivery-record';
import { IonSearchbar,IonInfiniteScroll, ToastController } from '@ionic/angular';
import { DeliveryRecordService } from 'src/app/providers/delivery-record.service';
import {ReturnService} from 'src/app/providers/return.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { WaitingReturnEventsService } from 'src/app/providers/waiting-return-events.service';

@Component({
  selector: 'app-delivery-record',
  templateUrl: './delivery-record.page.html',
  styleUrls: ['./delivery-record.page.scss'],
})
export class DeliveryRecordPage implements OnInit, OnDestroy {
  items: Array<DeliveryRecord> = [];
  currentPageIndex: number = 1;
  isShowCheckbox:boolean=false;
  waitReturnCount:number=0;
  isBatchSubmitting = false;
  isLoading = false;
  isLoaded = false;
  hasLoadError = false;
  public searchKeyword: string = '';
  private waitingReturnIdSet = new Set<number>();
  private reloadSubscription: Subscription;
  private searchDebounceTimer?: ReturnType<typeof setTimeout>;

  @ViewChild(IonInfiniteScroll,{static:true}) infiniteScroll: IonInfiniteScroll;
  @ViewChild(IonSearchbar,{static:true}) searchbar: IonSearchbar;
  constructor(
    public service: DeliveryRecordService,
    private router: Router,
    public returnService:ReturnService,
    private waitingReturnEventsService: WaitingReturnEventsService,
    private toastCtrl: ToastController
  ) { }

  ngOnInit() {
    this.loadFirstPage('');
    this.getWaitingReturnList();
    
    this.reloadSubscription = this.waitingReturnEventsService.onReloadWaitingReturn().subscribe(() => {
      this.getWaitingReturnList();
    });
  }

  ionViewWillEnter(): void {
    this.getWaitingReturnList();
  }

  ngOnDestroy() {
    if (this.reloadSubscription) {
      this.reloadSubscription.unsubscribe();
    }
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
  }

  searchItems() {
    this.loadFirstPage(this.getCurrentKeyword());
  }

  onSearchInput(event: CustomEvent): void {
    const keyword = ((event?.detail as any)?.value || '').trim();
    this.searchKeyword = keyword;
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
    this.searchDebounceTimer = setTimeout(() => {
      this.loadFirstPage(keyword);
    }, 280);
  }

  clearSearch(): void {
    this.searchKeyword = '';
    this.loadFirstPage('');
  }

  onRecordClick(item: DeliveryRecord): void {
    if (this.isShowCheckbox) {
      this.toggleItemSelection(item);
      return;
    }
    this.detail(item);
  }

  refreshItems(event: CustomEvent): void {
    this.loadFirstPage(this.searchKeyword, event);
  }

  get totalAmount(): number {
    return this.items.reduce((sum, item) => {
      const amount = parseFloat((item?.Amount as any) || '0');
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
  }

  get selectedCount(): number {
    return this.items.filter(item => !!item.Selected).length;
  }

  get footerSubmitText(): string {
    if (this.isBatchSubmitting) {
      return '正在加入...';
    }
    if (this.selectedCount > 0) {
      return `加入待退货 (${this.selectedCount})`;
    }
    return '加入待退货';
  }

  get canSubmitBatch(): boolean {
    return !this.isBatchSubmitting && this.selectedCount > 0;
  }

  trackByDelivery(_index: number, item: DeliveryRecord): number {
    return item.Id;
  }

  getCountryLabel(item: DeliveryRecord): string {
    if (!item) {
      return '未标注国家';
    }

    const cnName = (item.CountryNameCN || item.CountryNameCn || '').toString().trim();
    if (cnName) {
      return cnName;
    }

    const fallback = (item.CountryName || '').toString().trim();
    return fallback || '未标注国家';
  }

  loadFirstPage(keyword: string, refresherEvent?: CustomEvent): void {
    this.currentPageIndex = 1;
    this.items = [];
    this.isLoading = true;
    this.hasLoadError = false;
    this.enableInfiniteScroll();
    this.getItems(keyword, false, refresherEvent);
  }

  private disableInfiniteScroll(): void {
    if (!this.infiniteScroll) return;
    const setDisabled = (this.infiniteScroll as any).setDisabled;
    if (typeof setDisabled === 'function') {
      setDisabled.call(this.infiniteScroll, true);
      return;
    }
    this.infiniteScroll.disabled = true;
  }

  private enableInfiniteScroll(): void {
    if (!this.infiniteScroll) return;
    const setDisabled = (this.infiniteScroll as any).setDisabled;
    if (typeof setDisabled === 'function') {
      setDisabled.call(this.infiniteScroll, false);
      return;
    }
    this.infiniteScroll.disabled = false;
  }

  //加载数据
  getItems(key:string,isScroll:boolean, refresherEvent?: CustomEvent) {
    this.service.loadList(this.currentPageIndex, key).subscribe(res => {
      this.isLoaded = true;
      this.hasLoadError = false;
      let flag = res.length < 10;
      if(flag){
        this.disableInfiniteScroll();
      }
      for (let i = 0; i < res.length; i++) {
        const item = res[i];
        item.Selected = this.waitingReturnIdSet.has(item.Id);
        this.items.push(item);
      }
      this.currentPageIndex++;
      if(isScroll && this.infiniteScroll) {
        this.infiniteScroll.complete();
      }
      if (refresherEvent) {
        refresherEvent.target['complete']();
      }
      this.isLoading = false;
    }, _ => {
      this.isLoaded = true;
      this.hasLoadError = true;
      if (isScroll && this.infiniteScroll) {
        this.infiniteScroll.complete();
      }
      if (refresherEvent) {
        refresherEvent.target['complete']();
      }
      this.isLoading = false;
    });
  }
    scrollItems(_event: CustomEvent) {
      this.getItems(this.getCurrentKeyword(),true);
   
  }

    detail(item: DeliveryRecord) {
    this.router.navigate(["/member/delivery-record/detail",item.Id]);
  }

  onBatchEntryClick(): void {
    if (this.isBatchSubmitting) {
      return;
    }
    if (!this.isShowCheckbox) {
      this.isShowCheckbox = true;
      this.applyWaitingSelections();
      return;
    }
    this.cancelBatchMode();
  }

  cancelBatchMode(): void {
    this.isShowCheckbox = false;
    this.clearSelections();
  }

  private clearSelections(): void {
    this.items.forEach(p => { p.Selected = false; });
  }

  private getSelectedItems(): DeliveryRecord[] {
    return this.items.filter(item => !!item.Selected);
  }

  private getCurrentKeyword(): string {
    return (this.searchKeyword || (this.searchbar?.value || '').toString()).trim();
  }

  batchReturn(){
    if (this.isBatchSubmitting) {
      return;
    }

    if (!this.isShowCheckbox) {
      this.isShowCheckbox = true;
      this.applyWaitingSelections();
      return;
    }

    const selectedItems = this.getSelectedItems();
    if (selectedItems.length === 0) {
      this.presentToast('请先选择要加入待退货的记录');
      return;
    }

    const selectedIds = Array.from(new Set(selectedItems.map(p => p.Id).filter(id => !!id)));
    if (selectedIds.length === 0) {
      this.presentToast('所选记录无效，请重新勾选');
      return;
    }

    this.isBatchSubmitting = true;
    this.addWaitingReturnList(selectedIds, selectedItems.length);
  }
  clickCheckBox(item:DeliveryRecord){
    this.toggleItemSelection(item);
  }

  private toggleItemSelection(item: DeliveryRecord): void {
    if (this.isBatchSubmitting) {
      return;
    }
    item.Selected = !item.Selected;
  }
  getWaitingReturnList(){
    this.returnService.getWaitReturnList().subscribe(res=>{
      this.waitReturnCount=res.length;
      this.waitingReturnIdSet = new Set((res || []).map(item => item.Id));
      if (this.isShowCheckbox) {
        this.applyWaitingSelections();
      }
    });
  }

  private applyWaitingSelections(): void {
    this.items.forEach(item => {
      item.Selected = this.waitingReturnIdSet.has(item.Id);
    });
  }
  addWaitingReturnList(selectedIds: number[], selectedCount: number = 0){
    if (selectedIds.length === 0) {
      this.isBatchSubmitting = false;
      return;
    }

    this.returnService.getWaitReturnList().subscribe(waitingList => {
      const waitingIdSet = new Set((waitingList || []).map(item => item.Id));
      const idsToAdd = selectedIds.filter(id => !waitingIdSet.has(id));

      if (idsToAdd.length === 0) {
        this.isBatchSubmitting = false;
        this.getWaitingReturnList();
        this.presentWaitingActionToast('所选单号已在待退货，请从底部进入待退货继续');
        return;
      }

      this.returnService.addToWaitReturnList(idsToAdd.toString()).subscribe(_=>{
        this.isBatchSubmitting = false;
        this.getWaitingReturnList();
        const addedCount = Math.min(idsToAdd.length, selectedCount || idsToAdd.length);
        const message = addedCount > 0
          ? `已加入待退货 ${addedCount} 条，请从底部进入待退货继续`
          : '已加入待退货列表，请从底部进入待退货继续';
        this.presentWaitingActionToast(message);
      }, _ => {
        this.isBatchSubmitting = false;
        this.presentToast('加入失败，请稍后重试');
      });
    }, _ => {
      this.isBatchSubmitting = false;
      this.presentToast('读取待退货失败，请稍后重试');
    });
  }

  private presentToast(message: string): void {
    this.toastCtrl.create({
      message,
      duration: 1800,
      position: 'middle'
    }).then(p => p.present());
  }

  private presentWaitingActionToast(message: string): void {
    this.toastCtrl.create({
      message,
      duration: 2200,
      position: 'middle'
    }).then(p => p.present());
  }
  waitingReturnList(){
    this.waitingReturnEventsService.notifyReloadWaitingReturn();
    this.router.navigate(["/member/return-waiting"]);
  }
}
