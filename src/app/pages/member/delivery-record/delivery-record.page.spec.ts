import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CookieService } from 'ngx-cookie-service';
import { Router } from '@angular/router';
import { of, Subject } from 'rxjs';

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

    component.batchReturn();
    expect(component.isShowCheckbox).toBe(true);

    component.batchReturn();

    expect(component.isShowCheckbox).toBe(false);
    expect(component.addWaitingReturnList).toHaveBeenCalledWith('1,3');
    expect(component.items.every((item) => item.Selected === false)).toBe(true);
  });

  it('should call return service when selected ids are not empty', () => {
    component.addWaitingReturnList('1,2');

    expect(addToWaitReturnListSpy).toHaveBeenCalledWith('1,2');
  });

  it('should navigate to waiting return list page', () => {
    component.waitingReturnList();

    expect(router.navigate).toHaveBeenCalledWith(['/member/return-waiting']);
  });
});
