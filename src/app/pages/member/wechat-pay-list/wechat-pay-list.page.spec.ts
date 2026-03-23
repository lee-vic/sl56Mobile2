import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { LoadingController } from '@ionic/angular';
import { of } from 'rxjs';

import { WechatPay } from 'src/app/interfaces/wechat-pay';
import { WechatPayListService } from 'src/app/providers/wechat-pay-list.service';
import { WechatPayListPage } from './wechat-pay-list.page';

const PAY_1: WechatPay = { ObjectNo: 'A1', TotalAmount: '100', FreightAmount: '10', CommissionAmount: '5', Status: '1', Date: '2024-01-01' };
const PAY_2: WechatPay = { ObjectNo: 'A2', TotalAmount: '200', FreightAmount: '20', CommissionAmount: '8', Status: '2', Date: '2024-01-02' };

describe('WechatPayListPage (infinite-scroll migration)', () => {
  let component: WechatPayListPage;
  let fixture: ComponentFixture<WechatPayListPage>;
  let mockService:        jasmine.SpyObj<WechatPayListService>;
  let mockInfiniteScroll: any;

  beforeEach(async(() => {
    mockService = jasmine.createSpyObj('WechatPayListService', ['getList']);
    mockService.getList.and.returnValue(of([PAY_1, PAY_2]));

    TestBed.configureTestingModule({
      declarations: [WechatPayListPage],
      providers: [
        { provide: WechatPayListService, useValue: mockService },
        { provide: LoadingController,    useValue: {} }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture   = TestBed.createComponent(WechatPayListPage);
    component = fixture.componentInstance;

    // Manually assign infiniteScroll BEFORE detectChanges.
    // @ViewChild(static:true) won't find the ion-infinite-scroll in a schema-only
    // test, so our assignment is safe here (Angular leaves the property as-is
    // when the query finds no match).
    mockInfiniteScroll = { complete: jasmine.createSpy('scroll.complete'), disabled: false };
    component.infiniteScroll = mockInfiniteScroll;

    // detectChanges() triggers ngOnInit → getItems() → infiniteScroll.complete()
    fixture.detectChanges();
  });

  // ── 1. Creation ───────────────────────────────────────────────────
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── 2. ngOnInit calls service ─────────────────────────────────────
  it('ngOnInit() calls service.getList(1) on first load', () => {
    expect(mockService.getList).toHaveBeenCalledWith(1);
  });

  // ── 3. getItems appends items ─────────────────────────────────────
  it('getItems() appends items, increments currentPageIndex, and calls infiniteScroll.complete()', () => {
    // Reset state so we can call getItems() again cleanly
    component.items            = [];
    component.currentPageIndex = 1;
    component.isBusy           = false;
    mockInfiniteScroll.complete.calls.reset();

    component.getItems();

    expect(component.items.length).toBe(2);
    expect(component.currentPageIndex).toBe(2);
    expect(mockInfiniteScroll.complete).toHaveBeenCalled();
  });

  // ── 4. isBusy guard ───────────────────────────────────────────────
  it('getItems() returns immediately when isBusy is true', () => {
    component.isBusy = true;
    const countBefore = mockService.getList.calls.count();
    component.getItems();
    expect(mockService.getList.calls.count()).toBe(countBefore);
  });

  // ── 5. Accumulation over multiple pages ───────────────────────────
  it('calling getItems() twice loads 4 items total and sets currentPageIndex to 3', () => {
    // First call is already done in beforeEach (ngOnInit).
    // Reset isBusy and call again for the second page.
    component.isBusy = false;
    component.getItems();

    expect(component.items.length).toBe(4);
    expect(component.currentPageIndex).toBe(3);
  });
});
