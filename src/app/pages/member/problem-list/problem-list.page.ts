import { Component, OnInit, ViewChild } from '@angular/core';
import { IonInfiniteScroll, IonSearchbar, NavController } from '@ionic/angular';
import { Problem } from 'src/app/interfaces/problem';
import { ProblemService } from 'src/app/providers/problem.service';
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'app-problem-list',
  templateUrl: './problem-list.page.html',
  styleUrls: ['./problem-list.page.scss'],
})
export class ProblemListPage implements OnInit {

  items: Array<Problem> = [];
  currentPageIndex: number = 1;
  isBusy: boolean = false;
  problemId:number;
  receiveGoodsDetailId:number;
  @ViewChild(IonInfiniteScroll,{ static: false }) infiniteScroll: IonInfiniteScroll;
  @ViewChild(IonSearchbar,{ static: false }) searchbar: IonSearchbar;
  ngOnInit(): void {
    this.getItems("",false);
    if(this.problemId!=undefined){
        this.problemDetail(this.receiveGoodsDetailId,this.problemId);
    }
   
   
  }

  constructor(public navCtrl: NavController,
    private route: ActivatedRoute,
    public service: ProblemService,
    ) {
      this.problemId = this.route.snapshot.queryParams.problemId;
      this.receiveGoodsDetailId = this.route.snapshot.queryParams.receiveGoodsDetailId;
     
  }

 
  detail(item) {
    this.navCtrl.navigateForward("/member/delivery-record/detail/"+item.Id);
    
    // this.navCtrl.push(UserDeliveryRecordDetailPage, {
    //   id: item.Id
    // });
  }
  problemDetail(_receiveGoodsDetailId,_problemId){
    this.navCtrl.navigateForward("/member/problem-detail/"+_receiveGoodsDetailId,{queryParams:{problemid:_problemId}});
    // this.navCtrl.push(UserProblemDetailPage, {
    //   receiveGoodsDetailId: _receiveGoodsDetailId,
    //   problemId:_problemId
    // });
  }
  searchItems() {
    let val = this.searchbar.value;
    let key = val.trim();
    this.currentPageIndex = 1;
    this.items.length = 0;
    this.getItems(key,false);
  }
  getItems(key:string,isScroll:boolean) {
    if (this.isBusy == true)
      return;
    this.isBusy = true;
    this.service.getList(this.currentPageIndex, key).subscribe(res => {
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
      this.isBusy = false;
    });
  }
  scrollItems($event) {
    this.getItems(this.searchbar.value,true);
   
  }
}
