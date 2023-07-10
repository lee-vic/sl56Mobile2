import { NavController, LoadingController } from '@ionic/angular';
import { Component, OnInit } from '@angular/core';
import { CookieService } from "ngx-cookie-service";
import { WeightBill } from 'src/app/interfaces/weight-bill';
import { WeightBillService } from 'src/app/providers/weight-bill.service';
import { NavigationOptions } from '@ionic/angular/dist/providers/nav-controller';

@Component({
  selector: "app-pay-weighing-fee",
  templateUrl: "./pay-weighing-fee.page.html",
  styleUrls: ["./pay-weighing-fee.page.scss"],
})
export class PayWeighingFeePage implements OnInit {
  openId: string;
  weights: Array<WeightBill> = [];
  showMsg = "正在加载数据，请稍后...";
  constructor(
    private cookieService: CookieService,
    private weightBillService: WeightBillService,
    private navController: NavController,
    private loadingCtrl: LoadingController
  ) {}

  ngOnInit(): void {
    this.openId = this.cookieService.get("OpenId");
    console.log("OpenId：", this.openId);
    this.loadingCtrl
      .create({
        message: "请稍后",
      })
      .then((lc) => {
        lc.present();
        this.weightBillService.getList(this.openId).subscribe((p) => {
          this.weights = p;
          //测试数据
          // for (let i = 0; i < 10; i++) {
          //   let t: WeightBill = {
          //     ObjectId: 1,
          //     GrossWeight: 10.5,
          //     NetWeight: 11,
          //     TareWeight: 1,
          //     VehicleNo: "粤A123",
          //     UnitOfWeight: "KG",
          //     Amount: 100,
          //     WxOpenId: "1111111",
          //     TradeType: "JSAPI",
          //     BillPath: "",
          //   };
          //   this.weights.push(t);
          // }
          lc.dismiss();
          console.log(this.weights);
          if (this.weights.length == 0) {
            this.showMsg = "地磅数据读取失败，请尝试刷新页面！";
          }
        });
      });
  }

  detail(objectId) {
    let options: NavigationOptions = {
      queryParams: {
        ObjectId: objectId,
        OpenId: this.openId,
      },
    };
    this.navController.navigateForward(
      "/member/pay-weighing-fee/detail",
      options
    );
  }
  refresh() {
    this.ngOnInit();
  }
}
