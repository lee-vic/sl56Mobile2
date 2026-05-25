import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
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
import { of, Subject } from 'rxjs';
import { Title } from '@angular/platform-browser';

import { PayWeighingFeePage } from './pay-weighing-fee.page';
import { WeightBillService } from 'src/app/providers/weight-bill.service';
import { SignalR } from 'src/app/providers/signal-r.service';

describe('PayWeighingFeePage', () => {
  let component: PayWeighingFeePage;
  let fixture: ComponentFixture<PayWeighingFeePage>;

  const alertCreateSpy = jasmine
    .createSpy('alertCreate')
    .and.returnValue(Promise.resolve({ present: () => Promise.resolve() }));
  const loadingPresentSpy = jasmine
    .createSpy('loadingPresent')
    .and.returnValue(Promise.resolve());
  const loadingDismissSpy = jasmine
    .createSpy('loadingDismiss')
    .and.returnValue(Promise.resolve());

  const getWeightBillDefaultValueSpy = jasmine
    .createSpy('getWeightBillDefaultValue')
    .and.returnValue(of(null));
  const startSpy = jasmine.createSpy('start').and.returnValue(of(true));

  const mockSignalRConnection = {
    status: new Subject<any>(),
    start: () => Promise.resolve({ listenFor: () => of({}) }),
    stop: jasmine.createSpy('stop'),
    invoke: jasmine.createSpy('invoke').and.returnValue(Promise.resolve(true)),
  };

  const mockWeightBillService = {
    getWeightBillDefaultValue: getWeightBillDefaultValueSpy,
    getHistoryVehicleNo: () => of([]),
    getHistoryCorporateAccount: () => of([]),
    getInParkVehicleNo: () => of([]),
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
        { provide: NavController, useValue: { navigateForward: jasmine.createSpy('navigateForward') } },
        {
          provide: LoadingController,
          useValue: {
            create: () => Promise.resolve({ present: loadingPresentSpy }),
            dismiss: loadingDismissSpy,
          },
        },
        { provide: AlertController, useValue: { create: alertCreateSpy } },
        { provide: ToastController, useValue: { create: jasmine.createSpy('toastCreate') } },
        { provide: ActionSheetController, useValue: { create: jasmine.createSpy('sheetCreate') } },
        { provide: Title, useValue: { setTitle: jasmine.createSpy('setTitle') } },
      ],
      declarations: [PayWeighingFeePage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PayWeighingFeePage);
    component = fixture.componentInstance;
    alertCreateSpy.calls.reset();
    startSpy.calls.reset();
    getWeightBillDefaultValueSpy.calls.reset();
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
});
