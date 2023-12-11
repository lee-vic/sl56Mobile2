import { Component, OnInit } from '@angular/core';
import { LoadingController, NavController } from '@ionic/angular';
import { NavigationOptions } from '@ionic/angular/dist/providers/nav-controller';
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




  constructor(private weightBillService: WeightBillService,
    private cookieService: CookieService,
    private navController: NavController,
    private loadingCtrl: LoadingController) { 
      this.openId= this.cookieService.get("OpenId");
    }

  ngOnInit() {
    this.loadList();
  }
  loadList() {
    this.loadingCtrl.create({
      message: "请稍后",
    })
      .then((lc) => {
        lc.present();
        this.weightBillService.getList(this.openId).subscribe((p) => {
          this.weights = p;
          lc.dismiss();
          if (this.weights.length == 0) {
            this.showMsg = "暂无称重记录";
          }
        });
      });
  }
  detail(objectId) {
    this.navController.navigateForward(
      "/member/pay-weighing-fee/result/" + objectId
    );
  }
}
