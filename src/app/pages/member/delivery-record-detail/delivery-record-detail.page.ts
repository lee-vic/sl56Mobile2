import { Component, OnInit } from '@angular/core';
import { DeliveryRecordDetailService } from 'src/app/providers/delivery-record-detail.service';
import { Location } from '@angular/common';
import {  ActivatedRoute } from '@angular/router';
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
  constructor( public service:DeliveryRecordDetailService,public location:Location,  private route: ActivatedRoute) { }

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
    // this.navCtrl.push(UserReturnApplyPage, {
    //   id: this.id,
    //   type:0
    // });
  }
  chat(){
    // this.navCtrl.push(UserChatPage, {
    //   receiveGoodsDetailId: this.data.ObjectId,
    //   messages:this.data.ChatRecords,
    //   messageType:1
    // });
  }
  goBack() {
    this.location.back();
  }

}
