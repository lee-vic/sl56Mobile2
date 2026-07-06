import { Component, OnInit } from '@angular/core';
import { AlertController, LoadingController, NavController } from '@ionic/angular';
import { CookieService } from 'ngx-cookie-service';
import { WeightBill } from 'src/app/interfaces/weight-bill';
import { WeightBillService } from 'src/app/providers/weight-bill.service';

@Component({
  selector: 'app-weight-bill-list',
  templateUrl: './weight-bill-list.page.html',
  styleUrls: ['./weight-bill-list.page.scss'],
})
export class WeightBillListPage implements OnInit {
  openId: string;
  weights: Array<WeightBill> = [];
  showMsg = "";
  isLoading = true;
  hasLoadError = false;



  constructor(private weightBillService: WeightBillService,
    private cookieService: CookieService,
    private navController: NavController,
    private alertController: AlertController,
    private loadingCtrl: LoadingController) { 
      this.openId= this.cookieService.get("OpenId");
    }

  ngOnInit() {
    this.loadList();
  }
  loadList() {
    this.isLoading = true;
    this.hasLoadError = false;
    this.weightBillService.getList(this.openId).subscribe({
      next: (p) => {
        this.weights = p;
        this.isLoading = false;
        if (this.weights.length == 0) {
          this.showMsg = "暂无称重记录";
        }
      },
      error: () => {
        this.isLoading = false;
        this.hasLoadError = true;
        this.showMsg = "称重记录没有加载出来，请点“重试”再试一次";
      }
    });
  }
  detail(objectId) {
    this.navController.navigateForward(
      "/member/pay-weighing-fee/result/" + objectId
    );
  }
  print(objectId) {
    this.loadingCtrl.create({ message: '正在发送打印请求...' }).then((loading) => {
      loading.present();
      this.weightBillService.printWeightBill(objectId).subscribe({
        next: (p) => {
          loading.dismiss();
          if (p.Success==true) {
            this.alertController.create({
              header: '已发送打印',
              message: "纸质磅单已发送至打印机，请到门卫室领取。",
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
          else{
            this.alertController.create({
              header: '没有打印成功',
              message: p.ErrorMessage ? "打印机提示：" + p.ErrorMessage + "。请稍后再试一次。" : "打印请求没有发送成功，请重新点击“打印磅单”再试一次。",
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
        },
        error: () => {
          loading.dismiss();
          this.alertController.create({
            header: '没有打印成功',
            message: '网络异常，打印请求暂时没有发送成功，请检查网络后再试。',
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
