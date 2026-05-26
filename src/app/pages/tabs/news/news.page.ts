import { Component, OnInit } from '@angular/core';
import{ Notice} from '../../../interfaces/notice';
import{ NoticeTab} from '../../../interfaces/notice-tab';
import { NoticeService } from '../../../providers/notice.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalController, NavController } from '@ionic/angular';

@Component({
  selector: 'app-news',
  templateUrl: './news.page.html',
  styleUrls: ['./news.page.scss'],
})
export class NewsPage implements OnInit {

  noticeTabs: NoticeTab[] = [
    {
      currentPageIndex: 1,
      categoryId: "2",
      title: "公司通知",
      items: [],
      isBusy: false
    },
    {
      currentPageIndex: 1,
      categoryId: "3",
      title: "业务信息",
      items: [],
      isBusy: false
    },
    {
      currentPageIndex: 1,
      categoryId: "4",
      title: "公司信息",
      items: [],
      isBusy: false
    },
    {
      currentPageIndex: 1,
      categoryId: "5",
      title: "行业信息",
      items: [],
      isBusy: false
    }
  ];
  tab1PageIndex: number = 1;
  tabIndex = "2";
  constructor(  private service: NoticeService,
    private router: Router,
    public navCtrl: NavController,
    public modalController: ModalController,
    public activeRoute: ActivatedRoute) {}
  ngOnInit(): void {
    this.tabIndex=this.activeRoute.snapshot.paramMap.get('id');
    this.getItems(this.noticeTabs[0], null);
  }

  private disableInfiniteScroll(infiniteEvent: any): void {
    if (!infiniteEvent) return;
    const target = (infiniteEvent.target as any) || infiniteEvent;
    const setDisabled = target && target.setDisabled;
    if (typeof setDisabled === 'function') {
      setDisabled.call(target, true);
    } else if (target) {
      target.disabled = true;
    }
    if (typeof infiniteEvent.disabled !== 'undefined') {
      infiniteEvent.disabled = true;
    }
  }

  private completeInfiniteScroll(infiniteEvent: any): void {
    const target = (infiniteEvent && (infiniteEvent.target as any)) || null;
    if (!target) return;
    const complete = target.complete;
    if (typeof complete === 'function') {
      complete.call(target);
    }
  }

  getItems(tab: NoticeTab, infiniteEvent: any) {

    if (tab.isBusy)
      return;
    tab.isBusy = true;
    this.service.getNewsList(tab.categoryId, tab.currentPageIndex).subscribe(res => {
      let rep = res as Notice[];
      if (rep.length == 0) {
        if (infiniteEvent != null) {
          this.disableInfiniteScroll(infiniteEvent);
        }
      }
      else {
        for (var i = 0; i < rep.length; i++) {
          tab.items.push(rep[i]);
        }
        tab.currentPageIndex++;
      }
      if (infiniteEvent != null)
        this.completeInfiniteScroll(infiniteEvent);
      tab.isBusy = false;
    });
  }
  segmentChanged(ev: CustomEvent) {
    
    let findResult = this.noticeTabs.find(item => item.categoryId == ev.detail.value);
    this.selectedTab(findResult);
  }
  selectedTab(tab: NoticeTab) {
  
    this.tabIndex = tab.categoryId;
    if (tab.items.length == 0)
      this.getItems(tab, null);
  }
 
  openDetail(item:Notice) {

    this.navCtrl.navigateForward("/member/notice-detail/"+item.NoticeId);

  }
  
}
