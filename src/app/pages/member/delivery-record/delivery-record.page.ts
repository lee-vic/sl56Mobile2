import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DeliveryRecord } from 'src/app/interfaces/delivery-record';
import { IonSearchbar,IonInfiniteScroll } from '@ionic/angular';
import { DeliveryRecordService } from 'src/app/providers/delivery-record.service';
import {ReturnService} from 'src/app/providers/return.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { WaitingReturnEventsService } from 'src/app/providers/waiting-return-events.service';

@Component({
  selector: 'app-delivery-record',
  templateUrl: './delivery-record.page.html',
  styleUrls: ['./delivery-record.page.scss'],
})
export class DeliveryRecordPage implements OnInit, OnDestroy {
  items: Array<DeliveryRecord> = [];
  currentPageIndex: number = 1;
  isShowCheckbox:boolean=false;
  waitReturnCount:number=0;
  private reloadSubscription: Subscription;

  @ViewChild(IonInfiniteScroll,{static:true}) infiniteScroll: IonInfiniteScroll;
  @ViewChild(IonSearchbar,{static:true}) searchbar: IonSearchbar;
  constructor(
    public service: DeliveryRecordService,
    private router: Router,
    public returnService:ReturnService,
    private waitingReturnEventsService: WaitingReturnEventsService
  ) { }

  ngOnInit() {
    this.getItems("",false);
    this.getWaitingReturnList();
    
    this.reloadSubscription = this.waitingReturnEventsService.onReloadWaitingReturn().subscribe(() => {
      this.getWaitingReturnList();
    });
  }

  ngOnDestroy() {
    if (this.reloadSubscription) {
      this.reloadSubscription.unsubscribe();
    }
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
    this.waitingReturnEventsService.notifyReloadWaitingReturn();
    this.router.navigate(["/member/return-waiting"]);
  }
}
