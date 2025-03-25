import { WeightBillService } from 'src/app/providers/weight-bill.service';
import { ActivatedRoute } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { apiUrl } from 'src/app/global';
import { AlertController, LoadingController } from '@ionic/angular';

@Component({
  selector: "app-pay-weighing-fee-result",
  templateUrl: "./pay-weighing-fee-result.page.html",
  styleUrls: ["./pay-weighing-fee-result.page.scss"],
})
export class PayWeighingFeeResultPage implements OnInit {
  id;
  imageUrl: string;
  isAskPrint: any;
  timerHandle: any;
  constructor(private route: ActivatedRoute,
    private alertController: AlertController,
    private loadingCtrl: LoadingController,
    private service: WeightBillService) {
    this.id = this.route.snapshot.paramMap.get("id");
    this.route.queryParams.subscribe(p => {
      this.isAskPrint = p["IsAskPrint"];
    });

  }

  ngOnInit(): void {
    this.imageUrl = apiUrl + "/Measure/GetWeightBillFile?objectId=" + this.id;
    if (this.isAskPrint == true) {
      this.alertController.create({
        header: '是否打印纸质磅单？',
        message: "10秒内未选择，系统将默认<strong>打印</strong>",
        backdropDismiss: false,
        keyboardClose: false,
        buttons: [
          {
            text: '打印',
            handler: () => {
              clearTimeout(this.timerHandle);
              this.print();
            }
          },
          {
            text: '不打印',
            role: 'cancel',
            handler: () => {
              clearTimeout(this.timerHandle);
            }
          }
        ]
      }).then(p => p.present());
      this.timerHandle = setTimeout(()=> {
        this.alertController.dismiss();
        this.print();
      }, 10 * 1000);
    }
  }
  print() {
    this.loadingCtrl.create({
      message: "正在打印纸质磅单",
    })
      .then((lc) => {
        lc.present();
        this.service.printWeightBill(this.id).subscribe((p) => {
          lc.dismiss();
          if (p.Success == true) {
            this.alertController.create({
              header: '打印成功',
              message: "请到门卫室领取磅单",
              backdropDismiss: false,
              keyboardClose: false,
              buttons: [
                {
                  text: '确定',
                  role: 'cancel'
                }
              ]
            }).then(p => p.present());
          }
          else {
            this.alertController.create({
              header: '打印失败',
              message: p.ErrorMessage,
              backdropDismiss: false,
              keyboardClose: false,
              buttons: [
                {
                  text: '确定',
                  role: 'cancel'
                }
              ]
            }).then(p => p.present());
          }
        });
      });
  }
}
