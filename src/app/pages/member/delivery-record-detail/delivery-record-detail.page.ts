import { Component, OnInit } from '@angular/core';
import { DeliveryRecordDetailService } from 'src/app/providers/delivery-record-detail.service';
import {  ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';
@Component({
  selector: 'app-delivery-record-detail',
  templateUrl: './delivery-record-detail.page.html',
  styleUrls: ['./delivery-record-detail.page.scss'],
})
export class DeliveryRecordDetailPage implements OnInit {
  data:any;
  id:any;
  tab="1";
  isReturn=true;
  constructor(public navCtrl: NavController,  public service:DeliveryRecordDetailService, private route: ActivatedRoute) { }

  ngOnInit() {
    this.id = +this.route.snapshot.paramMap.get('id');
      //不能返回的视为站外链接
   //let canGoBack:boolean=this.navCtrl.canGoBack();
   this.service.getDetail(true, this.id).subscribe(res=>{
     this.data=res;
    this.isReturn=this.data.IsReturnCustomer;
    console.log(this.data);
   },(err)=>{
    
    //  let toast = this.toastCtrl.create({
    //    message: err.message,
    //    position: 'middle',
    //    duration: 2000
    //  });
    //  toast.present();
   });
  }
  applyReturn(){
    this.navCtrl.navigateForward("/member/return-apply",{queryParams:{id:this.data.ObjectId,type:0}})
  }
  chat(){
    // this.navCtrl.push(UserChatPage, {
    //   receiveGoodsDetailId: this.data.ObjectId,
    //   messages:this.data.ChatRecords,
    //   messageType:1
    // });
  }
  
}
