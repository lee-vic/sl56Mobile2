import { Component, OnInit } from '@angular/core';
import { MessageType } from 'src/app/interfaces/message-type';
import { MessageSubscriptionService } from 'src/app/providers/message-subscription.service';
import { ActivatedRoute } from "@angular/router";
import { NavController,AlertController } from '@ionic/angular';
import { WechatUser } from 'src/app/interfaces/wechat-user';

@Component({
  selector: 'app-message-subscription-edit',
  templateUrl: './message-subscription-edit.page.html',
  styleUrls: ['./message-subscription-edit.page.scss']
})
export class MessageSubscriptionEditPage implements OnInit {

  items : Array<MessageType>;
  type : any;
  user : WechatUser;
  typeNames=["微信公众号","短信","邮件"];
  constructor(public route:ActivatedRoute,public service:MessageSubscriptionService,public nav:NavController,public alert:AlertController) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe((res:WechatUser)=>{
      this.user=res;
    });
    this.type=parseInt(this.route.snapshot.paramMap.get("type"));
    this.getMessageTypes(this.type);
  }

  getMessageTypes(type){
      this.service.getMessageTypes(type).subscribe((res:Array<MessageType>)=>{
        res.forEach(p=>{
            if(this.user.SubscribeMessageTypeNames.indexOf(p.ObjectName)!=-1){
              p.IsSelected=true;
            }
          });
        this.items=res;
        console.log(res);
      });
  }

  save(){
    let selectedList=this.items.filter(p=>p.IsSelected);
    this.user.SubscribeMessageTypes.length=0;
    selectedList.forEach(p=>this.user.SubscribeMessageTypes.push(p.ObjectId));
    this.service.subscribeWechatMessageType(this.type,this.user).subscribe(async res=>{
      if(res.Success){
        this.nav.back();
      }else{
        const errorAlert = await this.alert.create({
          header: '操作失败',
          subHeader: '原因如下：',
          message: '['+res.ErrMsg+']',
          buttons: ['确定']
        });
        errorAlert.present();
      }
    });
  }

}
