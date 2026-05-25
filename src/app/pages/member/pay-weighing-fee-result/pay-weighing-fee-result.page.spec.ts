import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AlertController, IonicModule, LoadingController } from '@ionic/angular';
import { of, Subject } from 'rxjs';

import { PayWeighingFeeResultPage } from './pay-weighing-fee-result.page';
import { WeightBillService } from 'src/app/providers/weight-bill.service';

describe('PayWeighingFeeResultPage', () => {
  let component: PayWeighingFeeResultPage;
  let fixture: ComponentFixture<PayWeighingFeeResultPage>;
  let queryParams$: Subject<any>;
  let alertDismissSpy: jasmine.Spy;

  const loadingPresentSpy = jasmine.createSpy('loadingPresent').and.returnValue(Promise.resolve());
  const loadingDismissSpy = jasmine.createSpy('loadingDismiss').and.returnValue(Promise.resolve());
  const alertCreateSpy = jasmine.createSpy('alertCreate').and.returnValue(Promise.resolve({ present: () => Promise.resolve() }));

  const printWeightBillSpy = jasmine.createSpy('printWeightBill').and.returnValue(of({ Success: true }));
  const mockRoute = {
    snapshot: {
      paramMap: {
        get: () => '501'
      }
    },
    queryParams: null
  } as any;

  beforeEach(async(() => {
    queryParams$ = new Subject<any>();
    mockRoute.queryParams = queryParams$.asObservable();
    alertDismissSpy = jasmine.createSpy('alertDismiss');

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule, FormsModule, ReactiveFormsModule, IonicModule.forRoot()],
      providers: [
        { provide: ActivatedRoute, useValue: mockRoute },
        { provide: AlertController, useValue: { create: alertCreateSpy, dismiss: alertDismissSpy } },
        {
          provide: LoadingController,
          useValue: {
            create: () => Promise.resolve({ present: loadingPresentSpy, dismiss: loadingDismissSpy }),
            dismiss: loadingDismissSpy
          }
        },
        { provide: WeightBillService, useValue: { printWeightBill: printWeightBillSpy } }
      ],
      declarations: [ PayWeighingFeeResultPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PayWeighingFeeResultPage);
    component = fixture.componentInstance;
    alertCreateSpy.calls.reset();
    printWeightBillSpy.calls.reset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set image url on init', () => {
    queryParams$.next({ IsAskPrint: false });
    component.ngOnInit();

    expect(component.imageUrl).toContain('/Measure/GetWeightBillFile?objectId=501');
  });

  it('should show success alert when print succeeds', fakeAsync(() => {
    printWeightBillSpy.and.returnValue(of({ Success: true }));

    component.print();
    tick();

    expect(printWeightBillSpy).toHaveBeenCalledWith('501');
    expect(alertCreateSpy).toHaveBeenCalled();
  }));

  it('should show failure alert when print fails', fakeAsync(() => {
    printWeightBillSpy.and.returnValue(of({ Success: false, ErrorMessage: 'printer error' }));

    component.print();
    tick();

    expect(printWeightBillSpy).toHaveBeenCalledWith('501');
    expect(alertCreateSpy).toHaveBeenCalled();
  }));

  it('should auto print after timeout when ask-print is enabled', fakeAsync(() => {
    spyOn(component, 'print');
    queryParams$.next({ IsAskPrint: true });

    component.ngOnInit();
    tick(10001);

    expect(component.print).toHaveBeenCalled();
    expect(alertDismissSpy).toHaveBeenCalled();
  }));

  it('should show ask-print prompt when IsAskPrint comes from url string', () => {
    queryParams$.next({ IsAskPrint: 'true' });

    component.ngOnInit();

    expect(alertCreateSpy).toHaveBeenCalled();
  });
});
