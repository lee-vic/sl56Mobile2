import { Component, OnInit, ViewChild } from '@angular/core';
import { WechatPay } from 'src/app/interfaces/wechat-pay';
import { WechatPayListService } from 'src/app/providers/wechat-pay-list.service';
import { LoadingController, IonInfiniteScroll } from '@ionic/angular';
import { Location } from '@angular/common';

@Component({
  selector: 'app-wechat-pay-list',
  templateUrl: './wechat-pay-list.page.html',
  styleUrls: ['./wechat-pay-list.page.scss'],
})
export class WechatPayListPage implements OnInit {
  items: Array<WechatPay>=[];
  isBusy:boolean=false;
  currentPageIndex: number = 1;
  @ViewChild(IonInfiniteScroll,{static:true}) infiniteScroll: IonInfiniteScroll;
  constructor(
    public service: WechatPayListService,
    private location: Location,
    public loadingCtrl: LoadingController,
    ) {
 
  }
  ngOnInit(): void {
    this.getItems();
  }
  ionViewDidLoad() {
    console.log('ionViewDidLoad WechatPayListPage');
  }
  getItems() {
    if (this.isBusy == true)
      return;
    this.isBusy = true;
    this.service.getList(this.currentPageIndex).subscribe(res => {
     
      for (var i = 0; i < res.length; i++) {
        this.items.push(res[i]);
      }
      this.currentPageIndex++;
    
        this.infiniteScroll.complete();
      this.isBusy = false;
    });
  }
  goBack() {
    this.location.back();
  }
}
