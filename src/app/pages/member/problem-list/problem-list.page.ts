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
  isLoaded = false;
  hasLoadError = false;
  searchKeyword = '';
  problemId:number;
  receiveGoodsDetailId:number;
  private searchDebounceTimer: any;
  @ViewChild(IonInfiniteScroll,{ static: false }) infiniteScroll: IonInfiniteScroll;
  @ViewChild(IonSearchbar,{ static: false }) searchbar: IonSearchbar;

  ngOnInit(): void {
    this.loadFirstPage('');
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
  }
  problemDetail(_receiveGoodsDetailId,_problemId){
    this.navCtrl.navigateForward("/member/problem-detail/"+_receiveGoodsDetailId,{queryParams:{problemid:_problemId}});
  }

  onSearchInput(event: CustomEvent): void {
    const keyword = ((event?.detail as any)?.value || '').trim();
    this.searchKeyword = keyword;
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
    this.searchDebounceTimer = setTimeout(() => {
      this.loadFirstPage(keyword);
    }, 280);
  }

  clearSearch(): void {
    this.searchKeyword = '';
    this.loadFirstPage('');
  }

  refreshItems(event: CustomEvent): void {
    this.loadFirstPage(this.searchKeyword, event);
  }

  get totalProblemCount(): number {
    return this.items.reduce((sum, item) => sum + (item.ProblemList?.length || 0), 0);
  }

  trackByProblem(_index: number, item: Problem): Number {
    return item.Id;
  }

  loadFirstPage(keyword: string, refresherEvent?: CustomEvent): void {
    this.currentPageIndex = 1;
    this.items = [];
    this.enableInfiniteScroll();
    this.getItems(keyword, false, refresherEvent);
  }

  private disableInfiniteScroll(): void {
    if (!this.infiniteScroll) return;
    const setDisabled = (this.infiniteScroll as any).setDisabled;
    if (typeof setDisabled === 'function') {
      setDisabled.call(this.infiniteScroll, true);
      return;
    }
    this.infiniteScroll.disabled = true;
  }

  private enableInfiniteScroll(): void {
    if (!this.infiniteScroll) return;
    const setDisabled = (this.infiniteScroll as any).setDisabled;
    if (typeof setDisabled === 'function') {
      setDisabled.call(this.infiniteScroll, false);
      return;
    }
    this.infiniteScroll.disabled = false;
  }

  getItems(key:string,isScroll:boolean, refresherEvent?: CustomEvent) {
    if (this.isBusy == true)
      return;
    this.isBusy = true;
    this.hasLoadError = false;
    this.service.getList(this.currentPageIndex, key).subscribe(res => {
      this.isLoaded = true;
      let flag = res.length < 10;
      if(flag){
        this.disableInfiniteScroll();
      }
      for (var i = 0; i < res.length; i++) {
        this.items.push(res[i]);
      }
      this.currentPageIndex++;
      if(isScroll)
        this.infiniteScroll.complete();
      if (refresherEvent) {
        refresherEvent.target['complete']();
      }
      this.isBusy = false;
    }, _ => {
      this.isLoaded = true;
      this.hasLoadError = true;
      if(isScroll && this.infiniteScroll) {
        this.infiniteScroll.complete();
      }
      if (refresherEvent) {
        refresherEvent.target['complete']();
      }
      this.isBusy = false;
    });
  }

  scrollItems($event) {
    this.getItems(this.searchKeyword, true);
  }
}
