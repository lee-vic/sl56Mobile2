import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AlertController, IonicModule, NavController, ToastController } from '@ionic/angular';
import { CookieService } from 'ngx-cookie-service';
import { of } from 'rxjs';

import { ReturnListPage } from './return-list.page';
import { ReturnService } from 'src/app/providers/return.service';

describe('ReturnListPage', () => {
  let component: ReturnListPage;
  let fixture: ComponentFixture<ReturnListPage>;

  const alertCreateSpy = jasmine.createSpy('alertCreate').and.returnValue(Promise.resolve({ present: () => Promise.resolve() }));
  const toastCreateSpy = jasmine.createSpy('toastCreate').and.returnValue(Promise.resolve({ present: () => Promise.resolve() }));

  const getList1Spy = jasmine.createSpy('getList1').and.returnValue(of([]));
  const getList2Spy = jasmine.createSpy('getList2').and.returnValue(of([]));
  const updateMobilePhoneSpy = jasmine.createSpy('updateMobilePhone').and.returnValue(of(''));
  const terminateSpy = jasmine.createSpy('terminate').and.returnValue(of({ Success: true }));

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule, FormsModule, ReactiveFormsModule, IonicModule.forRoot()],
      providers: [
        CookieService,
        {
          provide: ReturnService,
          useValue: {
            getList1: getList1Spy,
            getList2: getList2Spy,
            updateMobilePhone: updateMobilePhoneSpy,
            terminate: terminateSpy,
            resetPickupCode: jasmine.createSpy('resetPickupCode').and.returnValue(of('')),
          },
        },
        { provide: AlertController, useValue: { create: alertCreateSpy } },
        { provide: ToastController, useValue: { create: toastCreateSpy } },
        { provide: NavController, useValue: { navigateForward: jasmine.createSpy('navigateForward') } },
      ],
      declarations: [ ReturnListPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReturnListPage);
    component = fixture.componentInstance;
    component.searchbar = { value: '' } as any;
    component.infiniteScroll = { complete: jasmine.createSpy('complete') } as any;
    getList1Spy.calls.reset();
    getList2Spy.calls.reset();
    updateMobilePhoneSpy.calls.reset();
    terminateSpy.calls.reset();
    alertCreateSpy.calls.reset();
    toastCreateSpy.calls.reset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should parse reference numbers in ongoing return list', () => {
    getList2Spy.and.returnValue(of([
      { ReferenceNumber: 'A_1001,B_1002' },
      { ReferenceNumber: 'C_2001' },
    ] as any));

    component.getItems2();

    expect(component.items2[0].ReferenceNumber).toBe('1001,1002');
    expect(component.items2[1].ReferenceNumber).toBe('2001');
  });

  it('should show validation alert when mobile phone is empty', () => {
    component.tempPhone = '   ';

    component.submitMobilePhone({ ObjectId: 1, isEditMobilePhone: true });

    expect(alertCreateSpy).toHaveBeenCalled();
    expect(updateMobilePhoneSpy).not.toHaveBeenCalled();
  });

  it('should update mobile phone when submit succeeds', () => {
    const item = { ObjectId: 1, MobilePhone: '13900000000', isEditMobilePhone: true } as any;
    component.tempPhone = '13811112222';
    updateMobilePhoneSpy.and.returnValue(of(''));

    component.submitMobilePhone(item);

    expect(updateMobilePhoneSpy).toHaveBeenCalledWith(1, '13811112222');
    expect(item.MobilePhone).toBe('13811112222');
    expect(item.isEditMobilePhone).toBe(false);
  });

  it('should reset list and page index on search', () => {
    spyOn(component, 'getItems1');
    component.currentPageIndex = 4;
    component.items1 = [{ Id: 1 } as any];
    component.searchbar = { value: ' TK-100 ' } as any;

    component.searchItems();

    expect(component.currentPageIndex).toBe(1);
    expect(component.items1.length).toBe(0);
    expect(component.getItems1).toHaveBeenCalledWith('TK-100', false);
  });
});
