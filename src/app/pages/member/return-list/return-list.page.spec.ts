import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AlertController, IonicModule } from '@ionic/angular';
import { of, Subject, throwError } from 'rxjs';

import { ReturnListPage } from './return-list.page';
import { ReturnService } from 'src/app/providers/return.service';
import { UiFeedbackService } from 'src/app/providers/ui-feedback.service';

describe('ReturnListPage', () => {
  let component: ReturnListPage;
  let fixture: ComponentFixture<ReturnListPage>;
  let router: Router;

  const getList1Spy = jasmine.createSpy('getList1').and.returnValue(of([]));
  const getList2Spy = jasmine.createSpy('getList2').and.returnValue(of([]));
  const getWaitReturnListSpy = jasmine.createSpy('getWaitReturnList').and.returnValue(of([]));
  const updateMobilePhoneSpy = jasmine.createSpy('updateMobilePhone').and.returnValue(of(''));
  const resetPickupCodeSpy = jasmine.createSpy('resetPickupCode').and.returnValue(of(''));
  const terminateSpy = jasmine.createSpy('terminate').and.returnValue(of({ Success: true }));
  const alertCreateSpy = jasmine.createSpy('alertCreate').and.returnValue(Promise.resolve({ present: () => Promise.resolve() }));
  const toastSpy = jasmine.createSpy('presentToast').and.returnValue(Promise.resolve());

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, IonicModule.forRoot()],
      providers: [
        {
          provide: ReturnService,
          useValue: {
            getList1: getList1Spy,
            getList2: getList2Spy,
            getWaitReturnList: getWaitReturnListSpy,
            updateMobilePhone: updateMobilePhoneSpy,
            resetPickupCode: resetPickupCodeSpy,
            terminate: terminateSpy,
          },
        },
        { provide: AlertController, useValue: { create: alertCreateSpy } },
        { provide: UiFeedbackService, useValue: { presentToast: toastSpy } },
      ],
      declarations: [ReturnListPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReturnListPage);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    getList1Spy.calls.reset();
    getList1Spy.and.returnValue(of([]));
    getList2Spy.calls.reset();
    getList2Spy.and.returnValue(of([]));
    getWaitReturnListSpy.calls.reset();
    getWaitReturnListSpy.and.returnValue(of([]));
    updateMobilePhoneSpy.calls.reset();
    updateMobilePhoneSpy.and.returnValue(of(''));
    resetPickupCodeSpy.calls.reset();
    resetPickupCodeSpy.and.returnValue(of(''));
    terminateSpy.calls.reset();
    terminateSpy.and.returnValue(of({ Success: true }));
    alertCreateSpy.calls.reset();
    toastSpy.calls.reset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose tab-specific search placeholders', () => {
    expect(component.activeSearchPlaceholder).toBe('搜索退货中：单号 / 手机号 / 取件码');
    expect(component.activeSearchAriaLabel).toBe('搜索退货中记录');

    component.activeTab = 'completed';

    expect(component.activeSearchPlaceholder).toBe('搜索已完成退货：原单号 / 转单号 / 国家 / 渠道');
    expect(component.activeSearchAriaLabel).toBe('搜索已完成退货');
  });

  it('should show skeleton while ongoing list initializes', () => {
    const pendingOngoing$ = new Subject<any[]>();
    getList2Spy.and.returnValue(pendingOngoing$.asObservable());

    fixture.detectChanges();

    expect(component.showOngoingSkeleton).toBe(true);
    expect(fixture.nativeElement.querySelectorAll('.skeleton-card').length).toBeGreaterThan(0);
    expect(fixture.nativeElement.querySelector('.ongoing-skeleton-card .skeleton-status')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.ongoing-skeleton-card .skeleton-pickup-section')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.ongoing-skeleton-card .skeleton-code')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.ongoing-skeleton-card .skeleton-copy-action')).toBeTruthy();
  });

  it('should show skeleton matching completed card layout', () => {
    const pendingCompleted$ = new Subject<any[]>();
    getList1Spy.and.returnValue(pendingCompleted$.asObservable());
    component.activeTab = 'completed';

    fixture.detectChanges();

    expect(component.showCompletedSkeleton).toBe(true);
    expect(fixture.nativeElement.querySelector('.completed-skeleton-card .skeleton-country-badge')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.completed-skeleton-card .skeleton-channel')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.completed-skeleton-card .skeleton-amount')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.completed-skeleton-card .skeleton-detail-button')).toBeTruthy();
  });

  it('should load and normalize ongoing reference numbers', () => {
    getList2Spy.and.returnValue(of([
      { ObjectId: 10, ReferenceNumber: '1_REF-100,2_REF-200' },
    ]));

    fixture.detectChanges();

    expect(component.ongoingItems.length).toBe(1);
    expect(component.ongoingItems[0].displayReferenceNumber).toBe('REF-100, REF-200');
    expect(component.isOngoingLoaded).toBe(true);
  });

  it('should enter ongoing error state when ongoing list fails', () => {
    getList2Spy.and.returnValue(throwError(() => new Error('network')));

    fixture.detectChanges();

    expect(component.ongoingLoadError).toBe(true);
    expect(component.isOngoingLoaded).toBe(true);
    expect(component.ongoingItems.length).toBe(0);
  });

  it('should load completed first page', () => {
    getList1Spy.and.returnValue(of([
      { Id: 7, ReferenceNumber: 'REF-7', TrackNumber: 'TRK-7', Amount: '12.00' },
    ]));

    fixture.detectChanges();

    expect(getList1Spy).toHaveBeenCalledWith(1, '');
    expect(component.completedItems.length).toBe(1);
    expect(component.completedItems[0].ReferenceNumber).toBe('REF-7');
  });

  it('should append completed records when infinite scroll loads more', () => {
    const firstPage = Array.from({ length: 10 }).map((_, index) => ({
      Id: index + 1,
      ReferenceNumber: `REF-${index + 1}`,
    }));
    getList1Spy.and.returnValues(
      of(firstPage),
      of([{ Id: 11, ReferenceNumber: 'REF-11' }])
    );
    const complete = jasmine.createSpy('complete');

    fixture.detectChanges();
    component.scrollCompleted({ target: { complete } } as any);

    expect(getList1Spy).toHaveBeenCalledWith(2, '');
    expect(component.completedItems.length).toBe(11);
    expect(component.completedHasMore).toBe(false);
    expect(complete).toHaveBeenCalled();
  });

  it('should enter completed error state when completed list fails', () => {
    getList1Spy.and.returnValue(throwError(() => new Error('network')));

    fixture.detectChanges();

    expect(component.completedLoadError).toBe(true);
    expect(component.isCompletedLoaded).toBe(true);
  });

  it('should debounce completed search and reset to first page', fakeAsync(() => {
    fixture.detectChanges();
    getList1Spy.calls.reset();
    component.completedPageIndex = 4;
    component.activeTab = 'completed';

    component.onSearchInput({ detail: { value: ' REF ' } } as CustomEvent);
    tick(280);

    expect(component.completedPageIndex).toBe(2);
    expect(getList1Spy).toHaveBeenCalledWith(1, 'REF');
  }));

  it('should cancel pending completed search when search is cleared', fakeAsync(() => {
    fixture.detectChanges();
    component.activeTab = 'completed';
    getList1Spy.calls.reset();

    component.onSearchInput({ detail: { value: 'REF' } } as CustomEvent);
    component.clearSearch();
    tick(280);

    expect(getList1Spy).toHaveBeenCalledTimes(1);
    expect(getList1Spy).toHaveBeenCalledWith(1, '');
  }));

  it('should filter ongoing records by pickup code', () => {
    getList2Spy.and.returnValue(of([
      { ObjectId: 10, ReferenceNumber: '1_REF-100', MobilePhone: '13900000000' },
      { ObjectId: 11, ReferenceNumber: '2_REF-200', MobilePhone: '13811112222', PickupCode: 'PICK-8' },
    ]));

    fixture.detectChanges();
    component.onSearchInput({ detail: { value: 'pick' } } as CustomEvent);

    expect(component.ongoingSearchKeyword).toBe('pick');
    expect(component.allOngoingItems.length).toBe(2);
    expect(component.ongoingItems.length).toBe(1);
    expect(component.ongoingItems[0].ObjectId).toBe(11);
    expect(getList2Spy).toHaveBeenCalledTimes(1);
  });

  it('should filter ongoing records by mobile phone', () => {
    getList2Spy.and.returnValue(of([
      { ObjectId: 10, ReferenceNumber: '1_REF-100', MobilePhone: '13900000000' },
      { ObjectId: 11, ReferenceNumber: '2_REF-200', MobilePhone: '13811112222', PickupCode: 'PICK-8' },
    ]));

    fixture.detectChanges();
    component.onSearchInput({ detail: { value: '13811112222' } } as CustomEvent);

    expect(component.ongoingItems.length).toBe(1);
    expect(component.ongoingItems[0].ObjectId).toBe(11);
    expect(getList2Spy).toHaveBeenCalledTimes(1);
  });

  it('should validate mobile number before saving', () => {
    component.openMobileEdit({ ObjectId: 9, ReferenceNumber: 'REF-9', MobilePhone: '13900000000', PickupCode: '388753' });
    component.mobileDraft = '123';

    component.submitMobilePhone();

    expect(component.mobileEditError).toBe('请输入中国大陆手机号码');
    expect(updateMobilePhoneSpy).not.toHaveBeenCalled();
  });

  it('should show mobile validation while editing', () => {
    component.openMobileEdit({ ObjectId: 9, ReferenceNumber: 'REF-9', MobilePhone: '13900000000', PickupCode: '388753' });

    component.onMobileDraftInput({ detail: { value: '123' } } as CustomEvent);

    expect(component.mobileEditError).toBe('请输入中国大陆手机号码');
    expect(component.canSaveMobilePhone).toBe(false);
  });

  it('should reject mobile number with country code before saving', () => {
    component.openMobileEdit({ ObjectId: 9, ReferenceNumber: 'REF-9', MobilePhone: '13900000000', PickupCode: '388753' });
    component.mobileDraft = '+8613811112222';

    component.submitMobilePhone();

    expect(component.mobileEditError).toBe('请输入中国大陆手机号码');
    expect(updateMobilePhoneSpy).not.toHaveBeenCalled();
  });

  it('should allow mobile edit before pickup code is generated', () => {
    component.openMobileEdit({ ObjectId: 9, ReferenceNumber: 'REF-9', MobilePhone: '13900000000' });

    expect(component.isMobileEditOpen).toBe(true);
    expect(component.mobileDraft).toBe('13900000000');
    expect(toastSpy).not.toHaveBeenCalled();
  });

  it('should update mobile phone when save succeeds', () => {
    const item = { ObjectId: 9, ReferenceNumber: 'REF-9', MobilePhone: '13900000000', PickupCode: '388753', ExpiredTime: '2999-01-01 00:00:00', PickupCodeResendRequired: false, CanResetPickupCode: false };
    component.openMobileEdit(item);
    component.mobileDraft = '13811112222';

    component.submitMobilePhone();

    expect(updateMobilePhoneSpy).toHaveBeenCalledWith(9, '13811112222');
    expect(item.MobilePhone).toBe('13811112222');
    expect(item.ExpiredTime).toBe('2999-01-01 00:00:00');
    expect(item.PickupCodeResendRequired).toBe(true);
    expect(item.CanResetPickupCode).toBe(true);
    expect(component.isMobileEditOpen).toBe(false);
  });

  it('should surface server validation message when mobile update fails logically', () => {
    updateMobilePhoneSpy.and.returnValue(of('手机号已被占用'));
    component.openMobileEdit({ ObjectId: 9, ReferenceNumber: 'REF-9', MobilePhone: '13900000000', PickupCode: '388753' });
    component.mobileDraft = '13811112222';

    component.submitMobilePhone();

    expect(component.mobileEditError).toBe('手机号已被占用');
    expect(component.isMobileEditOpen).toBe(true);
  });

  it('should surface server validation message from action result object', () => {
    updateMobilePhoneSpy.and.returnValue(of({ Success: false, ErrMsg: '手机号码格式不对' }));
    component.openMobileEdit({ ObjectId: 9, ReferenceNumber: 'REF-9', MobilePhone: '13900000000', PickupCode: '388753' });
    component.mobileDraft = '13811112222';

    component.submitMobilePhone();

    expect(component.mobileEditError).toBe('手机号码格式不对');
    expect(component.isMobileEditOpen).toBe(true);
  });

  it('should treat successful action result object as saved', () => {
    const item = { ObjectId: 9, ReferenceNumber: 'REF-9', MobilePhone: '13900000000', PickupCode: '388753' };
    updateMobilePhoneSpy.and.returnValue(of({ Success: true }));
    component.openMobileEdit(item);
    component.mobileDraft = '13811112222';

    component.submitMobilePhone();

    expect(item.MobilePhone).toBe('13811112222');
    expect(component.isMobileEditOpen).toBe(false);
  });

  it('should copy pickup code to clipboard', async () => {
    const writeText = jasmine.createSpy('writeText').and.returnValue(Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    try {
      await component.copyPickupCode({
        ObjectId: 9,
        ReferenceNumber: 'REF-9',
        PickupCode: ' 388753 ',
      });
    } finally {
      delete (navigator as any).clipboard;
    }

    expect(writeText).toHaveBeenCalledWith('388753');
    expect(toastSpy).toHaveBeenCalledWith('取件码已复制', 1800, 'middle', undefined, 'success');
  });

  it('should show a toast when pickup code is empty', async () => {
    await component.copyPickupCode({
      ObjectId: 9,
      ReferenceNumber: 'REF-9',
      PickupCode: ' ',
    });

    expect(toastSpy).toHaveBeenCalledWith('暂无可复制取件码', 1800, 'middle', undefined, 'medium');
  });

  it('should show danger toast when copy fallback fails', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
    });
    spyOn(document, 'execCommand').and.returnValue(false);

    try {
      await component.copyPickupCode({
        ObjectId: 9,
        ReferenceNumber: 'REF-9',
        PickupCode: '388753',
      });
    } finally {
      delete (navigator as any).clipboard;
    }

    expect(toastSpy).toHaveBeenCalledWith('复制失败，请长按取件码复制', 1800, 'middle', undefined, 'danger');
  });

  it('should resend pickup code and reload ongoing list when pickup code is expired', () => {
    const item = {
      ObjectId: 9,
      ReferenceNumber: 'REF-9',
      PickupCode: '388753',
      ExpiredTime: '2000-01-01 00:00:00'
    };
    fixture.detectChanges();
    getList2Spy.calls.reset();

    component.resetPickupCode(item);

    expect(resetPickupCodeSpy).toHaveBeenCalledWith(9);
    expect(getList2Spy).toHaveBeenCalled();
    expect(component.mutatingObjectId).toBeNull();
  });

  it('should resend pickup code after mobile phone is changed', () => {
    const item = {
      ObjectId: 9,
      ReferenceNumber: 'REF-9',
      PickupCode: '388753',
      ExpiredTime: '2999-01-01 00:00:00',
      PickupCodeResendRequired: true,
      CanResetPickupCode: true
    };
    fixture.detectChanges();
    getList2Spy.calls.reset();

    component.resetPickupCode(item);

    expect(resetPickupCodeSpy).toHaveBeenCalledWith(9);
    expect(getList2Spy).toHaveBeenCalled();
  });

  it('should block reset pickup code while pickup code is still valid', () => {
    component.resetPickupCode({
      ObjectId: 9,
      ReferenceNumber: 'REF-9',
      PickupCode: '388753',
      ExpiredTime: '2999-01-01 00:00:00',
      CanResetPickupCode: false,
      ResetPickupCodeMessage: '当前取件码仍在有效期内。'
    });

    expect(resetPickupCodeSpy).not.toHaveBeenCalled();
    expect(alertCreateSpy).toHaveBeenCalled();
  });

  it('should skip reset pickup code before pickup code is generated', () => {
    component.resetPickupCode({
      ObjectId: 9,
      ReferenceNumber: 'REF-9',
      ExpiredTime: '2000-01-01 00:00:00'
    });

    expect(resetPickupCodeSpy).not.toHaveBeenCalled();
  });

  it('should cancel apply after confirmation', async () => {
    const item = { ObjectId: 9, ReferenceNumber: 'REF-9' };

    await component.cancelApply(item);
    const alertConfig = alertCreateSpy.calls.mostRecent().args[0];
    alertConfig.buttons[1].handler();

    expect(terminateSpy).toHaveBeenCalledWith(9);
    expect(toastSpy).toHaveBeenCalledWith('退货申请已取消', 1800, 'middle', undefined, undefined);
  });

  it('should navigate to waiting list from overview action', () => {
    component.goWaitingList();

    expect(router.navigate).toHaveBeenCalledWith(['/member/return-waiting']);
  });
});
