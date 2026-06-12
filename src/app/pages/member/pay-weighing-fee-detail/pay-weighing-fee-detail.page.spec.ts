import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AlertController, IonicModule, LoadingController, NavController, ToastController } from '@ionic/angular';
import { of, Subject, throwError } from 'rxjs';

import { PayWeighingFeeDetailPage } from './pay-weighing-fee-detail.page';
import { WeightBillService } from 'src/app/providers/weight-bill.service';
import { SignalR } from 'src/app/providers/signal-r.service';

describe('PayWeighingFeeDetailPage', () => {
  let component: PayWeighingFeeDetailPage;
  let fixture: ComponentFixture<PayWeighingFeeDetailPage>;
  let messageReceived$: Subject<any>;

  const loadingPresentSpy = jasmine.createSpy('loadingPresent').and.returnValue(Promise.resolve());
  const loadingDismissSpy = jasmine.createSpy('loadingDismiss').and.returnValue(Promise.resolve());
  const toastCreateSpy = jasmine.createSpy('toastCreate').and.returnValue(Promise.resolve({ present: () => Promise.resolve() }));
  const alertCreateSpy = jasmine.createSpy('alertCreate').and.returnValue(Promise.resolve({ present: () => Promise.resolve() }));

  const getWeightBillSpy = jasmine.createSpy('getWeightBill').and.returnValue(of({ Amount: 88 }));
  const payWeighingFeeSpy = jasmine.createSpy('payWeighingFee').and.returnValue(of({ Success: true, Data: '{"timeStamp":"1"}' }));

  const mockSignalRConnection = {
    status: new Subject<any>(),
    start: () => Promise.resolve({
      listenFor: (eventName: string) => eventName === 'messageReceived' ? messageReceived$ : of({})
    }),
    stop: jasmine.createSpy('stop')
  };
  const mockSignalR = {
    createConnection: () => mockSignalRConnection
  };
  const mockRoute = {
    snapshot: {
      paramMap: {
        get: () => '100'
      }
    }
  };
  const mockWeightBillService = {
    getWeightBill: getWeightBillSpy,
    payWeighingFee: payWeighingFeeSpy
  };
  const mockNavCtrl = {
    navigateForward: jasmine.createSpy('navigateForward'),
    back: jasmine.createSpy('back')
  };

  beforeEach(async(() => {
    messageReceived$ = new Subject<any>();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule, FormsModule, ReactiveFormsModule, IonicModule.forRoot()],
      providers: [
        { provide: ActivatedRoute, useValue: mockRoute },
        {
          provide: LoadingController,
          useValue: {
            create: () => Promise.resolve({ present: loadingPresentSpy, dismiss: loadingDismissSpy }),
            dismiss: loadingDismissSpy
          }
        },
        { provide: WeightBillService, useValue: mockWeightBillService },
        { provide: ToastController, useValue: { create: toastCreateSpy } },
        { provide: NavController, useValue: mockNavCtrl },
        { provide: AlertController, useValue: { create: alertCreateSpy } },
        { provide: SignalR, useValue: mockSignalR }
      ],
      declarations: [ PayWeighingFeeDetailPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PayWeighingFeeDetailPage);
    component = fixture.componentInstance;
    getWeightBillSpy.calls.reset();
    getWeightBillSpy.and.returnValue(of({ Amount: 88 }));
    payWeighingFeeSpy.calls.reset();
    payWeighingFeeSpy.and.returnValue(of({ Success: true, Data: '{"timeStamp":"1"}' }));
    toastCreateSpy.calls.reset();
    alertCreateSpy.calls.reset();
    mockNavCtrl.navigateForward.calls.reset();
    mockNavCtrl.back.calls.reset();
    mockSignalRConnection.stop.calls.reset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load weight bill data on init', fakeAsync(() => {
    component.ngOnInit();
    tick();

    expect(getWeightBillSpy).toHaveBeenCalledWith('100');
    expect(component.weightBill.Amount).toBe(88);
    expect(component.signalRConnected).toBe(true);
  }));

  it('should ignore malformed signalr message without throwing', fakeAsync(() => {
    component.ngOnInit();
    tick();

    expect(() => messageReceived$.next('{bad-json')).not.toThrow();
    expect(alertCreateSpy).not.toHaveBeenCalled();
  }));

  it('should call pay api and invoke js bridge callback on success', fakeAsync(() => {
    spyOn(component, 'callpay');
    component.isMiniProgram = false;

    component.payByJsApi();
    tick();

    expect(payWeighingFeeSpy).toHaveBeenCalled();
    expect(component.weightBill.TradeType).toBe('JSAPI');
    expect(component.callpay).toHaveBeenCalled();
  }));

  it('should navigate through mini program branch without calling api', () => {
    const miniNavigateSpy = jasmine.createSpy('miniNavigateTo');
    (globalThis as any).wx = { miniProgram: { navigateTo: miniNavigateSpy } };
    component.isMiniProgram = true;

    component.payByJsApi();

    expect(component.weightBill.TradeType).toBe('MAPP1');
    expect(miniNavigateSpy).toHaveBeenCalled();
    expect(payWeighingFeeSpy).not.toHaveBeenCalled();
  });

  it('should show toast and navigate back when load data fails', fakeAsync(() => {
    getWeightBillSpy.and.returnValue(throwError(() => new Error('network')));

    component.loadData();
    tick();

    expect(component.isLoading).toBe(false);
    expect(toastCreateSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({
        position: 'middle',
        duration: 2000,
      })
    );
    expect(mockNavCtrl.back).toHaveBeenCalled();
  }));

  it('should show toast when pay api returns failure', fakeAsync(() => {
    payWeighingFeeSpy.and.returnValue(of({ Success: false, ErrMsg: '支付失败' }));
    component.isMiniProgram = false;

    component.payByJsApi();
    tick();

    expect(component.weightBill.TradeType).toBe('JSAPI');
    expect(toastCreateSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({
        message: '支付失败',
        position: 'middle',
        duration: 3000,
      })
    );
  }));

  it('should show toast when pay api request errors', fakeAsync(() => {
    payWeighingFeeSpy.and.returnValue(throwError(() => new Error('network down')));
    component.isMiniProgram = false;

    component.payByJsApi();
    tick();

    expect(toastCreateSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({
        message: 'network down',
        position: 'middle',
        duration: 3000,
      })
    );
  }));

  it('should prompt and navigate to result when signalr reports payment success', fakeAsync(() => {
    component.ngOnInit();
    tick();

    messageReceived$.next(JSON.stringify({ MsgContent: 'True' }));
    tick();
    const alertConfig = alertCreateSpy.calls.mostRecent().args[0];
    alertConfig.buttons[0].handler();

    expect(alertCreateSpy).toHaveBeenCalled();
    expect(mockNavCtrl.navigateForward).toHaveBeenCalledWith(
      '/member/pay-weighing-fee/result/100',
      {
        queryParams: {
          ObjectId: '100',
          IsAskPrint: true,
        },
      }
    );
  }));

  it('should stop signalr connection on destroy', () => {
    component.signalRConnection = mockSignalRConnection as any;

    component.ngOnDestroy();

    expect(mockSignalRConnection.stop).toHaveBeenCalled();
  });
});
