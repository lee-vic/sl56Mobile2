import { Component, OnInit } from '@angular/core';
import { ActivatedRoute,Router } from '@angular/router';
import { MessageSubscriptionService } from 'src/app/providers/message-subscription.service';
import { WechatUser } from 'src/app/interfaces/wechat-user';
import { AlertController } from '@ionic/angular';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-message-subscription-member',
  templateUrl: './message-subscription-member.page.html',
  styleUrls: ['./message-subscription-member.page.scss']
})
export class MessageSubscriptionMemberPage implements OnInit {

  type :number;
  items : Array<WechatUser> = [];
  typeNames = ['微信公众号', '短信', '邮件'];
  channelTips = [
    '为已绑定公众号的联系人设置业务提醒',
    '为手机联系人设置关键节点短信提醒',
    '为邮箱联系人设置业务通知和资料提醒'
  ];
  isLoading = false;
  loadError = false;
  constructor(public route:ActivatedRoute,public service:MessageSubscriptionService,public router:Router,public alert:AlertController) { }

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems(event?: CustomEvent) {
    this.type=parseInt(this.route.snapshot.paramMap.get("type"));
    this.isLoading = !event;
    this.loadError = false;

    this.getChannelRequest().subscribe({
      next: res => {
        this.items = res || [];
        this.finishLoading(event);
      },
      error: () => {
        this.items = [];
        this.loadError = true;
        this.finishLoading(event);
      }
    });
  }

  private getChannelRequest(): Observable<Array<WechatUser>> {
    switch (this.type) {
      case 1:
        return this.service.getOfficialAccountMessageSubscription();
      case 2:
        return this.service.getSMSMessageSubscription();
      case 3:
        return this.service.getEmailMessageSubscription();
      default:
        return this.service.getOfficialAccountMessageSubscription();
    }
  }

  private finishLoading(event?: CustomEvent) {
    this.isLoading = false;
    if (event && event.target) {
      const refresher = event.target as HTMLIonRefresherElement;
      refresher.complete();
    }
  }

  refresh(event: CustomEvent) {
    this.loadItems(event);
  }

  retryLoad() {
    this.loadItems();
  }

  get channelName(): string {
    return this.typeNames[this.type - 1] || '消息';
  }

  get channelTip(): string {
    return this.channelTips[this.type - 1] || '为联系人设置业务提醒';
  }

  getSubscriptionNames(item: WechatUser): Array<string> {
    if (!item || !item.SubscribeMessageTypeNames) {
      return [];
    }
    return item.SubscribeMessageTypeNames.split(',').filter(p => !!p);
  }

  getSubscriptionCount(item: WechatUser): number {
    return this.getSubscriptionNames(item).length;
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
