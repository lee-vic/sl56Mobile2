import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
@Component({
  selector: 'app-wechat-pay-description',
  templateUrl: './wechat-pay-description.page.html',
  styleUrls: ['./wechat-pay-description.page.scss'],
})
export class WechatPayDescriptionPage implements OnInit {

  constructor( private location: Location,) { }

  ngOnInit() {
  }
  goBack() {
    this.location.back();
  }
}
