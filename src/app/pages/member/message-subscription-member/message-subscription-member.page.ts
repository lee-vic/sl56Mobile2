import { Component, OnInit } from '@angular/core';
import { ActivatedRoute,Router } from '@angular/router';
import { MessageSubscriptionService } from 'src/app/providers/message-subscription.service';
import { WechatUser } from 'src/app/interfaces/wechat-user';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-message-subscription-member',
  templateUrl: './message-subscription-member.page.html',
  styleUrls: ['./message-subscription-member.page.scss']
})
export class MessageSubscriptionMemberPage implements OnInit {

  type :number;
  items : Array<WechatUser>;
  typeNames=["微信公众号","短信","邮件"];
  constructor(public route:ActivatedRoute,public service:MessageSubscriptionService,public router:Router,public alert:AlertController) { }

  ngOnInit(): void {
  }

  ionViewDidEnter(){
    this.type=parseInt(this.route.snapshot.paramMap.get("type"));
    switch(this.type){
      case 1:
        this.service.getOfficialAccountMessageSubscription().subscribe(res=>{
          this.items = res;
        });
        break;
      case 2:
        this.service.getSMSMessageSubscription().subscribe(res=>{
          this.items = res;
        });
        break;
      case 3:
        this.service.getEmailMessageSubscription().subscribe(res=>{
          this.items = res;
        });
        break;
    }
    console.log(this.items);
  }

  async remove(item){
    const errorAlert = await this.alert.create({
      header: '警告',
      subHeader: '确定删除吗？',
      message: '此联系人被删除后，将无法接收 ['+this.typeNames[this.type]+'] 消息提醒',
      buttons: [
        '取消',
        {
        text:'确定',
        handler:()=>{
          
        }
      }]
    });
    errorAlert.present();
  }

  edit(item:WechatUser){
    this.router.navigate(["/member/message-subscription/edit",this.type],{queryParams:item});
  }

}
