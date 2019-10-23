import { Component, OnInit } from '@angular/core';
import{ Notice} from '../../../interfaces/notice';
import{ NoticeTab} from '../../../interfaces/notice-tab';
import { NoticeService } from '../../../providers/notice.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { NewsDetailPage } from '../news-detail/news-detail.page';
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
    public modalController: ModalController,
    public activeRoute: ActivatedRoute) {}
  ngOnInit(): void {
    this.tabIndex=this.activeRoute.snapshot.paramMap.get('id');
    this.getItems(this.noticeTabs[0], null);
  }
  getItems(tab: NoticeTab, infiniteScroll) {

    if (tab.isBusy)
      return;
    tab.isBusy = true;
    this.service.getNewsList(tab.categoryId, tab.currentPageIndex).subscribe(res => {
      let rep = res as Notice[];
      if (rep.length == 0) {
        infiniteScroll.disabled=true;
      }
      else {
        for (var i = 0; i < rep.length; i++) {
          tab.items.push(rep[i]);
        }
        tab.currentPageIndex++;
      }
      if (infiniteScroll != null)
        infiniteScroll.target.complete();
      tab.isBusy = false;
    });
  }
  segmentChanged(ev) {
    
    let findResult = this.noticeTabs.find(item => item.categoryId == ev.target.value);
    this.selectedTab(findResult);
  }
  selectedTab(tab: NoticeTab) {
  
    this.tabIndex = tab.categoryId;
    if (tab.items.length == 0)
      this.getItems(tab, null);
  }
 
  openDetail(item:Notice) {

    this.router.navigate(["/app/tabs/news-details",item.NoticeId]);
   

  }
  
}
