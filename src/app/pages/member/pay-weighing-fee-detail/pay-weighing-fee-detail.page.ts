import { WeightBillService } from './../../../providers/weight-bill.service';
import { LoadingController, ToastController, NavController, AlertController } from '@ionic/angular';
import { WeightBill } from 'src/app/interfaces/weight-bill';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { apiUrl } from "src/app/global";
import { SignalR, SignalRConnection } from 'ng2-signalr';
import { Subscription } from 'rxjs';
import { NavigationOptions } from '@ionic/angular/dist/providers/nav-controller';

declare var WeixinJSBridge: any;
declare var wx: any;
@Component({
  selector: "app-pay-weighing-fee-detail",
  templateUrl: "./pay-weighing-fee-detail.page.html",
  styleUrls: ["./pay-weighing-fee-detail.page.scss"],
})
export class PayWeighingFeeDetailPage implements OnInit {
  weightBill: WeightBill = new WeightBill();
  signalRConnection: SignalRConnection;
  objectId;
  subscriber: Subscription;
  signalRConnected: boolean = false;
  isMiniProgram: boolean = false;//是否在小程序内运行
  constructor(
    private route: ActivatedRoute,
    private loadingCtrl: LoadingController,
    private weightBillService: WeightBillService,
    private toastCtrl: ToastController,
    private navCtrl: NavController,
    private alertController: AlertController,
    private signalR: SignalR
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
  }
  ionViewDidEnter() {
    this.loadData();
    this.signalRConnection.start().then((c) => {
      this.signalRConnected = true;
      //监听支付成功事件
      let listener = c.listenFor("messageReceived");
      if (this.subscriber != undefined) {
        this.subscriber.unsubscribe();
      }
      this.subscriber = listener.subscribe((msg: any) => {
        let obj = JSON.parse(msg);
        if (obj.MsgContent == "True") {
          this.loadingCtrl.dismiss();
          this.alertController.create({
            header: '称重已完成',
            subHeader: "点击确定后,系统将显示电子磅单",
            backdropDismiss: false,
            keyboardClose: false,
            buttons: [
              {
                text: '确定',
                handler: () => {
                  let options: NavigationOptions = {
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
  ionViewWillLeave() {
    this.signalRConnection.stop();
    this.signalRConnected = false;
  }
  loadData() {
    this.loadingCtrl.create({
      message: "请稍后",
    })
      .then((p) => {
        p.present();
        this.weightBillService.getWeightBill(this.objectId).subscribe((res) => {
          this.weightBill = res;
          p.dismiss();
        }, (err) => {
          this.loadingCtrl.dismiss();
          this.toastCtrl.create({
            message: "获取数据出现错误",
            position: "middle",
            duration: 2000,
          }).then((p) => p.present());
          this.navCtrl.back();
        });
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
          //   message: '正在检查支付结果,请稍后...'
          // }).then(p => p.present());
        } else {
          alert(res.err_code + res.err_desc + res.err_msg);
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
    this.loadingCtrl
      .create({
        message: "请稍后...",
      })
      .then((p) => {
        p.present();
        this.weightBillService.payWeighingFee(this.weightBill).subscribe(
          (res) => {
            this.loadingCtrl.dismiss();
            if (res.Success) {
              let jsApiParam = JSON.parse(res.Data);
              this.callpay(jsApiParam);
            } else {
              this.toastCtrl
                .create({
                  message: res.ErrMsg,
                  position: "middle",
                  duration: 3000,
                })
                .then((p) => p.present());
            }
          },
          (err) => {
            this.loadingCtrl.dismiss();
            this.toastCtrl
              .create({
                message: err.message,
                position: "middle",
                duration: 3000,
              })
              .then((p) => p.present());
          }
        );
      });
  }

  ngOnDestroy(): void {
    this.signalRConnection.stop();
  }
}
