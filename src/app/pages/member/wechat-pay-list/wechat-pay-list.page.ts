import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { WechatPay } from 'src/app/interfaces/wechat-pay';
import { WechatPayListService } from 'src/app/providers/wechat-pay-list.service';
import { IonInfiniteScroll } from '@ionic/angular';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';


@Component({
  selector: 'app-wechat-pay-list',
  templateUrl: './wechat-pay-list.page.html',
  styleUrls: ['./wechat-pay-list.page.scss'],
})
export class WechatPayListPage implements OnInit, OnDestroy {
  items: Array<WechatPay>=[];
  isBusy:boolean=false;
  isLoading: boolean = false;
  hasError: boolean = false;
  errorMessage: string = '';
  currentPageIndex: number = 1;
  private readonly destroy$ = new Subject<void>();
  @ViewChild(IonInfiniteScroll,{static:true}) infiniteScroll: IonInfiniteScroll;
  constructor(
    public service: WechatPayListService,
    ) {}
  ngOnInit(): void {
    this.getItems();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getItems(event?: any) {
    if (this.isBusy == true)
      return;

    this.hasError = false;
    this.errorMessage = '';
    this.isBusy = true;
    if (this.currentPageIndex === 1) this.isLoading = true;
    this.service.getList(this.currentPageIndex).pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.isBusy = false;
        this.isLoading = false;
        this.completeEvent(event);
      })
    ).subscribe({
      next: (res) => {
      for (let i = 0; i < res.length; i++) {
        this.items.push(res[i]);
      }

      if (this.infiniteScroll) {
        this.infiniteScroll.disabled = !res || res.length === 0;
      }

      this.currentPageIndex++;
      },
      error: (err) => {
        this.hasError = true;
        this.errorMessage = err?.statusText || err?.message || '';
      }
    });
  }

  doRefresh(event: any): void {
    this.items = [];
    this.currentPageIndex = 1;
    this.hasError = false;
    this.errorMessage = '';
    if (this.infiniteScroll) {
      this.infiniteScroll.disabled = false;
    }

    this.getItems(event);
  }

  retry(): void {
    this.items = [];
    this.currentPageIndex = 1;
    this.hasError = false;
    this.errorMessage = '';
    if (this.infiniteScroll) {
      this.infiniteScroll.disabled = false;
    }
    this.getItems();
  }

  getStatusColor(status: string): string {
    if (!status) return 'medium';
    if (status.includes('成功') || status.includes('完成')) return 'success';
    if (status.includes('失败') || status.includes('拒绝') || status.includes('取消')) return 'danger';
    if (status.includes('待') || status.includes('处理') || status.includes('中')) return 'warning';
    return 'primary';
  }

  private completeEvent(event?: any): void {
    if (event?.target && typeof event.target.complete === 'function') {
      event.target.complete();
      return;
    }
    if (this.infiniteScroll) {
      this.infiniteScroll.complete();
    }
  }

}
