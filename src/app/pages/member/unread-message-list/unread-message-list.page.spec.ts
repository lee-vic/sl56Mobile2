import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { CookieService } from 'ngx-cookie-service';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';

import { UnreadMessageListPage } from './unread-message-list.page';
import { InstantMessageService } from 'src/app/providers/instant-message.service';
import { NoticeService } from 'src/app/providers/notice.service';
import { Notice } from 'src/app/interfaces/notice';

describe('UnreadMessageListPage', () => {
  let component: UnreadMessageListPage;
  let fixture: ComponentFixture<UnreadMessageListPage>;
  let instantMessageService: jasmine.SpyObj<InstantMessageService>;
  let noticeService: jasmine.SpyObj<NoticeService>;
  let router: Router;
  let toastController: jasmine.SpyObj<ToastController>;
  let notices: Array<Notice>;

  beforeEach(async(() => {
    instantMessageService = jasmine.createSpyObj('InstantMessageService', [
      'getUnReadMessage',
      'getUnReadMessage1'
    ]);
    noticeService = jasmine.createSpyObj('NoticeService', ['getUnreadCount', 'getNoticeList']);
    toastController = jasmine.createSpyObj('ToastController', ['create']);
    notices = [
      { NoticeId: 1, Title: '公告1', Summary: '摘要1', CreateAt: '2026-05-28', IsRead: false },
      { NoticeId: 2, Title: '公告2', Summary: '摘要2', CreateAt: '2026-05-27', IsRead: true },
      { NoticeId: 3, Title: '公告3', Summary: '摘要3', CreateAt: '2026-05-26', IsRead: false },
      { NoticeId: 4, Title: '公告4', Summary: '摘要4', CreateAt: '2026-05-25', IsRead: true }
    ];

    instantMessageService.getUnReadMessage.and.returnValue(of({ Count1: 3, Count2: 2 }));
    instantMessageService.getUnReadMessage1.and.returnValue(of({ Count1: 1, Count2: 0 }));
    noticeService.getUnreadCount.and.returnValue(of(4));
    noticeService.getNoticeList.and.returnValue(of(notices));
    toastController.create.and.returnValue(Promise.resolve({
      present: jasmine.createSpy('present')
    } as unknown as HTMLIonToastElement));

    TestBed.configureTestingModule({
      imports: [RouterTestingModule, FormsModule, ReactiveFormsModule, IonicModule.forRoot()],
      providers: [
        CookieService,
        { provide: InstantMessageService, useValue: instantMessageService },
        { provide: NoticeService, useValue: noticeService },
        { provide: ToastController, useValue: toastController }
      ],
      declarations: [ UnreadMessageListPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UnreadMessageListPage);
    component = fixture.componentInstance;
    router = TestBed.get(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads instant message counts, notice unread count, and recent notices on init', () => {
    expect(instantMessageService.getUnReadMessage).toHaveBeenCalled();
    expect(noticeService.getUnreadCount).toHaveBeenCalled();
    expect(noticeService.getNoticeList).toHaveBeenCalledWith(1);
    expect(component.getConsultUnreadCount()).toBe(2);
    expect(component.getWaybillUnreadCount()).toBe(3);
    expect(component.noticeUnreadCount).toBe(4);
    expect(component.totalUnreadCount).toBe(9);
    expect(component.recentNotices.length).toBe(3);
    expect(component.recentNotices[0].NoticeId).toBe(1);
  });

  it('opens consultation chat when consultation has no unread messages', () => {
    spyOn(router, 'navigate');
    component.data = { Count1: 1, Count2: 0 };

    component.detail(0);

    expect(router.navigate).toHaveBeenCalledWith(['/member', 'chat', 0]);
    expect(toastController.create).not.toHaveBeenCalled();
  });

  it('shows a toast when waybill messages have no unread messages', () => {
    component.data = { Count1: 0, Count2: 1 };

    component.detail(1);

    expect(toastController.create).toHaveBeenCalledWith(jasmine.objectContaining({
      message: '暂无未读消息'
    }));
  });

  it('opens notice list from the business notice entry', () => {
    spyOn(router, 'navigateByUrl');

    component.openNoticeList();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/member/notice-list');
  });

  it('opens notice detail from a recent notice preview', () => {
    spyOn(router, 'navigateByUrl');

    component.openNoticeDetail(notices[1]);

    expect(router.navigateByUrl).toHaveBeenCalledWith('/member/notice-detail/2');
  });

  it('opens message subscription from the settings entry', () => {
    spyOn(router, 'navigateByUrl');

    component.openMessageSubscription();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/member/message-subscription/list');
  });

  it('refreshes message center data and completes refresher', () => {
    const complete = jasmine.createSpy('complete');
    const event = { target: { complete } } as unknown as CustomEvent;

    component.refresh(event);

    expect(instantMessageService.getUnReadMessage).toHaveBeenCalledTimes(2);
    expect(noticeService.getUnreadCount).toHaveBeenCalledTimes(2);
    expect(noticeService.getNoticeList).toHaveBeenCalledTimes(2);
    expect(complete).toHaveBeenCalled();
    expect(component.isRefreshing).toBe(false);
  });

  it('sets error state when message center loading fails', () => {
    instantMessageService.getUnReadMessage.and.returnValue(throwError('network error'));

    component.retryLoad();

    expect(component.loadError).toBe(true);
    expect(component.isLoading).toBe(false);
  });
});
