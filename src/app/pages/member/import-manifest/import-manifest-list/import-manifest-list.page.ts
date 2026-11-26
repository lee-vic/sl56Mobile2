import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { IonSearchbar, IonInfiniteScroll, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { Observable, Subject, Subscription } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { ImportManifestService } from 'src/app/providers/import-manifest.service';
import { ImportManifestDomainService } from 'src/app/providers/import-manifest-domain.service';
import { AttachmentTypeOption, ForecastBatchResult, ImportManifestListItem } from 'src/app/interfaces/import-manifest';

@Component({
  selector: 'app-import-manifest-list',
  templateUrl: './import-manifest-list.page.html',
  styleUrls: ['./import-manifest-list.page.scss'],
})
export class ImportManifestListPage implements OnInit, OnDestroy {
  items: ImportManifestListItem[] = [];
  currentPageIndex: number = 1;
  private readonly pageSize: number = 10;

  isLoading: boolean = false;
  isLoaded: boolean = false;
  hasLoadError: boolean = false;
  loadErrorMessage: string = '';

  searchKeyword: string = '';
  isSelectionMode: boolean = false;
  selectedIds: Set<number> = new Set();
  isBatchDeleting: boolean = false;

  private searchDebounceTimer?: ReturnType<typeof setTimeout>;
  private listRequest?: Subscription;
  private isListRequestRunning: boolean = false;
  private readonly destroy$ = new Subject<void>();

  @ViewChild(IonInfiniteScroll, { static: true }) infiniteScroll: IonInfiniteScroll;
  @ViewChild(IonSearchbar, { static: true }) searchbar: IonSearchbar;

  constructor(
    public service: ImportManifestService,
    public domain: ImportManifestDomainService,
    private router: Router,
    private alertCtrl: AlertController
  ) {}

  onlyUnprinted = false;
  showBatchDocuments = false;
  documentTypes: AttachmentTypeOption[] = [];
  archive?: File;
  documentType = 0;
  batch?: ForecastBatchResult;
  batchBusy = false;

  openBatchDocuments() {
    this.showBatchDocuments = !this.showBatchDocuments;
    if (this.showBatchDocuments && !this.documentTypes.length) {
      this.service.getAttachmentTypes().subscribe({ next: types => this.documentTypes = types,
        error: () => this.showAlert('资料类型加载失败', '请稍后重试') });
    }
  }

  selectArchive(event: Event) {
    this.archive = (event.target as HTMLInputElement).files?.[0];
    this.batch = undefined;
  }

  submitArchive(action: 'preview' | 'commit' | 'status') {
    if (this.batchBusy) return;

    const receipt = this.batch?.BatchId;
    let request: Observable<ForecastBatchResult>;
    if (action === 'status') {
      // 查询只需上次检查的回执，客户无需再次选择压缩包。
      if (!receipt) return;
      request = this.service.batchStatus(receipt);
    } else {
      if (!this.archive || !this.documentType || (action === 'commit' && !receipt)) return;
      request = this.service.batchDocuments(this.archive, this.documentType, action === 'commit' ? receipt : undefined);
    }

    this.batchBusy = true;
    request.pipe(takeUntil(this.destroy$), finalize(() => this.batchBusy = false)).subscribe({
      next: result => {
        if (result.Items?.length || !result.Error) this.batch = result;
        if (result.Error) {
          this.showAlert('资料处理失败', result.Error);
        } else if (result.Status === 2) {
          this.loadFirstPage(this.searchKeyword);
        }
      },
      error: () => this.showAlert('请求未完成', action === 'preview'
        ? '请稍后重新检查压缩包。'
        : '请点击“查询结果”，确认这批资料是否已上传。'),
    });
  }

  labelUrl = '';
  labelBusy = false;
  private labelRequest?: Subscription;
  private includedIds?: number[];

  private resetLabelFile() {
    this.labelRequest?.unsubscribe();
    this.includedIds = undefined;
    if (this.labelUrl) URL.revokeObjectURL(this.labelUrl);
    this.labelUrl = '';
  }

  openPreparedLabels() {
    if (this.labelUrl) window.open(this.labelUrl, '_blank', 'noopener');
  }

  selectedFile(kind: 'zip' | 'labels' | 'manifest') {
    const ids = Array.from(this.selectedIds);
    if (kind !== 'labels') {
      this.service.openDocumentsFile(ids, kind);
      return;
    }
    this.resetLabelFile();
    this.includedIds = [];
    this.labelBusy = true;
    this.labelRequest = this.service.getMergedLabels(ids).pipe(finalize(() => this.labelBusy = false)).subscribe({
      next: response => {
        // 合并文件可能只含部分预报。登记时只使用服务端确认已放入 PDF 的单号。
        const included = new Set((response.headers.get('X-MergePrint-Included') || '').split(',').map(Number));
        const printableIds = ids.filter(id => included.has(id));
        if (!response.body || !printableIds.length) {
          this.showAlert('打印失败', '未取得可登记的标签，请重试');
          return;
        }
        this.includedIds = printableIds;
        this.labelUrl = URL.createObjectURL(response.body);
        const failed = ids.filter(id => !included.has(id));
        if (failed.length) this.showAlert('部分标签未生成', failed.map(id =>
          this.items.find(item => item.Id === id)?.ObjectNo || id).join('、') + ' 将保留未打印状态');
      }, error: () => this.showAlert('打印失败', '请重新生成打印 PDF')
    });
  }

  async confirmPrinted() {
    const ids = this.includedIds ?? Array.from(this.selectedIds);
    if (!ids.length || this.labelBusy) return;
    const dialog = await this.alertCtrl.create({header: '登记打印',
      message: '确认所选 ' + ids.length + ' 票的入仓标签已经打印？',
      buttons: [{ text: '取消', role: 'cancel' }, { text: '已打印', handler: () => {
        this.service.markPrinted(ids).subscribe({next: result => {
          if (!result.Success || result.UpdatedIds?.length !== ids.length) this.showAlert('打印登记结果', result.Message);
          this.clearSelection();
          this.loadFirstPage(this.searchKeyword);
        }, error: () => this.showAlert('登记失败', '请稍后重试') });
      }}] });
    await dialog.present();
  }

  ngOnInit() {
    this.loadFirstPage();
  }

  ionViewWillEnter() {
    if (!this.service.consumeListDirty()) return;

    this.clearSelection();
    this.isSelectionMode = false;
    this.loadFirstPage(this.searchKeyword);
  }

  ngOnDestroy() {
    this.resetLabelFile();
    this.destroy$.next();
    this.destroy$.complete();
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
  }

  // ========== Data Loading ==========

  loadFirstPage(key?: string) {
    this.listRequest?.unsubscribe();
    this.clearSelection();
    this.currentPageIndex = 1;
    this.items = [];
    this.isLoading = true;
    this.isLoaded = false;
    this.hasLoadError = false;
    this.infiniteScroll.disabled = false;
    this.getItems(key || '', false);
  }

  getItems(key: string, isScroll: boolean) {
    if (this.isListRequestRunning) return;
    this.isListRequestRunning = true;

    this.listRequest = this.service
      .getList(
        this.currentPageIndex,
        key || undefined, undefined, undefined, this.onlyUnprinted
      )
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isListRequestRunning = false;
          this.isLoading = false;
          if (!isScroll) {
            this.infiniteScroll?.complete();
          }
        })
      )
      .subscribe({
        next: (res) => {
          this.isLoaded = true;
          this.hasLoadError = false;
          if (res.Rows && res.Rows.length > 0) {
            this.items.push(...res.Rows);
            this.currentPageIndex++;
            if (res.Rows.length < this.pageSize) {
              this.infiniteScroll.disabled = true;
            }
          } else {
            if (!isScroll) {
              this.infiniteScroll.disabled = true;
            }
          }
        },
        error: (err) => {
          this.hasLoadError = true;
          this.loadErrorMessage = '加载失败，请下拉刷新重试';
          console.error('ImportManifest list load error:', err);
        },
      });
  }

  loadNextPage(event: any) {
    this.getItems(this.searchKeyword, true);
    event.target.complete();
  }

  refreshItems(event: any) {
    this.loadFirstPage(this.searchKeyword);
    setTimeout(() => {
      event.target.complete();
    }, 500);
  }

  // ========== Search ==========

  onSearchInput(event: CustomEvent): void {
    const keyword = (event?.detail as any)?.value || '';
    this.searchKeyword = keyword;
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
    this.searchDebounceTimer = setTimeout(() => {
      this.loadFirstPage(keyword.trim());
    }, 280);
  }

  onSearchCancel(): void {
    this.searchKeyword = '';
    this.loadFirstPage('');
  }

  // ========== Selection Mode ==========

  toggleSelectionMode() {
    this.isSelectionMode = !this.isSelectionMode;
    if (!this.isSelectionMode) {
      this.clearSelection();
    }
  }

  toggleItemSelection(item: ImportManifestListItem) {
    this.resetLabelFile();
    item.Selected = !item.Selected;
    if (item.Selected) {
      this.selectedIds.add(item.Id);
    } else {
      this.selectedIds.delete(item.Id);
    }
  }

  getSelectedCount(): number {
    return this.selectedIds.size;
  }

  selectAllVisible(): void {
    this.resetLabelFile();
    this.items.forEach((item) => {
      item.Selected = true;
      this.selectedIds.add(item.Id);
    });
  }

  clearSelection(): void {
    this.resetLabelFile();
    this.selectedIds.clear();
    this.items.forEach((item) => (item.Selected = false));
  }

  // ========== Actions ==========

  viewDetail(item: ImportManifestListItem) {
    if (this.isSelectionMode) {
      this.toggleItemSelection(item);
      return;
    }
    this.router.navigate(['/member/import-manifest/detail', item.Id]);
  }

  createNew() {
    this.router.navigate(['/member/import-manifest/form']);
  }

  goToImport() {
    this.router.navigate(['/member/import-manifest/import']);
  }

  async deleteItem(item: ImportManifestListItem) {
    const alert = await this.alertCtrl.create({
      header: '确认删除',
      message: `确定要删除预报单号 "${item.ObjectNo}" 吗？`,
      buttons: [
        { text: '取消', role: 'cancel' },
        {
          text: '删除',
          role: 'destructive',
          handler: () => {
            this.performDelete(item.Id);
          },
        },
      ],
    });
    await alert.present();
  }

  private performDelete(id: number) {
    this.service.delete(id).subscribe({
      next: (res) => {
        if (res.Success) {
          this.items = this.items.filter((i) => i.Id !== id);
          this.selectedIds.delete(id);
        } else {
          this.showAlert('删除失败', res.ErrMsg);
        }
      },
      error: () => {
        this.showAlert('错误', '网络错误，请稍后重试');
      },
    });
  }

  async confirmBulkDelete() {
    const count = this.getSelectedCount();
    if (count === 0) return;
    const receivedStatusName = this.items.find((item) => item.StatusCode === 1)?.StatusName;

    const alert = await this.alertCtrl.create({
      header: '确认批量删除',
      message: `确定要删除选中的 ${count} 条预报吗？${this.domain.getCustomerStatusNameByCode(1, receivedStatusName)}的预报将被自动跳过。`,
      buttons: [
        { text: '取消', role: 'cancel' },
        {
          text: '删除',
          role: 'destructive',
          handler: () => {
            this.performBulkDelete();
          },
        },
      ],
    });
    await alert.present();
  }

  private performBulkDelete() {
    if (this.isBatchDeleting) return;
    this.isBatchDeleting = true;

    const ids = Array.from(this.selectedIds);
    this.service.bulkDelete(ids).subscribe({
      next: (res) => {
        this.isBatchDeleting = false;
        if (res.SkippedMessages && res.SkippedMessages.length > 0) {
          this.showAlert('删除结果', res.Message);
        }
        this.isSelectionMode = false;
        this.selectedIds.clear();
        this.loadFirstPage(this.searchKeyword);
      },
      error: () => {
        this.isBatchDeleting = false;
        this.showAlert('错误', '网络错误，请稍后重试');
      },
    });
  }

  // ========== Helpers ==========

  getStatusColor(statusCode: number): string {
    return this.domain.getStatusColor(statusCode);
  }

  getCustomerStatusName(item: ImportManifestListItem): string {
    return this.domain.getCustomerStatusNameByCode(item?.StatusCode, item?.StatusName);
  }

  canDelete(item: ImportManifestListItem): boolean {
    return this.domain.canDelete(item?.StatusCode);
  }

  trackById(_index: number, item: ImportManifestListItem): number {
    return item.Id;
  }

  private async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['确定'],
    });
    await alert.present();
  }
}
