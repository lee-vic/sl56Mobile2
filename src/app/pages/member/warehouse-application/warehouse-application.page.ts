import { Component } from '@angular/core';
import { NavController, LoadingController, ToastController, AlertController } from '@ionic/angular';
import { WarehouseApplicationService } from '../../../providers/warehouse-application.service';
import { WarehouseApplication } from '../../../interfaces/warehouse-application';
declare var WeixinJSBridge: any;
@Component({
  selector: 'app-warehouse-application',
  templateUrl: './warehouse-application.page.html',
  styleUrls: ['./warehouse-application.page.scss'],
})
export class WarehouseApplicationPage {
  currentPage = 1;
  applications: WarehouseApplication[] = [];
  hasMore = true;
  tradeType = "JSAPI";

  constructor(
    private navCtrl: NavController,
    private warehouseService: WarehouseApplicationService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) { }

  ionViewDidEnter() {
    this.loadApplications();
  }

  async loadApplications() {
    if(!this.hasMore) return;
    const loading = await this.loadingCtrl.create({
      message: '正在加载...'
    });
    await loading.present();

    this.warehouseService.getList(this.currentPage).subscribe(res => {
      loading.dismiss();
      if (res.Success) {
        this.hasMore = res.Data && res.Data.length === 20;
        if (this.currentPage === 1 && res.Data) {
          this.applications = res.Data;
        } else {
          this.applications = this.applications.concat(res.Data);
        }
      } else {
        this.toastCtrl.create({
          message: res.ErrMsg,
          duration: 3000,
          position: 'middle'
        }).then(toast => toast.present());
      }
    }, (err) => {
      loading.dismiss();
      this.toastCtrl.create({
        message: '加载失败，请重试',
        duration: 3000,
        position: 'middle'
      });
    });
  }

  loadMore(event: any) {
    this.currentPage++;
    this.loadApplications();
    event.target.complete();
  }

  add() {
    //为了从明细页面返回后，能够重新刷新列表，所以把pageindex改为1
    this.currentPage = 1;
    this.navCtrl.navigateForward('/member/warehouse-application-detail/0');
  }

  goToDetail(id: number) {
    this.navCtrl.navigateForward(`/member/warehouse-application-detail/${id}`);
  }
  IsMicroMessenger(): boolean {
    let ua = navigator.userAgent.toLowerCase();
    let m = ua.match(/MicroMessenger/i);
    if (m != null && m.toString() == "micromessenger") {
      return true;
    }
    return false;
  }
  async pay(app: WarehouseApplication) {
    //不是微信浏览器，提示不支持
    if (!this.IsMicroMessenger()) {
      this.alertCtrl.create({
        header: '提示',
        subHeader: "暂不支持此支付方式",
        message: "请使用我司公众号或者电脑版本网站进行支付",
        buttons: [{
          text: "确定",
        }]
      }).then(p => p.present());
      return;
    }
    const loading = await this.loadingCtrl.create({
      message: '正在处理...'
    });
    await loading.present();
    let postData = {
      Id: app.Id,
      TradeType: this.tradeType
    }
    this.warehouseService.pay(postData).subscribe(
      res => {
        loading.dismiss();
        if (res.Success) {
          let jsApiParam = JSON.parse(res.Data);
          this.callpay(jsApiParam);
        } else {
          this.toastCtrl.create({
            message: res.ErrMsg,
            duration: 3000,
            position: 'middle'
          }).then(toast => toast.present());
        }
      },
      err => {
        loading.dismiss();
        this.toastCtrl.create({
          message: '支付失败，请重试',
          duration: 3000,
          position: 'middle'
        }).then(toast => toast.present());
      }
    );
  }
  callpay(jsApiParam) {
    if (typeof WeixinJSBridge != "undefined") {
      this.jsApiCall(jsApiParam);
    }
  }
  jsApiCall(jsApiParam) {
    WeixinJSBridge.invoke(
      'getBrandWCPayRequest',
      jsApiParam,//josn串
      (res) => {
        if (res.err_msg == "get_brand_wcpay_request:ok") {
          this.toastCtrl.create({
            message: "支付成功",
            position: 'middle',
            duration: 1000
          }).then(p => p.present());
          this.currentPage = 1;
          this.loadApplications();
        }
        else {
          alert(res.err_code + res.err_desc + res.err_msg);
        }
      });
  }
}
