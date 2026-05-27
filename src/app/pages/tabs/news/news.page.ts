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
  tabIndex = '2';
  isInitialLoading = false;
  loadError = '';
  isRefreshing = false;

  constructor(  private service: NoticeService,
    private router: Router,
    public navCtrl: NavController,
    public modalController: ModalController,
    public activeRoute: ActivatedRoute) {}

  get activeTab(): NoticeTab | undefined {
    return this.noticeTabs.find(item => item.categoryId === this.tabIndex);
  }

  ngOnInit(): void {
    const routeTab = this.activeRoute.snapshot.paramMap.get('id');
    if (routeTab) {
      this.tabIndex = routeTab;
    }

    const targetTab = this.noticeTabs.find(item => item.categoryId === this.tabIndex) || this.noticeTabs[0];
    this.tabIndex = targetTab.categoryId;
    this.selectedTab(targetTab, true);
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

    if (!infiniteEvent && tab.items.length === 0) {
      this.isInitialLoading = true;
      this.loadError = '';
    }

    tab.isBusy = true;
    this.service.getNewsList(tab.categoryId, tab.currentPageIndex).subscribe({
      next: (res) => {
        const rep = res as Notice[];
        if (rep.length === 0) {
          if (infiniteEvent != null) {
            this.disableInfiniteScroll(infiniteEvent);
          }
        } else {
          for (let i = 0; i < rep.length; i++) {
            tab.items.push(rep[i]);
          }
          tab.currentPageIndex++;
        }

        if (infiniteEvent != null) {
          this.completeInfiniteScroll(infiniteEvent);
        }
      },
      error: () => {
        if (!infiniteEvent && tab.items.length === 0) {
          this.loadError = '加载失败，请稍后重试';
        }
        if (infiniteEvent != null) {
          this.completeInfiniteScroll(infiniteEvent);
        }
        tab.isBusy = false;
        this.isInitialLoading = false;
      },
      complete: () => {
        tab.isBusy = false;
        this.isInitialLoading = false;
      }
    });
  }

  retryLoadActiveTab() {
    if (!this.activeTab) {
      return;
    }

    this.activeTab.currentPageIndex = 1;
    this.activeTab.items = [];
    this.getItems(this.activeTab, null);
  }

  refreshActiveTab(event: CustomEvent) {
    if (!this.activeTab) {
      const noTabTarget = (event.target as any) || event.detail;
      if (noTabTarget && typeof noTabTarget.complete === 'function') {
        noTabTarget.complete();
      }
      return;
    }

    const tab = this.activeTab;
    tab.currentPageIndex = 1;
    tab.items = [];
    tab.isBusy = true;
    this.isRefreshing = true;
    this.loadError = '';

    this.service.getNewsList(tab.categoryId, tab.currentPageIndex).subscribe({
      next: (res) => {
        const rep = res as Notice[];
        for (let i = 0; i < rep.length; i++) {
          tab.items.push(rep[i]);
        }
        if (rep.length > 0) {
          tab.currentPageIndex++;
        }
      },
      error: () => {
        this.loadError = '刷新失败，请稍后重试';
      },
      complete: () => {
        tab.isBusy = false;
        this.isRefreshing = false;
        const target = (event.target as any) || event.detail;
        if (target && typeof target.complete === 'function') {
          target.complete();
        }
      }
    });
  }

  segmentChanged(ev: CustomEvent) {
    let findResult = this.noticeTabs.find(item => item.categoryId == ev.detail.value);
    this.selectedTab(findResult);
  }

  selectedTab(tab: NoticeTab, fromInit = false) {
    if (!tab) {
      return;
    }

    this.tabIndex = tab.categoryId;
    if (tab.items.length == 0) {
      this.getItems(tab, null);
      return;
    }

    if (!fromInit) {
      this.loadError = '';
      this.isInitialLoading = false;
    }
  }

  openDetail(item:Notice) {

    this.navCtrl.navigateForward("/member/notice-detail/"+item.NoticeId);

  }

  trackByNotice(index: number, item: Notice): any {
    return item.NoticeId || item.CreateAt || index;
  }
}
