import { WeightBillService } from './../../../providers/weight-bill.service';
import { LoadingController, ToastController, NavController } from '@ionic/angular';
import { WeightBill } from 'src/app/interfaces/weight-bill';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { apiUrl } from "src/app/global";
declare var WeixinJSBridge: any;
@Component({
  selector: "app-pay-weighing-fee-detail",
  templateUrl: "./pay-weighing-fee-detail.page.html",
  styleUrls: ["./pay-weighing-fee-detail.page.scss"],
})
export class PayWeighingFeeDetailPage implements OnInit {
  weightBill: WeightBill = new WeightBill();
  openId: string;
  objectId;
  downloadLink;
  constructor(
    private route: ActivatedRoute,
    private loadingCtrl: LoadingController,
    private weightBillService: WeightBillService,
    private toastCtrl: ToastController,
    private navCtrl: NavController
  ) {
    this.objectId = route.snapshot.queryParams["ObjectId"];
    this.openId = route.snapshot.queryParams["OpenId"];
    console.log("WeightBill:", this.weightBill);
  }

  ngOnInit(): void {
    this.loadingCtrl
      .create({
        message: "请稍后",
      })
      .then((p) => {
        p.present();
        this.weightBillService.getWeightBill(this.objectId).subscribe((res) => {
          this.weightBill = res;
          if (this.weightBill.Status == 0) {
            this.weightBill.WxOpenId = this.openId;
            this.weightBill.TareWeight = 0;
            this.weightBill.NetWeight = this.weightBill.GrossWeight;
          } else if (this.weightBill.Status == 2) {
            this.downloadLink = apiUrl + "/Measure/GetWeightBillFile?objectId=" + this.weightBill.ObjectId;
          }
          p.dismiss();
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
          this.toastCtrl
            .create({
              message: "支付成功",
              position: "middle",
              duration: 1000,
            })
            .then((p) => p.present());
          this.navCtrl.navigateForward(
            "/member/pay-weighing-fee/result/" + this.weightBill.ObjectId,
            {
              replaceUrl: true,
            }
          );
        } else {
          alert(res.err_code + res.err_desc + res.err_msg);
        }
      }
    );
  }
  payAndPrint() {
    if (
      this.weightBill.VehicleNo == null ||
      this.weightBill.VehicleNo.length == 0
    ) {
      alert("请输入车牌号码");
      // this.toastCtrl.create({
      //   message: "请输入车牌号码！",
      //   position: "middle",
      //   duration:3000
      // }).then(p => p.present());
      return;
    }
    this.payByJsApi();
  }
  payByJsApi() {
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
  inputTareWeight(event) {
    this.weightBill.TareWeight = parseFloat(
      this.weightBill.TareWeight.toString()
    );
    if (Number.isNaN(this.weightBill.TareWeight))
      this.weightBill.TareWeight = 0;
    this.weightBill.NetWeight =
      this.weightBill.GrossWeight - this.weightBill.TareWeight;
    console.log(this.weightBill);
  }
}
