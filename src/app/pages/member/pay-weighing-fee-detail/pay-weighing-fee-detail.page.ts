import { WeightBillService } from './../../../providers/weight-bill.service';
import { ToastController, NavController, AlertController, LoadingController } from '@ionic/angular';
import { WeightBill } from 'src/app/interfaces/weight-bill';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { apiUrl } from "src/app/global";
import { SignalR, SignalRConnection } from 'src/app/providers/signal-r.service';
import { Subscription } from 'rxjs';

declare var WeixinJSBridge: any;
declare var wx: any;
@Component({
  selector: "app-pay-weighing-fee-detail",
  templateUrl: "./pay-weighing-fee-detail.page.html",
  styleUrls: ["./pay-weighing-fee-detail.page.scss"],
})
export class PayWeighingFeeDetailPage implements OnInit, OnDestroy {
  weightBill: WeightBill = new WeightBill();
  signalRConnection: SignalRConnection;
  objectId;
  subscriber: Subscription;
  signalRConnected: boolean = false;
  isMiniProgram: boolean = false;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private weightBillService: WeightBillService,
    private toastCtrl: ToastController,
    private navCtrl: NavController,
    private alertController: AlertController,
    private signalR: SignalR,
    private loadingCtrl: LoadingController
  ) {
    this.objectId = this.route.snapshot.paramMap.get("id");
  }

  ngOnInit(): void {
    this.weightBill.IsMonthly = false;
    this.signalRConnection = this.signalR.createConnection();
    this.signalRConnection.status.subscribe((p) => console.log(p.name));
    if (window.navigator.userAgent.indexOf("miniProgram") != -1) {
      this.isMiniProgram = true;
    }
    this.loadData();
    this.startSignalRConnection();
  }

  private startSignalRConnection() {
    this.signalRConnection.start().then((c) => {
      this.signalRConnected = true;
      //监听支付成功事件
      let listener = c.listenFor("messageReceived");
      if (this.subscriber != undefined) {
        this.subscriber.unsubscribe();
      }
      this.subscriber = listener.subscribe((msg: any) => {
        const obj = this.parseSignalRMessage(msg);
        if (!obj) return;
        if (obj.MsgContent == "True") {
          this.alertController.create({
            header: '称重已完成',
            subHeader: "支付结果已确认",
            message: "电子磅单已生成，点击确定后查看本次过磅结果。",
            backdropDismiss: false,
            keyboardClose: false,
            buttons: [
              {
                text: '确定',
                handler: () => {
                  const options = {
                    queryParams: {
                      ObjectId: this.objectId,
                      IsAskPrint: true
                    },
                  };
                  this.navCtrl.navigateForward(
                    "/member/pay-weighing-fee/result/" + this.objectId, options
                  );
                }
              }
            ]
          }).then(p => p.present());
        }
      });
    });
  }

  private parseSignalRMessage(msg: any): any | null {
    if (msg == undefined || msg == null) return null;

    if (typeof msg === 'string') {
      try {
        const parsed = JSON.parse(msg);
        return parsed && typeof parsed === 'object' ? parsed : null;
      } catch {
        return null;
      }
    }

    return typeof msg === 'object' ? msg : null;
  }

  loadData() {
    this.isLoading = true;
    this.weightBillService.getWeightBill(this.objectId).subscribe({
      next: (res) => {
        this.weightBill = res;
        this.isLoading = false;
      },
      error: (_err) => {
        this.isLoading = false;
        this.toastCtrl.create({
          message: "没有获取到支付信息，请返回后重试。",
          position: "middle",
          duration: 2000,
        }).then((p) => p.present());
        this.navCtrl.back();
      }
    });
  }

  callpay(jsApiParam) {
    if (typeof WeixinJSBridge == "undefined") {
      if (document.addEventListener) {
        document.addEventListener("WeixinJSBridgeReady", this.jsApiCall, false);
      }
    } else {
      this.jsApiCall(jsApiParam);
    }
  }
  jsApiCall(jsApiParam) {
    WeixinJSBridge.invoke(
      "getBrandWCPayRequest",
      jsApiParam, //josn串
      (res) => {
        if (res.err_msg == "get_brand_wcpay_request:ok") {
          // this.loadingCtrl.create({
          //   message: '正在确认支付结果...'
          // }).then(p => p.present());
        } else {
          alert("支付没有完成，请重新点击“支付费用”再试一次。");
        }
      }
    );
  }

  payByJsApi() {
    //小程序端跳转到小程序内的支付页面
    if (this.isMiniProgram) {
      this.weightBill.TradeType = "MAPP1";
      wx.miniProgram.navigateTo({
        url: "/pages/index/pay?params=" + JSON.stringify(this.weightBill),
      });
      return;
    }
    this.weightBill.TradeType = "JSAPI";
    this.loadingCtrl.create({ message: '正在打开支付页面...' }).then((loading) => {
      loading.present();
      this.weightBillService.payWeighingFee(this.weightBill).subscribe({
        next: (res) => {
          loading.dismiss();
          if (res.Success) {
            let jsApiParam = JSON.parse(res.Data);
            this.callpay(jsApiParam);
          } else {
            this.toastCtrl
              .create({
                message: res.ErrMsg || "支付页面没有打开，请重新点击“支付费用”再试一次。",
                position: "middle",
                duration: 3000,
              })
              .then((p) => p.present());
          }
        },
        error: (err) => {
          loading.dismiss();
          this.toastCtrl
            .create({
              message: err?.message || "网络异常，支付页面暂时打不开，请检查网络后再试。",
              position: "middle",
              duration: 3000,
            })
            .then((p) => p.present());
        }
      });
    });
  }

  ngOnDestroy(): void {
    if (this.signalRConnection) {
      this.signalRConnection.stop();
    }
  }
}
