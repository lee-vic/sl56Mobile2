import { Component, OnInit, OnDestroy } from '@angular/core';
import { InstantMessageService } from 'src/app/providers/instant-message.service';
import { Router, ActivatedRoute } from '@angular/router';
import { NoticeService } from 'src/app/providers/notice.service';
import { Notice } from 'src/app/interfaces/notice';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface MessageCenterEntry {
  title: string;
  description: string;
  image: string;
  badge?: number;
  action: () => void;
}


@Component({
  selector: 'app-unread-message-list',
  templateUrl: './unread-message-list.page.html',
  styleUrls: ['./unread-message-list.page.scss'],
})
export class UnreadMessageListPage implements OnInit, OnDestroy {
  customerId: number;
  noticeUnreadCount = 0;
  recentNotices: Array<Notice> = [];
  isLoading = false;
  isRefreshing = false;
  loadError = false;

  private readonly destroy$ = new Subject<void>();

  // 消息中心独立模型（InstantMessage/GetUnReadMessage 返回）
  msgData: { WaybillMessageCount?: number; ConsultMessageCount?: number; NoticeUnreadCount?: number } = {};

  ngOnInit(): void {
    this.loadMessageCenter();
  }

  ionViewWillEnter(): void {
    this.loadMessageCenter();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadMessageCenter(event?: CustomEvent) {
    this.isRefreshing = !!event;
    this.isLoading = !event;
    this.loadError = false;

    const unreadMsg$ = this.customerId === undefined
      ? this.service.getUnReadMessage()
      : this.service.getUnReadMessage1(this.customerId);

    forkJoin({
      unreadMessages: unreadMsg$,
      notices: this.noticeService.getNoticeList(1)
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: res => {
        this.msgData = res.unreadMessages || {};
        this.noticeUnreadCount = (res.unreadMessages && res.unreadMessages.NoticeUnreadCount) || 0;
        this.recentNotices = (res.notices || []).slice(0, 3);
        this.finishLoading(event);
      },
      error: () => {
        this.loadError = true;
        this.finishLoading(event);
      }
    });
  }

  private finishLoading(event?: CustomEvent) {
    this.isLoading = false;
    this.isRefreshing = false;
    if (event && event.target) {
      const refresher = event.target as HTMLIonRefresherElement;
      refresher.complete();
    }
  }

  retryLoad() {
    this.loadMessageCenter();
  }

  refresh(event: CustomEvent) {
    this.loadMessageCenter(event);
  }

  getData() {
    if (this.customerId === undefined) {
      this.service.getUnReadMessage().subscribe(res => {
        this.msgData = res;
        this.noticeUnreadCount = res.NoticeUnreadCount || 0;
      });
    } else {
      this.getData1();
    }
  }

  getData1() {
    this.service.getUnReadMessage1(this.customerId).subscribe(res => {
      this.msgData = res;
    });
  }

  getNoticeUnreadCount() {
    this.noticeService.getUnreadCount().subscribe(res => {
      this.noticeUnreadCount = res || 0;
    });
  }
  constructor(
    public service: InstantMessageService,
    private noticeService: NoticeService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.route.queryParams.subscribe(params => {
      this.customerId = params.customerId;
    });
  }

  detail(type: number) {
    if (type === 0) {
      this.router.navigate(["/member", "chat", 0]);
    }
    else {
      this.router.navigate(["/member", "unread-message-list1"])
    }
  }

  get totalUnreadCount(): number {
    return this.getConsultUnreadCount() + this.getWaybillUnreadCount() + this.noticeUnreadCount;
  }

  get customerServiceEntries(): Array<MessageCenterEntry> {
    return [
      {
        title: '咨询业务',
        description: '查看客服咨询与售前沟通消息',
        image: 'assets/imgs/unread-message-list-1.png',
        badge: this.getConsultUnreadCount(),
        action: () => this.detail(0)
      },
      {
        title: '单号消息',
        description: '查看运单相关客服消息',
        image: 'assets/imgs/unread-message-list-2.png',
        badge: this.getWaybillUnreadCount(),
        action: () => this.detail(1)
      }
    ];
  }

  get businessNoticeEntries(): Array<MessageCenterEntry> {
    return [
      {
        title: '业务公告',
        description: '查看业务通知、操作提醒和平台公告',
        image: 'assets/imgs/member-19.png',
        badge: this.noticeUnreadCount,
        action: () => this.openNoticeList()
      }
    ];
  }

  get messageSettingEntries(): Array<MessageCenterEntry> {
    return [
      {
        title: '消息订阅',
        description: '管理微信公众号、短信和邮件提醒',
        image: 'assets/imgs/member-22.png',
        action: () => this.openMessageSubscription()
      }
    ];
  }

  getConsultUnreadCount(): number {
    return this.msgData && this.msgData.ConsultMessageCount ? this.msgData.ConsultMessageCount : 0;
  }

  getWaybillUnreadCount(): number {
    return this.msgData && this.msgData.WaybillMessageCount ? this.msgData.WaybillMessageCount : 0;
  }

  formatBadgeCount(count: number): string {
    return count > 99 ? '99+' : String(count || 0);
  }

  openNoticeList() {
    this.router.navigateByUrl('/member/notice-list');
  }

  openNoticeDetail(item: Notice) {
    this.router.navigateByUrl('/member/notice-detail/' + item.NoticeId);
  }

  openMessageSubscription() {
    this.router.navigateByUrl('/member/message-subscription/list');
  }

  openEntry(entry: MessageCenterEntry) {
    entry.action();
  }

}
