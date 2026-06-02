import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActionSheetController, AlertController, IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { of, Subject } from 'rxjs';

import { WechatPayPage } from './wechat-pay.page';
import { WechatPayService } from 'src/app/providers/wechat-pay.service';
import { SignalR } from 'src/app/providers/signal-r.service';
import { UserService } from 'src/app/providers/user.service';
import { UiFeedbackService } from 'src/app/providers/ui-feedback.service';

describe('WechatPayPage', () => {
  let component: WechatPayPage;
  let fixture: ComponentFixture<WechatPayPage>;
  let messageReceived$: Subject<any>;
  let routerEvents$: Subject<any>;

  const alertCreateSpy = jasmine.createSpy('alertCreate').and.returnValue(Promise.resolve({ present: () => Promise.resolve() }));
  const presentToastSpy = jasmine.createSpy('presentToast');
  const presentLoadingSpy = jasmine.createSpy('presentLoading').and.returnValue(Promise.resolve({ dismiss: jasmine.createSpy('dismiss') }));
  const dismissLoadingSpy = jasmine.createSpy('dismissLoading').and.returnValue(Promise.resolve());

  const getListSpy = jasmine.createSpy('getList').and.returnValue(of({
    ReceiveGoodsDetailList: [],
    Amount1: 0,
    WXPaymentCommission: false,
    WXPaymentCommissionRate: 0
  }));
  const getProductTypesSpy = jasmine.createSpy('getProductTypes').and.returnValue(of([]));

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
        get: () => 'openid-1'
      },
      queryParams: {
        cid: 1
      }
    }
  };
  const mockRouter = {
    navigateByUrl: jasmine.createSpy('navigateByUrl'),
    events: null
  } as any;
  const mockWechatPayService = {
    getList: getListSpy,
    getProductTypes: getProductTypesSpy,
    pay: jasmine.createSpy('pay').and.returnValue(of({ Success: true, Data: '{}' }))
  };
  const mockUserService = {
    getHomeInfo: jasmine.createSpy('getHomeInfo').and.returnValue(of({ CurrencyAmount: [{ Id: 1, Name: '人民币', Amount: 100 }] }))
  };

  beforeEach(async(() => {
    messageReceived$ = new Subject<any>();
    routerEvents$ = new Subject<any>();
    mockRouter.events = routerEvents$.asObservable();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule, FormsModule, ReactiveFormsModule, IonicModule.forRoot()],
      providers: [
        CookieService,
        { provide: AlertController, useValue: { create: alertCreateSpy } },
        { provide: ActionSheetController, useValue: { create: jasmine.createSpy('sheetCreate') } },
        { provide: SignalR, useValue: mockSignalR },
        { provide: ActivatedRoute, useValue: mockRoute },
        { provide: Router, useValue: mockRouter },
        { provide: WechatPayService, useValue: mockWechatPayService },
        { provide: UserService, useValue: mockUserService },
        {
          provide: UiFeedbackService,
          useValue: {
            presentToast: presentToastSpy,
            presentLoading: presentLoadingSpy,
            dismissLoading: dismissLoadingSpy,
          }
        }
      ],
      declarations: [ WechatPayPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WechatPayPage);
    component = fixture.componentInstance;
    alertCreateSpy.calls.reset();
    presentToastSpy.calls.reset();
    presentLoadingSpy.calls.reset();
    dismissLoadingSpy.calls.reset();
    getListSpy.calls.reset();
    getProductTypesSpy.calls.reset();
    mockRouter.navigateByUrl.calls.reset();
    mockSignalRConnection.stop.calls.reset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate commission and total amount', () => {
    component.data = {
      ...component.data,
      Amount: '100.10',
      WXPaymentCommission: true,
      WXPaymentCommissionRate: 0.006
    } as any;

    component.calculateAmount();

    expect(component.data.Commission).toBe('0.60');
    expect(component.data.TotalAmount).toBe('100.70');
    expect(component.data.Amount).toBe(100.1);
  });

  it('should toggle release state when select list changes', () => {
    component.data = {
      ...component.data,
      ReceiveGoodsDetailList: [
        { Id: 1, Amount: '12.30', Selected: true },
        { Id: 2, Amount: '5.00', Selected: false }
      ],
      Amount1: 1.2,
      WXPaymentCommission: false,
      WXPaymentCommissionRate: 0
    } as any;

    component.selectChange();

    expect(component.amountInputDisable).toBe(true);
    expect(component.data.IsRelease).toBe(false);
    expect(component.data.SelectIdList).toBe('1');
    expect(component.data.TotalAmount).toBe('13.50');
  });

  it('should show amount error alert when total amount is too small', () => {
    component.data = { ...component.data, TotalAmount: 0 } as any;

    component.payClick();

    expect(alertCreateSpy).toHaveBeenCalled();
  });

  it('should ignore malformed signalr message without throwing', fakeAsync(() => {
    spyOn(component, 'payHistory');

    component.ngOnInit();
    tick();

    expect(() => messageReceived$.next('{not-json')).not.toThrow();
    expect(component.payHistory).not.toHaveBeenCalled();
  }));

  it('should stop signalR connection on destroy', fakeAsync(() => {
    component.ngOnInit();
    tick();
    component.ngOnDestroy();

    expect(mockSignalRConnection.stop).toHaveBeenCalled();
  }));
});
