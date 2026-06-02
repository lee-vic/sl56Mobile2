import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CookieService } from 'ngx-cookie-service';
import { Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { UiFeedbackService } from 'src/app/providers/ui-feedback.service';

import { DeliveryRecordPage } from './delivery-record.page';
import { DeliveryRecordService } from 'src/app/providers/delivery-record.service';
import { ReturnService } from 'src/app/providers/return.service';
import { WaitingReturnEventsService } from 'src/app/providers/waiting-return-events.service';

describe('DeliveryRecordPage', () => {
  let component: DeliveryRecordPage;
  let fixture: ComponentFixture<DeliveryRecordPage>;
  let router: Router;

  const loadListSpy = jasmine.createSpy('loadList').and.returnValue(of([]));
  const getWaitReturnListSpy = jasmine.createSpy('getWaitReturnList').and.returnValue(of([]));
  const addToWaitReturnListSpy = jasmine.createSpy('addToWaitReturnList').and.returnValue(of({}));
  const reload$ = new Subject<void>();
  const presentToastSpy = jasmine.createSpy('presentToast');

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule, FormsModule, ReactiveFormsModule, IonicModule.forRoot()],
      providers: [
        CookieService,
        { provide: DeliveryRecordService, useValue: { loadList: loadListSpy } },
        {
          provide: ReturnService,
          useValue: {
            getWaitReturnList: getWaitReturnListSpy,
            addToWaitReturnList: addToWaitReturnListSpy,
          },
        },
        {
          provide: WaitingReturnEventsService,
          useValue: {
            onReloadWaitingReturn: () => reload$.asObservable(),
            notifyReloadWaitingReturn: jasmine.createSpy('notifyReloadWaitingReturn'),
          },
        },
        { provide: UiFeedbackService, useValue: { presentToast: presentToastSpy } },
      ],
      declarations: [ DeliveryRecordPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeliveryRecordPage);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    component.searchbar = { value: '' } as any;
    component.infiniteScroll = { disabled: false, complete: jasmine.createSpy('complete') } as any;
    loadListSpy.calls.reset();
    getWaitReturnListSpy.calls.reset();
    addToWaitReturnListSpy.calls.reset();
    presentToastSpy.calls.reset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load items and disable infinite scroll when page size is less than 10', () => {
    loadListSpy.and.returnValue(of([{ Id: 1 }, { Id: 2 }] as any));

    component.getItems('', false);

    expect(component.items.length).toBe(2);
    expect(component.currentPageIndex).toBe(2);
    expect(component.infiniteScroll.disabled).toBe(true);
  });

  it('should toggle checkbox mode and submit selected ids on second click', () => {
    spyOn(component, 'addWaitingReturnList');
    component.items = [
      { Id: 1, Selected: true } as any,
      { Id: 2, Selected: false } as any,
      { Id: 3, Selected: true } as any,
    ];
    component.isShowCheckbox = true;

    component.batchReturn();
    expect(component.isShowCheckbox).toBe(true);
    expect(component.addWaitingReturnList).toHaveBeenCalledWith([1, 3], 2);
  });

  it('should call return service when selected ids are not empty', () => {
    getWaitReturnListSpy.and.returnValue(of([]));

    component.addWaitingReturnList([1, 2]);

    expect(addToWaitReturnListSpy).toHaveBeenCalledWith('1,2');
  });

  it('should skip duplicated ids before adding into waiting return list', () => {
    getWaitReturnListSpy.and.returnValue(of([{ Id: 2 }] as any));

    component.addWaitingReturnList([1, 2, 3]);

    expect(addToWaitReturnListSpy).toHaveBeenCalledWith('1,3');
  });

  it('should keep selected items checked after adding to waiting list', () => {
    getWaitReturnListSpy.and.returnValue(of([]));
    component.items = [
      { Id: 1, Selected: true } as any,
      { Id: 2, Selected: true } as any,
    ];

    component.addWaitingReturnList([1, 2]);

    expect(component.items.every((item) => item.Selected === true)).toBe(true);
  });

  it('should not call add api when all selected ids already exist in waiting list', () => {
    getWaitReturnListSpy.and.returnValue(of([{ Id: 1 }, { Id: 2 }] as any));

    component.addWaitingReturnList([1, 2]);

    expect(addToWaitReturnListSpy).not.toHaveBeenCalled();
    expect(component.isBatchSubmitting).toBe(false);
  });

  it('should auto check items already in waiting list when entering batch mode', () => {
    component.items = [
      { Id: 1, Selected: false } as any,
      { Id: 2, Selected: false } as any,
    ];
    getWaitReturnListSpy.and.returnValue(of([{ Id: 2 }] as any));

    component.getWaitingReturnList();
    component.onBatchEntryClick();

    expect(component.isShowCheckbox).toBe(true);
    expect(component.items[0].Selected).toBe(false);
    expect(component.items[1].Selected).toBe(true);
  });

  it('should toggle selection through onRecordClick when in batch mode', () => {
    component.isShowCheckbox = true;
    component.items = [{ Id: 7, Selected: false } as any];

    component.onRecordClick(component.items[0] as any);

    expect(component.items[0].Selected).toBe(true);
  });

  it('should navigate detail through onRecordClick when not in batch mode', () => {
    component.isShowCheckbox = false;
    const item = { Id: 8, Selected: false } as any;

    component.onRecordClick(item);

    expect(router.navigate).toHaveBeenCalledWith(['/member/delivery-record/detail', 8]);
  });

  it('should clear selected state when canceling batch mode', () => {
    component.isShowCheckbox = true;
    component.items = [
      { Id: 1, Selected: true } as any,
      { Id: 2, Selected: false } as any,
    ];

    component.cancelBatchMode();

    expect(component.isShowCheckbox).toBe(false);
    expect(component.items.every(item => item.Selected === false)).toBe(true);
  });

  it('should navigate to waiting return list page', () => {
    component.waitingReturnList();

    expect(router.navigate).toHaveBeenCalledWith(['/member/return-waiting']);
  });

  it('should refresh waiting list when page re-enters', () => {
    component.ionViewWillEnter();

    expect(getWaitReturnListSpy).toHaveBeenCalled();
  });

  it('should sync selected state when waiting-return reload event is emitted', () => {
    component.ngOnInit();
    component.items = [
      { Id: 1, Selected: true } as any,
      { Id: 2, Selected: false } as any,
    ];
    component.isShowCheckbox = true;
    getWaitReturnListSpy.and.returnValue(of([{ Id: 2 }] as any));

    reload$.next();

    expect(component.items[0].Selected).toBe(false);
    expect(component.items[1].Selected).toBe(true);
  });

  it('should stop reacting to waiting-return reload after destroy', () => {
    component.ngOnInit();
    getWaitReturnListSpy.calls.reset();

    component.ngOnDestroy();
    reload$.next();

    expect(getWaitReturnListSpy).not.toHaveBeenCalled();
  });

  it('should complete refresher via detail.complete when provided', () => {
    const completeSpy = jasmine.createSpy('detailComplete');
    const refresherEvent = { detail: { complete: completeSpy }, target: { complete: jasmine.createSpy('targetComplete') } } as any;

    loadListSpy.and.returnValue(of([{ Id: 1 }] as any));
    component.getItems('', false, refresherEvent);

    expect(completeSpy).toHaveBeenCalled();
    expect(refresherEvent.target.complete).not.toHaveBeenCalled();
  });
});
