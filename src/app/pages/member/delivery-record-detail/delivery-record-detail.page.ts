import { Component, OnInit } from '@angular/core';
import { DeliveryRecordDetailService } from 'src/app/providers/delivery-record-detail.service';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { NavController, ActionSheetController, AlertController, ToastController } from '@ionic/angular';
import { ProblemService } from 'src/app/providers/problem.service';
@Component({
  selector: 'app-delivery-record-detail',
  templateUrl: './delivery-record-detail.page.html',
  styleUrls: ['./delivery-record-detail.page.scss'],
})
export class DeliveryRecordDetailPage implements OnInit {
  data: any;
  id: any;
  tab = "1";
  isReturn = true;
  canGoBack: boolean = true;
  constructor(public navCtrl: NavController,
    private router: Router,
    public service: DeliveryRecordDetailService,
    public problemService: ProblemService,
    public alertCtrl: AlertController,
    public toastCtrl: ToastController,
    public actionSheetController: ActionSheetController,
    private route: ActivatedRoute) {
    //公众号
    this.route.queryParams.subscribe(p => {
      if (p && p.push) {
        if (p.push == "true") {
          this.canGoBack = false;
        }
      }
    });
  }

  ngOnInit() {
    this.id = +this.route.snapshot.paramMap.get('id');

    //不能返回的视为站外链接
    this.service.getDetail(!this.canGoBack, this.id).subscribe(res => {
      this.data = res;
      this.isReturn = this.data.IsReturnCustomer;
      console.log(this.data);
    }, (err) => {

      //  let toast = this.toastCtrl.create({
      //    message: err.message,
      //    position: 'middle',
      //    duration: 2000
      //  });
      //  toast.present();
    });
  }
  applyReturn() {
    this.navCtrl.navigateForward("/member/return-apply", { queryParams: { type: 0,ids:this.data.ObjectId } })
  }
  chat() {
    let extras: NavigationExtras = {
      state: {
        receiveGoodsDetailId: this.data.ObjectId,
        messages: this.data.ChatRecords,
      }
    }
    this.router.navigate(["/member/chat/1"], extras)
    
  }
  more(){
    this.presentActionSheet();
  }
  async presentActionSheet() {
    const actionSheet = await this.actionSheetController.create({
      header: '请选择',
      buttons: [{
        text: '我要退货',
        handler: () => {
          this.navCtrl.navigateForward("/member/return-apply", { queryParams: { type: 0 ,ids:this.data.ObjectId} })
        }
      }, {
        text: '我要暂扣',
        handler: () => {
          this.alertCtrl.create({
            header: '确定要暂扣吗',
            message: '货物暂扣后，将暂停所有操作流程，由于此操作造成的时效问题，一律由客户自身承担',
            buttons: [
              {
                text: '取消',
                handler: () => {
                  console.log('Disagree clicked');
                }
              },
              {
                text: '确定',
                handler: () => {
                  this.problemService.addProblem(this.id).subscribe(res => {
                    if (res.Success == false) {
                      this.toastCtrl.create({
                        message: res.Message,
                        position: 'middle',
                        duration: 2000
                      }).then(p => p.present());
                    }
                    else {
                      this.toastCtrl.create({
                        message: "已成功扣件",
                        position: 'middle',
                        duration: 2000
                      }).then(p => p.present());
                    }
                  });
                }
              }
            ]
          }).then(p => p.present());
        }
      }, {
        text: '取消',
        role: 'cancel',
        handler: () => {
          console.log('Cancel clicked');
        }
      }]
    });
    await actionSheet.present();
  }
}
