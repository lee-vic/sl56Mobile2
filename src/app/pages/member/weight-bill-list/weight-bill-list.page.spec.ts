import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AlertController, IonicModule, LoadingController, NavController } from '@ionic/angular';
import { CookieService } from 'ngx-cookie-service';
import { of, throwError } from 'rxjs';

import { WeightBillListPage } from './weight-bill-list.page';
import { WeightBillService } from 'src/app/providers/weight-bill.service';

describe('WeightBillListPage', () => {
  let component: WeightBillListPage;
  let fixture: ComponentFixture<WeightBillListPage>;

  const getListSpy = jasmine.createSpy('getList').and.returnValue(of([]));
  const printWeightBillSpy = jasmine.createSpy('printWeightBill').and.returnValue(of({ Success: true }));
  const navigateForwardSpy = jasmine.createSpy('navigateForward');
  const alertPresentSpy = jasmine.createSpy('alertPresent').and.returnValue(Promise.resolve());
  const alertCreateSpy = jasmine
    .createSpy('alertCreate')
    .and.returnValue(Promise.resolve({ present: alertPresentSpy }));
  const loadingPresentSpy = jasmine.createSpy('loadingPresent').and.returnValue(Promise.resolve());
  const loadingDismissSpy = jasmine.createSpy('loadingDismiss').and.returnValue(Promise.resolve());
  const loadingCreateSpy = jasmine
    .createSpy('loadingCreate')
    .and.returnValue(Promise.resolve({ present: loadingPresentSpy, dismiss: loadingDismissSpy }));
  const cookieGetSpy = jasmine.createSpy('cookieGet').and.returnValue('openid-1');

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, FormsModule, ReactiveFormsModule, IonicModule.forRoot()],
      providers: [
        { provide: WeightBillService, useValue: { getList: getListSpy, printWeightBill: printWeightBillSpy } },
        { provide: CookieService, useValue: { get: cookieGetSpy } },
        { provide: NavController, useValue: { navigateForward: navigateForwardSpy } },
        { provide: AlertController, useValue: { create: alertCreateSpy } },
        { provide: LoadingController, useValue: { create: loadingCreateSpy } },
      ],
      declarations: [ WeightBillListPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    cookieGetSpy.calls.reset();
    cookieGetSpy.and.returnValue('openid-1');
    fixture = TestBed.createComponent(WeightBillListPage);
    component = fixture.componentInstance;
    getListSpy.calls.reset();
    getListSpy.and.returnValue(of([]));
    printWeightBillSpy.calls.reset();
    printWeightBillSpy.and.returnValue(of({ Success: true }));
    navigateForwardSpy.calls.reset();
    alertCreateSpy.calls.reset();
    alertPresentSpy.calls.reset();
    loadingCreateSpy.calls.reset();
    loadingPresentSpy.calls.reset();
    loadingDismissSpy.calls.reset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load weight bill list with open id from cookie', fakeAsync(() => {
    const weightBills = [
      { ObjectId: 101, VehicleNo: '粤A12345', NetWeight: 10 },
      { ObjectId: 102, VehicleNo: '粤B12345', NetWeight: 20 },
    ];
    getListSpy.and.returnValue(of(weightBills));

    component.ngOnInit();
    tick();

    expect(cookieGetSpy).toHaveBeenCalledWith('OpenId');
    expect(getListSpy).toHaveBeenCalledWith('openid-1');
    expect(component.weights).toEqual(weightBills as any);
    expect(component.isLoading).toBe(false);
    expect(component.hasLoadError).toBe(false);
    expect(component.showMsg).toBe('');
  }));

  it('should show empty message when no weight bill exists', fakeAsync(() => {
    getListSpy.and.returnValue(of([]));

    component.loadList();
    tick();

    expect(component.weights).toEqual([]);
    expect(component.isLoading).toBe(false);
    expect(component.hasLoadError).toBe(false);
    expect(component.showMsg).toBeTruthy();
  }));

  it('should show load error message when list request fails', fakeAsync(() => {
    getListSpy.and.returnValue(throwError(() => new Error('network')));

    component.loadList();
    tick();

    expect(component.isLoading).toBe(false);
    expect(component.hasLoadError).toBe(true);
    expect(component.showMsg).toBeTruthy();
  }));

  it('should navigate to weight bill result detail', () => {
    component.detail(101);

    expect(navigateForwardSpy).toHaveBeenCalledWith('/member/pay-weighing-fee/result/101');
  });

  it('should show success alert when print succeeds', fakeAsync(() => {
    printWeightBillSpy.and.returnValue(of({ Success: true }));

    component.print(101);
    tick();

    expect(printWeightBillSpy).toHaveBeenCalledWith(101);
    expect(loadingCreateSpy).toHaveBeenCalled();
    expect(loadingDismissSpy).toHaveBeenCalled();
    expect(alertCreateSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({
        backdropDismiss: false,
        keyboardClose: false,
      })
    );
    expect(alertPresentSpy).toHaveBeenCalled();
  }));

  it('should show failure alert when print fails', fakeAsync(() => {
    printWeightBillSpy.and.returnValue(of({ Success: false, ErrorMessage: 'printer error' }));

    component.print(101);
    tick();

    expect(printWeightBillSpy).toHaveBeenCalledWith(101);
    expect(loadingDismissSpy).toHaveBeenCalled();
    expect(alertCreateSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({
        message: 'printer error',
        backdropDismiss: false,
        keyboardClose: false,
      })
    );
  }));
});
