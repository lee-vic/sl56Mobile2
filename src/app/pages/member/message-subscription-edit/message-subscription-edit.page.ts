import { Component, OnInit } from '@angular/core';
import { MessageType } from 'src/app/interfaces/message-type';
import { MessageSubscriptionService } from 'src/app/providers/message-subscription.service';
import { ActivatedRoute } from "@angular/router";
import { NavController,AlertController, LoadingController } from '@ionic/angular';
import { WechatUser } from 'src/app/interfaces/wechat-user';

@Component({
  selector: 'app-message-subscription-edit',
  templateUrl: './message-subscription-edit.page.html',
  styleUrls: ['./message-subscription-edit.page.scss']
})
export class MessageSubscriptionEditPage implements OnInit {

  items : Array<MessageType> = [];
  type : number;
  user : WechatUser;
  typeNames = ['微信公众号', '短信', '邮件'];
  isLoading = false;
  isSaving = false;
  loadError = false;
  constructor(public route:ActivatedRoute,public service:MessageSubscriptionService,public nav:NavController,public alert:AlertController, private loadingCtrl: LoadingController) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe((res:WechatUser)=>{
      this.user=res;
    });
    this.type=parseInt(this.route.snapshot.paramMap.get("type"));
    this.getMessageTypes(this.type);
  }

  getMessageTypes(type){
    this.isLoading = true;
    this.loadError = false;
    this.service.getMessageTypes(type).subscribe({
      next: (res:Array<MessageType>)=>{
        const selectedNames = this.user && this.user.SubscribeMessageTypeNames ? this.user.SubscribeMessageTypeNames : '';
        res.forEach(p=>{
          p.IsSelected = selectedNames.indexOf(p.ObjectName) !== -1;
        });
        this.items=res;
        this.isLoading = false;
      },
      error: () => {
        this.items = [];
        this.loadError = true;
        this.isLoading = false;
      }
    });
  }

  get channelName(): string {
    return this.typeNames[this.type - 1] || '消息';
  }

  get selectedCount(): number {
    return this.items ? this.items.filter(p => p.IsSelected).length : 0;
  }

  selectAll() {
    this.items.forEach(item => item.IsSelected = true);
  }

  clearAll() {
    this.items.forEach(item => item.IsSelected = false);
  }

  retryLoad() {
    this.getMessageTypes(this.type);
  }

  save(){
    if (this.isSaving || !this.user) {
      return;
    }
    this.isSaving = true;
    let selectedList=this.items.filter(p=>p.IsSelected);
    this.user.SubscribeMessageTypes.length=0;
    selectedList.forEach(p=>this.user.SubscribeMessageTypes.push(p.ObjectId));
    this.loadingCtrl.create({ message: '保存中...' }).then((loading) => {
      loading.present();
      this.service.subscribeWechatMessageType(this.type,this.user).subscribe(async res=>{
        loading.dismiss();
        this.isSaving = false;
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
      }, async () => {
        loading.dismiss();
        this.isSaving = false;
        const errorAlert = await this.alert.create({
          header: '操作失败',
          message: '网络异常，请稍后重试',
          buttons: ['确定']
        });
        errorAlert.present();
      });
    });
  }

}
