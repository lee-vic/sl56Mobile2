import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface SubscriptionChannel {
  name: string;
  shortName: string;
  description: string;
  scenario: string;
  image: string;
  type: number;
}

@Component({
  selector: 'app-message-subscription',
  templateUrl: './message-subscription.page.html',
  styleUrls: ['./message-subscription.page.scss']
})
export class MessageSubscriptionPage implements OnInit {

  items: Array<SubscriptionChannel> = [{
    name: '微信公众号消息',
    shortName: '微信',
    description: '通过公众号接收交货、问题件、账务等业务提醒',
    scenario: '适合日常高频查看',
    image: 'official-account',
    type: 1
  }, {
    name: '短信消息',
    shortName: '短信',
    description: '通过手机短信接收关键节点提醒',
    scenario: '适合紧急通知',
    image: 'message',
    type: 2
  }, {
    name: '邮件消息',
    shortName: '邮件',
    description: '通过邮箱接收业务通知和资料类消息',
    scenario: '适合归档与转发',
    image: 'email',
    type: 3
  }];
  constructor(private router: Router) { }

  ngOnInit() {
  }

  openChannel(item: SubscriptionChannel) {
    this.router.navigate(['/member/message-subscription/member', item.type]);
  }

}
