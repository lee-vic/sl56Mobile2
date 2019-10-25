import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { DeliveryRecord } from 'src/app/interfaces/delivery-record';
import { IonSearchbar,IonInfiniteScroll } from '@ionic/angular';
import { DeliveryRecordService } from 'src/app/providers/delivery-record.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-delivery-record',
  templateUrl: './delivery-record.page.html',
  styleUrls: ['./delivery-record.page.scss'],
})
export class DeliveryRecordPage implements OnInit {
  items: Array<DeliveryRecord> = [];
  currentPageIndex: number = 1;

  @ViewChild(IonInfiniteScroll,{static:true}) infiniteScroll: IonInfiniteScroll;
  @ViewChild(IonSearchbar,{static:true}) searchbar: IonSearchbar;
  constructor(public service: DeliveryRecordService,  private router: Router,) { }

  ngOnInit() {
    this.getItems("",false);
  }
 
  searchItems() {

  
    this.currentPageIndex = 1;
    this.items.length = 0;
    this.getItems(this.searchbar.value,false);
  }

  //加载数据
  getItems(key:string,isScroll:boolean) {
   
    this.service.loadList(this.currentPageIndex, key).subscribe(res => {
      let flag = res.length < 10;
      //this.infiniteScroll.enable(!flag);
      for (var i = 0; i < res.length; i++) {
        this.items.push(res[i]);
      }
      this.currentPageIndex++;
      if(isScroll)
        this.infiniteScroll.complete();
  
    });
  }
  scrollItems($event) {
     this.getItems(this.searchbar.value,true);
   
  }

  detail(item) {
    this.router.navigate(["/member/delivery-record/detail",item.Id]);
    // this.navCtrl.push(UserDeliveryRecordDetailPage, {
    //   id: item.Id
    // });
  }
}
