import { Component, OnInit, ViewChild } from '@angular/core';
import { AlertController, IonInfiniteScroll, LoadingController, NavController } from '@ionic/angular';
import { finalize } from 'rxjs/operators';
import { UiFeedbackService } from 'src/app/providers/ui-feedback.service';
import { WarehouseApplicationService } from '../../../providers/warehouse-application.service';
import { WarehouseApplication } from '../../../interfaces/warehouse-application';

interface WeixinPayBridgeResult {
  err_msg: string;
  err_code?: string;
  err_desc?: string;
}

interface WeixinPayBridge {
  invoke(apiName: string, parameters: unknown, callback: (res: WeixinPayBridgeResult) => void): void;
}

declare const WeixinJSBridge: WeixinPayBridge | undefined;

interface WarehouseStatusMeta {
  label: string;
  color: string;
}

@Component({
  selector: 'app-warehouse-application',
  templateUrl: './warehouse-application.page.html',
  styleUrls: ['./warehouse-application.page.scss'],
})
export class WarehouseApplicationPage implements OnInit {
  private readonly pageSize = 20;

  @ViewChild(IonInfiniteScroll, { static: true }) infiniteScroll: IonInfiniteScroll;

  currentPage = 1;
  applications: WarehouseApplication[] = [];
  hasMore = true;
  tradeType = 'JSAPI';
  isLoading = false;
  isInitialLoading = false;
  isLoaded = false;
  isBusy = false;
  loadError = false;

  constructor(
    private navCtrl: NavController,
    private warehouseService: WarehouseApplicationService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private readonly uiFeedbackService: UiFeedbackService
  ) { }

  ngOnInit(): void {
    this.refreshList();
  }

  loadApplications(event?: CustomEvent): void {
    if (this.isBusy || (!this.hasMore && this.currentPage > 1)) {
      this.completeEvent(event);
      return;
    }
    this.isBusy = true;
    this.isLoading = true;
    this.loadError = false;

    this.warehouseService.getList(this.currentPage).pipe(
      finalize(() => {
        this.isBusy = false;
        this.isLoading = false;
        this.isInitialLoading = false;
        this.isLoaded = true;
        this.completeEvent(event);
      })
    ).subscribe({
      next: (res) => {
        if (res.Success) {
          const data = res.Data || [];
          this.hasMore = data.length === this.pageSize;
          if (this.currentPage === 1) {
            this.applications = data;
          } else {
            this.applications = this.applications.concat(data);
          }
          if (!this.hasMore) {
            this.disableInfiniteScroll();
          }
        } else {
          this.loadError = true;
          this.uiFeedbackService.presentToast(res.ErrMsg || '入仓申请加载失败，请稍后重试', 2200, 'middle', undefined, 'danger');
        }
      },
      error: () => {
        this.loadError = true;
        this.uiFeedbackService.presentToast('入仓申请加载失败，请稍后重试', 2200, 'middle', undefined, 'danger');
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
    this.currentPage = 1;
    this.hasMore = true;
    this.loadError = false;
    this.applications = [];
    this.isInitialLoading = true;
    this.enableInfiniteScroll();
    this.loadApplications(event);
  }

  loadMore(event: CustomEvent): void {
    this.currentPage++;
    this.loadApplications(event);
  }

  add(): void {
    //为了从明细页面返回后，能够重新刷新列表，所以把pageindex改为1
    this.currentPage = 1;
    this.navCtrl.navigateForward('/member/warehouse-application-detail/0');
  }

  goToDetail(id: number): void {
    this.navCtrl.navigateForward(`/member/warehouse-application-detail/${id}`);
  }
  IsMicroMessenger(): boolean {
    const ua = navigator.userAgent.toLowerCase();
    const m = ua.match(/MicroMessenger/i);
    return m !== null && m.toString() === 'micromessenger';
  }

  getStatusMeta(status: number): WarehouseStatusMeta {
    if (status === 0) {
      return { label: '待支付', color: 'primary' };
    }
    if (status === 1) {
      return { label: '已收款', color: 'success' };
    }
    if (status === 2) {
      return { label: '已入仓', color: 'success' };
    }
    return { label: '已取消', color: 'medium' };
  }

  trackByApplicationId(_index: number, item: WarehouseApplication): number {
    return item.Id;
  }

  async pay(app: WarehouseApplication): Promise<void> {
    //不是微信浏览器，提示不支持
    if (!this.IsMicroMessenger()) {
      this.alertCtrl.create({
        header: '提示',
        subHeader: '暂不支持此支付方式',
        message: '请使用我司公众号或者电脑版本网站进行支付',
        buttons: [{
          text: '确定',
        }]
      }).then(p => p.present());
      return;
    }
    const postData = {
      Id: app.Id,
      TradeType: this.tradeType
    };
    const loading = await this.loadingCtrl.create({ message: '请稍候...' });
    await loading.present();
    this.warehouseService.pay(postData).subscribe({
      next: (res) => {
        loading.dismiss();
        if (res.Success) {
          const jsApiParam = JSON.parse(res.Data || '{}') as unknown;
          this.callpay(jsApiParam);
        } else {
          this.uiFeedbackService.presentToast(res.ErrMsg || '支付失败，请重试', 2200, 'middle', undefined, 'danger');
        }
      },
      error: () => {
        loading.dismiss();
        this.uiFeedbackService.presentToast('支付失败，请重试', 2200, 'middle', undefined, 'danger');
      }
    });
  }

  callpay(jsApiParam: unknown): void {
    const bridge = typeof WeixinJSBridge !== 'undefined' ? WeixinJSBridge : undefined;
    if (bridge) {
      this.jsApiCall(bridge, jsApiParam);
    }
  }

  jsApiCall(bridge: WeixinPayBridge, jsApiParam: unknown): void {
    bridge.invoke(
      'getBrandWCPayRequest',
      jsApiParam,//josn串
      res => {
        if (res.err_msg === 'get_brand_wcpay_request:ok') {
          this.uiFeedbackService.presentToast('支付成功', 1200, 'middle', undefined, 'success');
          this.currentPage = 1;
          this.refreshList();
        } else {
          alert(`${res.err_code || ''}${res.err_desc || ''}${res.err_msg}`);
        }
      });
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
