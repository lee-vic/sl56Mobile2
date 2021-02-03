import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-message-subscription',
  templateUrl: './message-subscription.page.html',
  styleUrls: ['./message-subscription.page.scss']
})
export class MessageSubscriptionPage implements OnInit {

  items=[{
    name:"微信公众号消息",
    image:"official-account",
    type:1
  },{
    name:"短信消息",
    image:"message",
    type:2
  },{
    name:"邮件消息",
    image:"email",
    type:3
  }];
  constructor() { }

  ngOnInit() {
  }

}
