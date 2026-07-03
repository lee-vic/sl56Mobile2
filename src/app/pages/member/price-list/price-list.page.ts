import { Component, OnInit, ViewChild } from '@angular/core';
import { IonInfiniteScroll } from '@ionic/angular';
import { finalize } from 'rxjs/operators';
import { apiUrl } from 'src/app/global';
import { PriceInfo } from 'src/app/interfaces/price';
import { PriceService } from 'src/app/providers/price.service';
import { UiFeedbackService } from 'src/app/providers/ui-feedback.service';

@Component({
  selector: 'app-price-list',
  templateUrl: './price-list.page.html',
  styleUrls: ['./price-list.page.scss'],
})
export class PriceListPage implements OnInit {
  private readonly pageSize = 10;

  @ViewChild(IonInfiniteScroll, { static: true }) infiniteScroll: IonInfiniteScroll;

  currentPageIndex = 1;
  items: PriceInfo[] = [];
  isBusy = false;
  isInitialLoading = false;
  isLoaded = false;
  loadError = false;
  allowDownload = false;
  downloadUrl = `${apiUrl}/Price/Download`;

  constructor(
    private service: PriceService,
    private readonly uiFeedbackService: UiFeedbackService
  ) {
  }

  ngOnInit(): void {
    this.refreshList();
  }

  getItems(event?: CustomEvent): void {
    if (this.isBusy) {
      return;
    }

    this.isBusy = true;
    this.loadError = false;
    this.service.getList(this.currentPageIndex).pipe(
      finalize(() => {
        this.isBusy = false;
        this.isInitialLoading = false;
        this.isLoaded = true;
        this.completeEvent(event);
      })
    ).subscribe({
      next: res => {
        this.allowDownload = res.AllowDownloadPrice;
        if (res.Items.length < this.pageSize) {
          this.disableInfiniteScroll();
        }
        this.items.push(...res.Items);
        this.currentPageIndex++;
      },
      error: () => {
        this.loadError = true;
        this.uiFeedbackService.presentToast('报价列表加载失败，请稍后重试', 2200, 'middle', undefined, 'danger');
      }
    });
  }

  refresh(event?: CustomEvent): void {
    this.refreshList(event);
  }

  refreshList(event?: CustomEvent): void {
    this.isInitialLoading = this.items.length === 0;
    this.loadError = false;
    this.currentPageIndex = 1;
    this.items = [];
    this.enableInfiniteScroll();
    this.getItems(event);
  }

  trackByPrice(_index: number, item: PriceInfo): string {
    return `${item.Name}-${item.ModeOfTransportName}-${item.StartDate}`;
  }

  private completeEvent(event?: CustomEvent): void {
    const target = event?.target as HTMLIonRefresherElement | HTMLIonInfiniteScrollElement;
    if (target && typeof target.complete === 'function') {
      target.complete();
      return;
    }
    if (this.infiniteScroll) {
      this.infiniteScroll.complete();
    }
  }

  private disableInfiniteScroll(): void {
    if (!this.infiniteScroll) return;
    const infiniteScroll = this.infiniteScroll as IonInfiniteScroll & { setDisabled?: (disabled: boolean) => void };
    if (typeof infiniteScroll.setDisabled === 'function') {
      infiniteScroll.setDisabled(true);
      return;
    }
    this.infiniteScroll.disabled = true;
  }

  private enableInfiniteScroll(): void {
    if (this.infiniteScroll) {
      this.infiniteScroll.disabled = false;
    }
  }
}
