import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { IonSearchbar, IonInfiniteScroll, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { ImportManifestService } from 'src/app/providers/import-manifest.service';
import { ImportManifestListItem } from 'src/app/interfaces/import-manifest';

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
  private isListRequestRunning: boolean = false;
  private readonly destroy$ = new Subject<void>();

  @ViewChild(IonInfiniteScroll, { static: true }) infiniteScroll: IonInfiniteScroll;
  @ViewChild(IonSearchbar, { static: true }) searchbar: IonSearchbar;

  constructor(
    public service: ImportManifestService,
    private router: Router,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    this.loadFirstPage();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
  }

  // ========== Data Loading ==========

  loadFirstPage(key?: string) {
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

    this.service
      .getList(
        this.currentPageIndex,
        key || undefined
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
    this.items.forEach((item) => {
      item.Selected = true;
      this.selectedIds.add(item.Id);
    });
  }

  clearSelection(): void {
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

    const alert = await this.alertCtrl.create({
      header: '确认批量删除',
      message: `确定要删除选中的 ${count} 条预报吗？已交货的预报将被自动跳过。`,
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
    switch (statusCode) {
      case 0:
        return 'warning';
      case 1:
        return 'success';
      case 2:
        return 'danger';
      default:
        return 'medium';
    }
  }

  getCustomerStatusName(item: ImportManifestListItem): string {
    if (!item || !item.StatusName) {
      return '未知';
    }
    return item.StatusName === '已收货' ? '已交货' : item.StatusName;
  }

  canDelete(item: ImportManifestListItem): boolean {
    return item.StatusCode === 0;
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
