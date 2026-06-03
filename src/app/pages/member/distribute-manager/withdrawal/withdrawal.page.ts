import { Component, OnInit } from '@angular/core';
import { NavController, ToastController } from '@ionic/angular';
import { DistributeService } from 'src/app/providers/distribute.service';

@Component({
  selector: 'app-withdrawal',
  templateUrl: './withdrawal.page.html',
  styleUrls: ['./withdrawal.page.scss']
})
export class WithdrawalPage implements OnInit {

  constructor(private navCtrl: NavController, private distributeService: DistributeService, private toastCtrl: ToastController) { }

  amounts: any;
  isLoading = true;

  ngOnInit(): void {
    this.isLoading = true;
    this.distributeService.getDistributionAmountWithdrawal().subscribe(res => {
      this.amounts = res;
      this.isLoading = false;
    });
  }

  toUserInfo() {
    this.navCtrl.navigateForward("/member/distribute-user-info");
  }

  doWithdrawal() {
    this.distributeService.getUserInfo().subscribe(res => {
      if (res.BankCarNumber == null || res.BankCarNumber.length == 0) {
        this.toastCtrl.create({
          message: "提现资料不完整，请先填写资料",
          position: "middle",
          duration: 3000
        }).then(p => p.present().then(() => {
          this.toUserInfo();
        }));
      } else {
        if (this.amounts.MostWithdrawalAmount>0) {
          this.distributeService.doWithdrawal(this.amounts.MostWithdrawalAmount).subscribe(res => {
            if (res.length == 0) {
              this.toastCtrl.create({
                message: "提现申请成功",
                duration: 3000,
                position: "middle"
              }).then(p => p.present());
              this.toRecords();
            } else {
              this.toastCtrl.create({
                message: "操作失败：" + res,
                duration: 3000,
                position: "middle"
              }).then(p => p.present());
            }
          });
        }else{
          this.toastCtrl.create({
            message: "可提现余额不足",
            position: "middle",
            duration: 3000
          }).then(p=>p.present());
        }
      }
    });
  }

  toRecords() {
    this.navCtrl.navigateForward("/member/distribute-withdrawal-records");
  }

}
