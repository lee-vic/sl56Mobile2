import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { DeliveryRecord } from 'src/app/interfaces/delivery-record';
import { IonSearchbar,IonInfiniteScroll,Events } from '@ionic/angular';
import { DeliveryRecordService } from 'src/app/providers/delivery-record.service';
import {ReturnService} from 'src/app/providers/return.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-delivery-record',
  templateUrl: './delivery-record.page.html',
  styleUrls: ['./delivery-record.page.scss'],
})
export class DeliveryRecordPage implements OnInit {
  items: Array<DeliveryRecord> = [];
  currentPageIndex: number = 1;
  isShowCheckbox:boolean=false;
  waitReturnCount:number=0;

  @ViewChild(IonInfiniteScroll,{static:true}) infiniteScroll: IonInfiniteScroll;
  @ViewChild(IonSearchbar,{static:true}) searchbar: IonSearchbar;
  constructor(public service: DeliveryRecordService,  private router: Router,public returnService:ReturnService,public events:Events) { }

  ngOnInit() {
    this.getItems("",false);
    this.getWaitingReturnList();
    
    this.events.subscribe('reloadWaitingReturn',() => {
      this.getWaitingReturnList();
    });
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
      if(flag){
        this.infiniteScroll.disabled=true;
      }
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
  batchReturn(){
    this.isShowCheckbox=!this.isShowCheckbox;
    if(!this.isShowCheckbox){
      let selectIds = this.items.filter(p=>p.Selected).map(p=>p.Id);
      this.addWaitingReturnList(selectIds.toString());
      this.items.forEach(p=>{p.Selected=false});
    }
  }
  clickCheckBox(item:DeliveryRecord){
    item.Selected=!item.Selected;
  }
  getWaitingReturnList(){
    this.returnService.getWaitReturnList().subscribe(res=>{
      this.waitReturnCount=res.length;
    });
  }
  addWaitingReturnList(ids){
    if(ids.length>0){
      this.returnService.addToWaitReturnList(ids).subscribe(res=>{
        this.getWaitingReturnList();
      });
    }
  }
  waitingReturnList(){
    this.events.publish('reloadWaitingReturn');
    this.router.navigate(["/member/return-waiting"]);
  }
}
