import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { CalculationDetailPage } from './calculation-detail.page';
import { CalculationStateService } from 'src/app/providers/calculation-state.service';

describe('CalculationDetailPage', () => {
  let component: CalculationDetailPage;
  let fixture: ComponentFixture<CalculationDetailPage>;
  let router: Router;
  let calculationState: jasmine.SpyObj<CalculationStateService>;
  let toastCtrl: jasmine.SpyObj<ToastController>;
  let toastElement: jasmine.SpyObj<HTMLIonToastElement>;

  beforeEach(async(() => {
    calculationState = jasmine.createSpyObj<CalculationStateService>('CalculationStateService', ['getCurrentDetail']);
    toastElement = jasmine.createSpyObj<HTMLIonToastElement>('HTMLIonToastElement', ['present']);
    toastCtrl = jasmine.createSpyObj<ToastController>('ToastController', ['create']);
    toastCtrl.create.and.returnValue(Promise.resolve(toastElement));

    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), RouterTestingModule],
      providers: [
        { provide: CalculationStateService, useValue: calculationState },
        { provide: ToastController, useValue: toastCtrl },
      ],
      declarations: [ CalculationDetailPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    localStorage.clear();
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    fixture = TestBed.createComponent(CalculationDetailPage);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fallback to localStorage and normalize charges to an array', () => {
    calculationState.getCurrentDetail.and.returnValue(null);
    localStorage.setItem('CalculationDetail', JSON.stringify({
      PriceCode: 'OUT-1',
      Charges: null,
      CountryRemark: '国家备注',
    }));

    component.ngOnInit();

    expect(component.data.PriceCode).toBe('OUT-1');
    expect(component.data.Charges).toEqual([]);
    expect(component.getRemarkContent('country')).toBe('国家备注');
  });

  it('should expose summary and charge state from current detail', () => {
    calculationState.getCurrentDetail.and.returnValue({
      TotalAmount: 188,
      Currency: 'USD',
      ModeOfTransportName: '空运',
      ChargeableWeight: 12.5,
      Charges: [{ ChargeName: '燃油费' }],
      CommonRemark: '需要预约',
    });

    component.ngOnInit();

    expect(component.summaryCards[0].value).toBe(188);
    expect(component.summaryCards[0].emphasis).toBe('USD');
    expect(component.hasCharges).toBe(true);
    expect(component.hasRemarkContent('common')).toBe(true);
  });

  it('should show a medium toast when copying an empty price code', async () => {
    component.data = { PriceCode: '' };

    await component.copyPriceCode();

    expect(toastCtrl.create).toHaveBeenCalledWith(jasmine.objectContaining({
      message: '暂无可复制内容',
      color: 'medium',
    }));
    expect(toastElement.present).toHaveBeenCalled();
  });

  it('should copy the price code and show a success toast', async () => {
    const writeText = jasmine.createSpy('writeText').and.returnValue(Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    component.data = { PriceCode: 'SL-001' };

    await component.copyPriceCode();

    expect(writeText).toHaveBeenCalledWith('SL-001');
    expect(toastCtrl.create).toHaveBeenCalledWith(jasmine.objectContaining({
      message: '报价代码已复制',
      color: 'success',
    }));
  });
});
