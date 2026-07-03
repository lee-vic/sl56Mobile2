import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { of, Subject, throwError } from 'rxjs';
import { NoticeService } from 'src/app/providers/notice.service';
import { UiFeedbackService } from 'src/app/providers/ui-feedback.service';

import { NoticeListPage } from './notice-list.page';

describe('NoticeListPage', () => {
  let component: NoticeListPage;
  let fixture: ComponentFixture<NoticeListPage>;
  let getNoticeListSpy: jasmine.Spy;
  let navigateForwardSpy: jasmine.Spy;
  let toastSpy: jasmine.Spy;

  beforeEach(async(() => {
    getNoticeListSpy = jasmine.createSpy('getNoticeList').and.returnValue(of([]));
    navigateForwardSpy = jasmine.createSpy('navigateForward').and.returnValue(Promise.resolve(true));
    toastSpy = jasmine.createSpy('presentToast').and.returnValue(Promise.resolve());

    TestBed.configureTestingModule({
      imports: [RouterTestingModule, FormsModule, ReactiveFormsModule, IonicModule.forRoot()],
      providers: [
        { provide: NoticeService, useValue: { getNoticeList: getNoticeListSpy } },
        { provide: NavController, useValue: { navigateForward: navigateForwardSpy } },
        { provide: UiFeedbackService, useValue: { presentToast: toastSpy } },
      ],
      declarations: [ NoticeListPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NoticeListPage);
    component = fixture.componentInstance;
    getNoticeListSpy.calls.reset();
    getNoticeListSpy.and.returnValue(of([]));
    navigateForwardSpy.calls.reset();
    toastSpy.calls.reset();
  });

  it('should create', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('should show skeleton while first page is loading', () => {
    const pending$ = new Subject<unknown[]>();
    getNoticeListSpy.and.returnValue(pending$.asObservable());

    fixture.detectChanges();

    expect(component.isInitialLoading).toBe(true);
    expect(fixture.nativeElement.querySelectorAll('.skeleton-card').length).toBeGreaterThan(0);
  });

  it('should load notice cards and advance page index', () => {
    getNoticeListSpy.and.returnValue(of([
      { NoticeId: 1, Title: '业务调整', Summary: '内容', CreateAt: '2026-07-01', IsRead: false },
      { NoticeId: 2, Title: '渠道通知', Summary: '内容', CreateAt: '2026-07-02', IsRead: true },
    ]));

    fixture.detectChanges();

    expect(component.items.length).toBe(2);
    expect(component.currentPageIndex).toBe(1);
    expect(component.isLoaded).toBe(true);
  });

  it('should append next page when infinite scroll fires', () => {
    const firstPage = Array.from({ length: 10 }).map((_, index) => ({
      NoticeId: index + 1,
      Title: `公告${index + 1}`,
      Summary: '内容',
      CreateAt: '2026-07-01',
      IsRead: false,
    }));
    getNoticeListSpy.and.returnValues(
      of(firstPage),
      of([{ NoticeId: 11, Title: '公告11', Summary: '内容', CreateAt: '2026-07-02', IsRead: false }])
    );
    const complete = jasmine.createSpy('complete');

    fixture.detectChanges();
    component.getItems({ target: { complete } } as unknown as CustomEvent);

    expect(getNoticeListSpy).toHaveBeenCalledWith(2);
    expect(component.items.length).toBe(11);
    expect(complete).toHaveBeenCalled();
  });

  it('should enter error state when loading fails', () => {
    getNoticeListSpy.and.returnValue(throwError(() => new Error('network')));

    fixture.detectChanges();

    expect(component.loadError).toBe(true);
    expect(component.isLoaded).toBe(true);
    expect(toastSpy).toHaveBeenCalledWith('业务公告加载失败，请稍后重试', 2200, 'middle', undefined, 'danger');
  });

  it('should mark notice as read and navigate to detail', () => {
    const item = { NoticeId: 9, Title: '业务调整', Summary: '内容', CreateAt: '2026-07-01', IsRead: false };

    component.openDetail(item);

    expect(item.IsRead).toBe(true);
    expect(navigateForwardSpy).toHaveBeenCalledWith('/member/notice-detail/9');
  });
});
