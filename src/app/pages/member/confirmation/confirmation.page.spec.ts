import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AlertController, IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { of, Subject, throwError } from 'rxjs';

import { ConfirmationPage } from './confirmation.page';
import { ConfirmationService } from 'src/app/providers/confirmation.service';
import { UiFeedbackService } from 'src/app/providers/ui-feedback.service';

describe('ConfirmationPage', () => {
  let component: ConfirmationPage;
  let fixture: ComponentFixture<ConfirmationPage>;
  let router: Router;

  const confirmSpy = jasmine.createSpy('confirm').and.returnValue(of([]));
  const getReceiveGoodsDetailListSpy = jasmine
    .createSpy('getReceiveGoodsDetailList')
    .and.returnValue(of([]));

  const alertCreateSpy = jasmine
    .createSpy('alertCreate')
    .and.returnValue(Promise.resolve({ present: () => Promise.resolve() }));
  const presentToastSpy = jasmine
    .createSpy('presentToast')
    .and.returnValue(Promise.resolve());

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule, FormsModule, ReactiveFormsModule, IonicModule.forRoot()],
      providers: [
        CookieService,
        {
          provide: ConfirmationService,
          useValue: {
            getReceiveGoodsDetailList: getReceiveGoodsDetailListSpy,
            confirm: confirmSpy,
          },
        },
        {
          provide: UiFeedbackService,
          useValue: {
            presentToast: presentToastSpy,
          },
        },
        { provide: AlertController, useValue: { create: alertCreateSpy } },
      ],
      declarations: [ ConfirmationPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmationPage);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    confirmSpy.calls.reset();
    getReceiveGoodsDetailListSpy.calls.reset();
    alertCreateSpy.calls.reset();
    presentToastSpy.calls.reset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should select all items when allSelected is true', () => {
    component.allSelected = true;
    component.searchList = [
      { Id: 1, Selected: false },
      { Id: 2, Selected: false },
    ] as any;

    component.onAllClick();

    expect(component.searchList.every((item) => item.Selected === true)).toBe(true);
  });

  it('should load list on init', () => {
    const list = [{ Id: 1, ReferenceNumber: 'A001', Selected: false }] as any;
    getReceiveGoodsDetailListSpy.and.returnValue(of(list));

    component.ngOnInit();

    expect(getReceiveGoodsDetailListSpy).toHaveBeenCalled();
    expect(component.receiveGoodsDetailList.length).toBe(1);
    expect(component.searchList.length).toBe(1);
    expect(component.isLoading).toBe(false);
  });

  it('should filter receive goods list by reference number', () => {
    component.receiveGoodsDetailList = [
      { Id: 1, ReferenceNumber: 'ABC123' },
      { Id: 2, ReferenceNumber: 'XYZ999' },
    ] as any;
    component.searchList = component.receiveGoodsDetailList;

    component.getItems({ detail: { value: 'abc' } } as CustomEvent);

    expect(component.searchList.length).toBe(1);
    expect(component.searchList[0].ReferenceNumber).toBe('ABC123');
  });

  it('should filter to selected items when segment changed', () => {
    component.receiveGoodsDetailList = [
      { Id: 1, ReferenceNumber: 'ABC123', Selected: true },
      { Id: 2, ReferenceNumber: 'XYZ999', Selected: false },
    ] as any;

    component.onFilterChange({ detail: { value: 'selected' } } as CustomEvent);

    expect(component.viewFilter).toBe('selected');
    expect(component.searchList.length).toBe(1);
    expect(component.searchList[0].Id).toBe(1);
  });

  it('should reset filters to all view', () => {
    component.receiveGoodsDetailList = [
      { Id: 1, ReferenceNumber: 'ABC123', Selected: true },
      { Id: 2, ReferenceNumber: 'XYZ999', Selected: false },
    ] as any;
    component.searchKeyword = 'abc';
    component.viewFilter = 'selected';

    component.resetFilters();

    expect(component.searchKeyword).toBe('');
    expect(component.viewFilter).toBe('all');
    expect(component.searchList.length).toBe(2);
  });

  it('should show toast when no item is selected before confirmation', fakeAsync(() => {
    component.receiveGoodsDetailList = [
      { Id: 1, Selected: false },
      { Id: 2, Selected: false },
    ] as any;

    component.onConfirmClick();
    tick();

    expect(presentToastSpy).toHaveBeenCalled();
    expect(alertCreateSpy).not.toHaveBeenCalled();
  }));

  it('should update list after confirm request succeeds', fakeAsync(() => {
    const resultList = [{ Id: 99, ReferenceNumber: 'DONE' }];
    confirmSpy.and.returnValue(of(resultList as any));

    component.doConfirm('1, 2,,');
    flushMicrotasks();
    tick();

    expect(confirmSpy).toHaveBeenCalledWith('1,2');
    expect(component.receiveGoodsDetailList).toEqual(resultList as any);
    expect(component.searchList).toEqual(resultList as any);

    tick(2000);
  }));

  it('should show error toast when confirm request fails', fakeAsync(() => {
    confirmSpy.and.returnValue(throwError(() => ({ message: '网络异常' })));

    component.doConfirm('3');
    flushMicrotasks();
    tick();

    expect(confirmSpy).toHaveBeenCalledWith('3');
    expect(presentToastSpy).toHaveBeenCalled();
    expect(component.isSubmitting).toBe(false);
  }));

  it('should show fallback error toast when confirm error has no message', fakeAsync(() => {
    confirmSpy.and.returnValue(throwError(() => ({})));

    component.doConfirm('3');
    flushMicrotasks();
    tick();

    expect(confirmSpy).toHaveBeenCalledWith('3');
    expect(presentToastSpy).toHaveBeenCalledWith('提交失败，请稍后重试', 2600, 'middle', 'member-theme-toast', 'danger');
    expect(component.isSubmitting).toBe(false);
  }));

  it('should complete refresher when load fails', () => {
    getReceiveGoodsDetailListSpy.and.returnValue(throwError(() => new Error('failed')));
    const completeSpy = jasmine.createSpy('complete');

    component.onRefresh({ detail: { complete: completeSpy } } as any);

    expect(completeSpy).toHaveBeenCalled();
    expect(component.isLoading).toBe(false);
    expect(presentToastSpy).toHaveBeenCalled();
  });

  it('should stop list loading subscription on destroy', () => {
    const loadingSubject = new Subject<any[]>();
    getReceiveGoodsDetailListSpy.and.returnValue(loadingSubject.asObservable());

    component.ngOnInit();
    expect(component.isLoading).toBe(true);

    component.ngOnDestroy();
    loadingSubject.next([{ Id: 1, ReferenceNumber: 'A001', Selected: false }] as any);

    expect(component.receiveGoodsDetailList.length).toBe(0);
    expect(component.isLoading).toBe(false);
  });

  it('should navigate to delivery record detail', () => {
    component.detail({ Id: 10 });
    expect(router.navigate).toHaveBeenCalledWith(['/member/delivery-record/detail', 10]);
  });

  it('should format amount safely', () => {
    expect(component.formatAmount(12.3)).toBe('12.30');
    expect(component.formatAmount('bad')).toBe('0.00');
    expect(component.formatAmount(null)).toBe('0.00');
  });

  it('should skip confirm request when submission is already in progress', () => {
    component.isSubmitting = true;

    component.doConfirm('1,2');

    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it('should navigate to member center', () => {
    spyOn(router, 'navigateByUrl');

    component.goMemberCenter();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/app/tabs/member');
  });
});
