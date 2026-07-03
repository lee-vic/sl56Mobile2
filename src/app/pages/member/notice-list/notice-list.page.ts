import { Component, OnInit, ViewChild } from '@angular/core';
import { IonInfiniteScroll, NavController } from '@ionic/angular';
import { finalize } from 'rxjs/operators';
import { Notice } from 'src/app/interfaces/notice';
import { NoticeService } from 'src/app/providers/notice.service';
import { UiFeedbackService } from 'src/app/providers/ui-feedback.service';

@Component({
  selector: 'app-notice-list',
  templateUrl: './notice-list.page.html',
  styleUrls: ['./notice-list.page.scss'],
})
export class NoticeListPage implements OnInit {
  private readonly pageSize = 10;

  @ViewChild(IonInfiniteScroll, { static: true }) infiniteScroll: IonInfiniteScroll;

  isBusy = false;
  isInitialLoading = false;
  isLoaded = false;
  loadError = false;
  currentPageIndex = 1;
  items: Notice[] = [];

  constructor(
    private readonly service: NoticeService,
    public navCtrl: NavController,
    private readonly uiFeedbackService: UiFeedbackService
  ) { }

  ngOnInit(): void {
    this.refreshList();
  }

  getItems(event?: CustomEvent): void {
    if (this.isBusy) {
      return;
    }

    this.isBusy = true;
    this.loadError = false;

    this.service.getNoticeList(this.currentPageIndex).pipe(
      finalize(() => {
        this.isBusy = false;
        this.isInitialLoading = false;
        this.isLoaded = true;
        this.completeEvent(event);
      })
    ).subscribe({
      next: res => {
        this.items.push(...res);
        if (res.length < this.pageSize) {
          this.disableInfiniteScroll();
        } else {
          this.currentPageIndex++;
        }
      },
      error: () => {
        this.loadError = true;
        this.uiFeedbackService.presentToast('业务公告加载失败，请稍后重试', 2200, 'middle', undefined, 'danger');
      }
    });
  }

  refresh(event?: CustomEvent): void {
    this.refreshList(event);
  }

  refreshList(event?: CustomEvent): void {
    if (this.isBusy) {
      return;
    }

    this.isInitialLoading = this.items.length === 0;
    this.loadError = false;
    this.currentPageIndex = 1;
    this.items = [];
    this.enableInfiniteScroll();
    this.getItems(event);
  }

  openDetail(item: Notice): void {
    item.IsRead = true;
    this.navCtrl.navigateForward(`/member/notice-detail/${item.NoticeId}`);
  }

  trackByNoticeId(_index: number, item: Notice): number {
    return item.NoticeId;
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
    if (!this.infiniteScroll) {
      return;
    }
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
