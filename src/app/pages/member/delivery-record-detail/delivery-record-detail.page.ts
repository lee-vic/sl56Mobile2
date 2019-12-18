import { Component, OnInit } from '@angular/core';
import { DeliveryRecordDetailService } from 'src/app/providers/delivery-record-detail.service';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { NavController } from '@ionic/angular';
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
  constructor(public navCtrl: NavController, private router: Router, public service: DeliveryRecordDetailService, private route: ActivatedRoute) {
    //公众号
    this.route.queryParams.subscribe(p=>{
      if(p && p.push){
        if(p.push=="true"){
          this.canGoBack=false;
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
    this.navCtrl.navigateForward("/member/return-apply/" + this.data.ObjectId, { queryParams: { type: 0 } })
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

}
