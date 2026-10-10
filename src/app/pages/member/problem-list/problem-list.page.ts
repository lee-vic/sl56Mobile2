import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { IonInfiniteScroll, IonSearchbar, NavController } from '@ionic/angular';
import { Problem } from 'src/app/interfaces/problem';
import { ProblemService } from 'src/app/providers/problem.service';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';


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
  isLoading: boolean = false;
  searchKeyword = '';
  // 0：发运前；1：运输中；2：快速确认；3：已处理，与 PC 分类参数一致。
  problemType = 0;
  categoryCounts: (number | null)[] | null = null;
  private readonly cancelCounts$ = new Subject<void>();
  problemId:number;
  receiveGoodsDetailId:number;
  private searchDebounceTimer?: ReturnType<typeof setTimeout>;
  private readonly cancelLoad$ = new Subject<void>();
  @ViewChild(IonInfiniteScroll,{ static: false }) infiniteScroll: IonInfiniteScroll;
  @ViewChild(IonSearchbar,{ static: false }) searchbar: IonSearchbar;

  ngOnInit(): void {
    if(this.problemId !== undefined){
        this.problemDetail(this.receiveGoodsDetailId,this.problemId);
    }
  }

  ionViewWillEnter(): void {
    // Ionic 会缓存列表页；从完成页返回必须清除旧搜索并刷新，不能只依赖首次 ngOnInit。
    this.clearPendingSearch();
    this.searchKeyword = '';
    this.loadFirstPage('');
    this.refreshCategoryCounts();
  }

  ionViewWillLeave(): void {
    this.cancelCounts$.next();
    this.clearPendingSearch();
    this.cancelLoad$.next();
    this.isBusy = false;
  }

  ngOnDestroy(): void {
    this.cancelCounts$.next();
    this.cancelCounts$.complete();
    this.clearPendingSearch();
    this.cancelLoad$.next();
    this.cancelLoad$.complete();
  }

  private clearPendingSearch(): void {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = undefined;
    }
  }

  constructor(public navCtrl: NavController,
    private route: ActivatedRoute,
    public service: ProblemService,
    ) {
      this.problemId = this.route.snapshot.queryParams.problemId;
      this.receiveGoodsDetailId = this.route.snapshot.queryParams.receiveGoodsDetailId;
     
  }

 
  detail(item: Problem) {
    this.navCtrl.navigateForward("/member/delivery-record/detail/"+item.Id);
  }
  problemDetail(_receiveGoodsDetailId: number,_problemId: number){
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

  changeProblemType(event: CustomEvent): void {
    const type = Number((event.detail as { value?: string | number }).value);
    if (![0, 1, 2, 3].includes(type) || type === this.problemType) return;
    this.clearPendingSearch();
    this.problemType = type;
    this.loadFirstPage(this.searchKeyword);
  }

  clearSearch(): void {
    this.searchKeyword = '';
    this.loadFirstPage('');
  }

  refreshItems(event: CustomEvent): void {
    this.refreshCategoryCounts();
    this.loadFirstPage(this.searchKeyword, event);
  }

  private refreshCategoryCounts(): void {
    // 角标为未搜索的分类总数，返回详情/下拉刷新时更新；失败不冒充零待办。
    this.cancelCounts$.next();
    this.categoryCounts = null;
    this.service.getListCounts().pipe(takeUntil(this.cancelCounts$)).subscribe({
      next: counts => this.categoryCounts = [counts.Before, counts.InTransit, counts.Confirmable],
      error: () => this.categoryCounts = null
    });
  }

  get totalProblemCount(): number {
    return this.items.reduce((sum, item) => sum + (item.ProblemList?.length || 0), 0);
  }

  get loadedWaybillCount(): number {
    // 快速确认按问题分页，同一运单可能出现多行；运单汇总必须按收货 ID 去重。
    return new Set(this.items.map(item => Number(item.Id))).size;
  }

  trackByProblem(_index: number, item: Problem): number {
    return Number(item.Id);
  }

  loadFirstPage(keyword: string, refresherEvent?: CustomEvent): void {
    // 新筛选/返回刷新取消旧响应，防止上一页的数据覆盖本次列表或被 isBusy 跳过。
    this.cancelLoad$.next();
    this.isBusy = false;
    this.currentPageIndex = 1;
    this.items = [];
    this.isLoading = true;
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
    if (this.isBusy === true)
      return;
    this.isBusy = true;
    this.hasLoadError = false;
    this.service.getList(this.currentPageIndex, key, this.problemType).pipe(takeUntil(this.cancelLoad$)).subscribe(res => {
      this.isLoaded = true;
      let flag = res.length < 10;
      if(flag){
        this.disableInfiniteScroll();
      }
      this.items.push(...res);
      this.currentPageIndex++;
      if(isScroll)
        this.infiniteScroll.complete();
      this.completeRefresher(refresherEvent);
      this.isLoading = false;
      this.isBusy = false;
    }, _ => {
      this.isLoaded = true;
      this.hasLoadError = true;
      if(isScroll && this.infiniteScroll) {
        this.infiniteScroll.complete();
      }
      this.completeRefresher(refresherEvent);
      this.isLoading = false;
      this.isBusy = false;
    });
  }

  scrollItems(_event: CustomEvent) {
    this.getItems(this.searchKeyword, true);
  }

  private completeRefresher(refresherEvent?: CustomEvent): void {
    if (refresherEvent) {
      refresherEvent.target['complete']();
    }
  }
}
