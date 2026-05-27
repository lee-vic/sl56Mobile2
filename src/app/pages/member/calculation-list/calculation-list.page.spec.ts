import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { CalculationListPageComponent } from './calculation-list.page';
import { CalculationStateService } from 'src/app/providers/calculation-state.service';

describe('CalculationListPageComponent', () => {
  let component: CalculationListPageComponent;
  let fixture: ComponentFixture<CalculationListPageComponent>;
  let router: Router;
  let calculationState: jasmine.SpyObj<CalculationStateService>;

  beforeEach(async(() => {
    calculationState = jasmine.createSpyObj<CalculationStateService>('CalculationStateService', ['getCalculationResults', 'setCurrentDetail']);

    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), RouterTestingModule],
      providers: [
        { provide: CalculationStateService, useValue: calculationState },
      ],
      declarations: [ CalculationListPageComponent ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    localStorage.clear();
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    fixture = TestBed.createComponent(CalculationListPageComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should group results by price type and place export prices first', () => {
    calculationState.getCalculationResults.and.returnValue([
      { PriceType: '进口价', PriceCode: 'IN-1' },
      { PriceType: '出口价', PriceCode: 'OUT-1' },
      { PriceType: '进口价', PriceCode: 'IN-2' },
    ]);

    component.ngOnInit();

    expect(component.tabsData.length).toBe(2);
    expect(component.tabsData[0].PriceType).toBe('出口价');
    expect(component.tabsData[0].PriceList.length).toBe(1);
    expect(component.tabsData[1].PriceType).toBe('进口价');
    expect(component.tabsData[1].PriceList.length).toBe(2);
  });

  it('should fallback to localStorage when state service has no results', () => {
    calculationState.getCalculationResults.and.returnValue(null);
    localStorage.setItem('CalculationResult', JSON.stringify([
      { PriceType: '出口价', PriceCode: 'OUT-1', TotalAmount: 100 },
    ]));

    component.ngOnInit();

    expect(component.currentPriceList.length).toBe(1);
    expect(component.currentPriceList[0].PriceCode).toBe('OUT-1');
  });

  it('should classify high-risk tips and clear expanded state when tab changes', () => {
    const item = { PriceCode: 'OUT-1', Series: 'A', TotalAmount: 100, ImportantTip: '仅限特定产品，存在关税风险' };

    expect(component.isHighRiskTip(item.ImportantTip as string)).toBe(true);
    expect(component.isTipLong('x'.repeat(60))).toBe(true);

    component.toggleTip(item, new Event('click'));
    expect(component.isTipExpanded(item)).toBe(true);

    component.onTabChange();
    expect(component.isTipExpanded(item)).toBe(false);
  });

  it('should persist current detail and navigate to detail page', () => {
    const item = { PriceCode: 'OUT-1', Series: 'A', TotalAmount: 100 };

    component.detail(item);

    expect(calculationState.setCurrentDetail).toHaveBeenCalledWith(item);
    expect(localStorage.getItem('CalculationDetail')).toBe(JSON.stringify(item));
    expect(router.navigateByUrl).toHaveBeenCalledWith('/member/calculation/calculation-detail');
  });
});
