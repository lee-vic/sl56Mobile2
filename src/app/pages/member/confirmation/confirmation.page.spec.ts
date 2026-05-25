import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AlertController, IonicModule, LoadingController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { of } from 'rxjs';

import { ConfirmationPage } from './confirmation.page';
import { ConfirmationService } from 'src/app/providers/confirmation.service';

describe('ConfirmationPage', () => {
  let component: ConfirmationPage;
  let fixture: ComponentFixture<ConfirmationPage>;
  let router: Router;

  const confirmSpy = jasmine.createSpy('confirm').and.returnValue(of([]));
  const getReceiveGoodsDetailListSpy = jasmine
    .createSpy('getReceiveGoodsDetailList')
    .and.returnValue(of([]));

  const toastCreateSpy = jasmine
    .createSpy('toastCreate')
    .and.returnValue(Promise.resolve({ present: () => Promise.resolve() }));
  const alertCreateSpy = jasmine
    .createSpy('alertCreate')
    .and.returnValue(Promise.resolve({ present: () => Promise.resolve() }));
  const loadingPresentSpy = jasmine
    .createSpy('loadingPresent')
    .and.returnValue(Promise.resolve());
  const loadingDismissSpy = jasmine
    .createSpy('loadingDismiss')
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
        { provide: ToastController, useValue: { create: toastCreateSpy } },
        { provide: AlertController, useValue: { create: alertCreateSpy } },
        {
          provide: LoadingController,
          useValue: {
            create: () => Promise.resolve({ present: loadingPresentSpy }),
            dismiss: loadingDismissSpy,
          },
        },
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
    toastCreateSpy.calls.reset();
    alertCreateSpy.calls.reset();
    loadingDismissSpy.calls.reset();
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

  it('should filter receive goods list by reference number', () => {
    component.receiveGoodsDetailList = [
      { Id: 1, ReferenceNumber: 'ABC123' },
      { Id: 2, ReferenceNumber: 'XYZ999' },
    ] as any;
    component.searchList = component.receiveGoodsDetailList;

    component.getItems({ target: { value: 'abc' } });

    expect(component.searchList.length).toBe(1);
    expect(component.searchList[0].ReferenceNumber).toBe('ABC123');
  });

  it('should show toast when no item is selected before confirmation', fakeAsync(() => {
    component.receiveGoodsDetailList = [
      { Id: 1, Selected: false },
      { Id: 2, Selected: false },
    ] as any;

    component.onConfirmClick();
    tick();

    expect(toastCreateSpy).toHaveBeenCalled();
    expect(alertCreateSpy).not.toHaveBeenCalled();
  }));

  it('should update list after confirm request succeeds', fakeAsync(() => {
    const resultList = [{ Id: 99, ReferenceNumber: 'DONE' }];
    confirmSpy.and.returnValue(of(resultList as any));

    component.doConfirm('1,2');
    tick();

    expect(confirmSpy).toHaveBeenCalledWith('1,2');
    expect(component.receiveGoodsDetailList).toEqual(resultList as any);
    expect(component.searchList).toEqual(resultList as any);
    expect(loadingDismissSpy).toHaveBeenCalled();
  }));

  it('should navigate to delivery record detail', () => {
    component.detail({ Id: 10 });
    expect(router.navigate).toHaveBeenCalledWith(['/member/delivery-record/detail', 10]);
  });
});
