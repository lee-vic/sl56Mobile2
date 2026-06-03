import { Component, OnInit } from '@angular/core';
import { AlertController, NavController } from '@ionic/angular';
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
    private alertController: AlertController) { 
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
        this.showMsg = "加载失败，请重试";
      }
    });
  }
  detail(objectId) {
    this.navController.navigateForward(
      "/member/pay-weighing-fee/result/" + objectId
    );
  }
  print(objectId) {
    this.weightBillService.printWeightBill(objectId).subscribe((p) => {
          if (p.Success==true) {
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
          else{
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
  }
}
