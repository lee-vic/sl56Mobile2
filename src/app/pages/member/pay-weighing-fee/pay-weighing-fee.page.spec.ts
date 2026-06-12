import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  ActionSheetController,
  AlertController,
  IonicModule,
  LoadingController,
  NavController,
  ToastController,
} from '@ionic/angular';
import { CookieService } from 'ngx-cookie-service';
import { of, Subject, throwError } from 'rxjs';
import { Title } from '@angular/platform-browser';

import { PayWeighingFeePage } from './pay-weighing-fee.page';
import { WeightBillService } from 'src/app/providers/weight-bill.service';
import { SignalR } from 'src/app/providers/signal-r.service';

describe('PayWeighingFeePage', () => {
  let component: PayWeighingFeePage;
  let fixture: ComponentFixture<PayWeighingFeePage>;
  let messageReceived$: Subject<any>;

  const alertCreateSpy = jasmine
    .createSpy('alertCreate')
    .and.returnValue(Promise.resolve({ present: () => Promise.resolve() }));
  const loadingPresentSpy = jasmine
    .createSpy('loadingPresent')
    .and.returnValue(Promise.resolve());
  const loadingDismissSpy = jasmine
    .createSpy('loadingDismiss')
    .and.returnValue(Promise.resolve());
  const navNavigateForwardSpy = jasmine.createSpy('navigateForward');
  const actionSheetPresentSpy = jasmine.createSpy('sheetPresent').and.returnValue(Promise.resolve());
  const actionSheetCreateSpy = jasmine
    .createSpy('sheetCreate')
    .and.returnValue(Promise.resolve({ present: actionSheetPresentSpy }));

  const getWeightBillDefaultValueSpy = jasmine
    .createSpy('getWeightBillDefaultValue')
    .and.returnValue(of(null));
  const getHistoryVehicleNoSpy = jasmine.createSpy('getHistoryVehicleNo').and.returnValue(of([]));
  const getHistoryCorporateAccountSpy = jasmine.createSpy('getHistoryCorporateAccount').and.returnValue(of([]));
  const getInParkVehicleNoSpy = jasmine.createSpy('getInParkVehicleNo').and.returnValue(of([]));
  const startSpy = jasmine.createSpy('start').and.returnValue(of(true));

  const mockSignalRConnection = {
    status: new Subject<any>(),
    start: () => Promise.resolve({ listenFor: () => messageReceived$ }),
    stop: jasmine.createSpy('stop'),
    invoke: jasmine.createSpy('invoke').and.returnValue(Promise.resolve(true)),
  };

  const mockWeightBillService = {
    getWeightBillDefaultValue: getWeightBillDefaultValueSpy,
    getHistoryVehicleNo: getHistoryVehicleNoSpy,
    getHistoryCorporateAccount: getHistoryCorporateAccountSpy,
    getInParkVehicleNo: getInParkVehicleNoSpy,
    start: startSpy,
  };

  const mockSignalR = {
    createConnection: () => mockSignalRConnection,
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        FormsModule,
        ReactiveFormsModule,
        IonicModule.forRoot(),
      ],
      providers: [
        CookieService,
        { provide: WeightBillService, useValue: mockWeightBillService },
        { provide: SignalR, useValue: mockSignalR },
        { provide: NavController, useValue: { navigateForward: navNavigateForwardSpy } },
        {
          provide: LoadingController,
          useValue: {
            create: () => Promise.resolve({ present: loadingPresentSpy, dismiss: loadingDismissSpy }),
            dismiss: loadingDismissSpy,
          },
        },
        { provide: AlertController, useValue: { create: alertCreateSpy } },
        { provide: ToastController, useValue: { create: jasmine.createSpy('toastCreate') } },
        { provide: ActionSheetController, useValue: { create: actionSheetCreateSpy } },
        { provide: Title, useValue: { setTitle: jasmine.createSpy('setTitle') } },
      ],
      declarations: [PayWeighingFeePage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    messageReceived$ = new Subject<any>();
    fixture = TestBed.createComponent(PayWeighingFeePage);
    component = fixture.componentInstance;
    alertCreateSpy.calls.reset();
    actionSheetCreateSpy.calls.reset();
    actionSheetPresentSpy.calls.reset();
    navNavigateForwardSpy.calls.reset();
    startSpy.calls.reset();
    getWeightBillDefaultValueSpy.calls.reset();
    getHistoryVehicleNoSpy.calls.reset();
    getHistoryCorporateAccountSpy.calls.reset();
    getInParkVehicleNoSpy.calls.reset();
    loadingPresentSpy.calls.reset();
    loadingDismissSpy.calls.reset();
    mockSignalRConnection.invoke.calls.reset();
    mockSignalRConnection.stop.calls.reset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return false when form is invalid', () => {
    component.weightBillForm1.controls['vehicleNo'].setValue('');

    const result = component.validateweightBillForm1();

    expect(result).toBe(false);
    expect(component.weightBillForm1.controls['vehicleNo'].touched).toBe(true);
  });

  it('should show alert when weighing mode 0 has no tare weight', () => {
    component.weightBillForm1.patchValue({
      vehicleNo: '粤B12345',
      pricePerTon: 1,
      tareWeight: null,
    });
    component.data.WeighingMode = 0;
    component.data.TareWeight = null;

    component.start();

    expect(alertCreateSpy).toHaveBeenCalled();
    expect(startSpy).not.toHaveBeenCalled();
  });

  it('should show alert when weighing mode 3 has no return type', () => {
    component.weightBillForm1.patchValue({
      vehicleNo: '粤B12345',
      pricePerTon: 1,
      tareWeight: 1200,
    });
    component.data.WeighingMode = 3;
    component.data.TareWeight = 1200;
    component.data.IsReturn = null;

    component.start();

    expect(alertCreateSpy).toHaveBeenCalled();
    expect(startSpy).not.toHaveBeenCalled();
  });

  it('should set tare weight to zero and start when weighing mode is 1', () => {
    component.weightBillForm1.patchValue({
      vehicleNo: '粤B12345',
      pricePerTon: 1,
      tareWeight: 300,
    });
    component.data.WeighingMode = 1;
    component.data.TareWeight = 300;

    component.start();

    expect(component.data.TareWeight).toBe(0);
    expect(startSpy).toHaveBeenCalled();
  });

  it('should load saved default vehicle and tare weight', fakeAsync(() => {
    getWeightBillDefaultValueSpy.and.returnValue(of({ VehicleNo: '粤B12345', TareWeight: 1200 }));
    component.data.WxOpenId = 'openid-1';

    component.loadDefaultValue();
    tick();

    expect(getWeightBillDefaultValueSpy).toHaveBeenCalledWith('openid-1', '');
    expect(component.data.VehicleNo).toBe('粤B12345');
    expect(component.data.TareWeight).toBe(1200);
    expect(component.autoShowInparkHistory).toBe(false);
    expect(loadingDismissSpy).toHaveBeenCalled();
  }));

  it('should enable in-park history prompt when no default value exists', fakeAsync(() => {
    getWeightBillDefaultValueSpy.and.returnValue(of(null));

    component.loadDefaultValue();
    tick();

    expect(component.data.VehicleNo).toBeNull();
    expect(component.data.TareWeight).toBeNull();
    expect(component.autoShowInparkHistory).toBe(true);
  }));

  it('should uppercase vehicle number and refresh tare weight when input is long enough', () => {
    getWeightBillDefaultValueSpy.and.returnValue(of({ VehicleNo: '粤B12345', TareWeight: 980 }));
    component.data.WxOpenId = 'openid-2';
    component.data.VehicleNo = '粤b12345';

    component.vehicleNoChange({});

    expect(component.data.VehicleNo).toBe('粤B12345');
    expect(getWeightBillDefaultValueSpy).toHaveBeenCalledWith('openid-2', '粤B12345');
    expect(component.data.TareWeight).toBe(980);
  });

  it('should show history vehicle options and apply selected vehicle number', fakeAsync(() => {
    getHistoryVehicleNoSpy.and.returnValue(of(['粤B12345']));
    component.data.WxOpenId = 'openid-3';

    component.showHistoryVehicleNo();
    tick();

    const sheetConfig = actionSheetCreateSpy.calls.mostRecent().args[0];
    sheetConfig.buttons[0].handler();

    expect(getHistoryVehicleNoSpy).toHaveBeenCalledWith('openid-3');
    expect(component.weightBillForm1.controls['vehicleNo'].value).toBe('粤B12345');
    expect(actionSheetPresentSpy).toHaveBeenCalled();
  }));

  it('should show alert when history vehicle list is empty', fakeAsync(() => {
    getHistoryVehicleNoSpy.and.returnValue(of([]));

    component.showHistoryVehicleNo();
    tick();

    expect(alertCreateSpy).toHaveBeenCalled();
    expect(actionSheetCreateSpy).not.toHaveBeenCalled();
  }));

  it('should show history corporate account options and apply selected account', fakeAsync(() => {
    getHistoryCorporateAccountSpy.and.returnValue(of(['corp-001']));
    component.data.WxOpenId = 'openid-4';

    component.showHistoryCorporateAccount();
    tick();
    const sheetConfig = actionSheetCreateSpy.calls.mostRecent().args[0];
    sheetConfig.buttons[0].handler();

    expect(getHistoryCorporateAccountSpy).toHaveBeenCalledWith('openid-4');
    expect(component.weightBillForm1.controls['corporateAccount'].value).toBe('corp-001');
    expect(actionSheetPresentSpy).toHaveBeenCalled();
  }));

  it('should show in-park vehicle options and focus input when user cancels', fakeAsync(() => {
    const setFocusSpy = jasmine.createSpy('setFocus');
    component.vehicleNoInput = { setFocus: setFocusSpy } as any;
    component.autoShowInparkHistory = true;
    getInParkVehicleNoSpy.and.returnValue(of(['plate-54321']));

    component.showInParkVehicleNo(true);
    tick();
    const sheetConfig = actionSheetCreateSpy.calls.mostRecent().args[0];
    sheetConfig.buttons[1].handler();

    expect(getInParkVehicleNoSpy).toHaveBeenCalled();
    expect(component.autoShowInparkHistory).toBe(false);
    expect(setFocusSpy).toHaveBeenCalled();
  }));

  it('should not show in-park empty alert when auto prompt is silent', fakeAsync(() => {
    getInParkVehicleNoSpy.and.returnValue(of([]));

    component.showInParkVehicleNo(false);
    tick();

    expect(alertCreateSpy).not.toHaveBeenCalled();
    expect(actionSheetCreateSpy).not.toHaveBeenCalled();
  }));

  it('should show alert when start read returns false', fakeAsync(() => {
    startSpy.and.returnValue(of(false));

    component.startRead();
    tick();

    expect(startSpy).toHaveBeenCalledWith(component.data);
    expect(loadingDismissSpy).toHaveBeenCalled();
    expect(alertCreateSpy).toHaveBeenCalled();
  }));

  it('should show alert when start read request errors', fakeAsync(() => {
    startSpy.and.returnValue(throwError(() => new Error('timeout')));

    component.startRead();
    tick();

    expect(loadingDismissSpy).toHaveBeenCalled();
    expect(alertCreateSpy).toHaveBeenCalled();
  }));

  it('should navigate to pay page when signalr reports completed bill with fee', fakeAsync(() => {
    component.isMiniProgram = true;
    component.data.WxOpenId = 'openid-5';
    component.signalRConnection = mockSignalRConnection as any;

    (component as any).initSignalRConnection();
    tick();
    messageReceived$.next(JSON.stringify({
      MsgContent: 'Complete',
      InvokeClassName: '555',
      InvokeMethodName: '12.5',
    }));
    tick();

    expect(mockSignalRConnection.invoke).toHaveBeenCalledWith(
      'SendMessage2',
      jasmine.objectContaining({
        MsgContent: 'Stop',
        InvokeClassName: 'openid-5',
      })
    );
    expect(navNavigateForwardSpy).toHaveBeenCalledWith('/member/pay-weighing-fee/detail/555');
  }));

  it('should prompt result navigation when signalr reports completed free bill', fakeAsync(() => {
    component.isMiniProgram = true;
    component.data.WxOpenId = 'openid-6';
    component.signalRConnection = mockSignalRConnection as any;

    (component as any).initSignalRConnection();
    tick();
    messageReceived$.next(JSON.stringify({
      MsgContent: 'Complete',
      InvokeClassName: '556',
      InvokeMethodName: '0',
    }));
    tick();
    const alertConfig = alertCreateSpy.calls.mostRecent().args[0];
    alertConfig.buttons[0].handler();

    expect(alertCreateSpy).toHaveBeenCalled();
    expect(navNavigateForwardSpy).toHaveBeenCalledWith(
      '/member/pay-weighing-fee/result/556',
      jasmine.objectContaining({
        queryParams: jasmine.objectContaining({
          ObjectId: 556,
          OpenId: 'openid-6',
          IsAskPrint: true,
        }),
      })
    );
  }));

  it('should navigate to result with ObjectId, OpenId and print flag', () => {
    component.data.WxOpenId = 'openid-4';

    component.detail(321);

    expect(navNavigateForwardSpy).toHaveBeenCalledWith(
      '/member/pay-weighing-fee/result/321',
      {
        queryParams: {
          ObjectId: 321,
          OpenId: 'openid-4',
          IsAskPrint: true,
        },
      }
    );
  });

  it('should stop signalr connection on destroy', () => {
    component.signalRConnection = mockSignalRConnection as any;

    component.ngOnDestroy();

    expect(mockSignalRConnection.stop).toHaveBeenCalled();
  });
});
