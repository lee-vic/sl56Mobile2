import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { AlertController, IonicModule, LoadingController, NavController } from '@ionic/angular';
import { of, Subject, throwError } from 'rxjs';
import { WarehouseApplicationService } from 'src/app/providers/warehouse-application.service';
import { UiFeedbackService } from 'src/app/providers/ui-feedback.service';

import { WarehouseApplicationPage } from './warehouse-application.page';

describe('WarehouseApplicationPage', () => {
  let component: WarehouseApplicationPage;
  let fixture: ComponentFixture<WarehouseApplicationPage>;
  let getListSpy: jasmine.Spy;
  let paySpy: jasmine.Spy;
  let navigateForwardSpy: jasmine.Spy;
  let alertCreateSpy: jasmine.Spy;
  let loadingCreateSpy: jasmine.Spy;
  let toastSpy: jasmine.Spy;

  beforeEach(async(() => {
    getListSpy = jasmine.createSpy('getList').and.returnValue(of({ Success: true, Data: [] }));
    paySpy = jasmine.createSpy('pay').and.returnValue(of({ Success: true, Data: '{}' }));
    navigateForwardSpy = jasmine.createSpy('navigateForward').and.returnValue(Promise.resolve(true));
    alertCreateSpy = jasmine.createSpy('create').and.returnValue(Promise.resolve({ present: jasmine.createSpy('present') }));
    loadingCreateSpy = jasmine.createSpy('create').and.returnValue(Promise.resolve({
      present: jasmine.createSpy('present').and.returnValue(Promise.resolve()),
      dismiss: jasmine.createSpy('dismiss').and.returnValue(Promise.resolve()),
    }));
    toastSpy = jasmine.createSpy('presentToast').and.returnValue(Promise.resolve());

    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot()],
      providers: [
        {
          provide: WarehouseApplicationService,
          useValue: {
            getList: getListSpy,
            pay: paySpy,
          }
        },
        { provide: NavController, useValue: { navigateForward: navigateForwardSpy } },
        { provide: AlertController, useValue: { create: alertCreateSpy } },
        { provide: LoadingController, useValue: { create: loadingCreateSpy } },
        { provide: UiFeedbackService, useValue: { presentToast: toastSpy } },
      ],
      declarations: [WarehouseApplicationPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WarehouseApplicationPage);
    component = fixture.componentInstance;
    getListSpy.calls.reset();
    getListSpy.and.returnValue(of({ Success: true, Data: [] }));
    paySpy.calls.reset();
    paySpy.and.returnValue(of({ Success: true, Data: '{}' }));
    navigateForwardSpy.calls.reset();
    alertCreateSpy.calls.reset();
    loadingCreateSpy.calls.reset();
    toastSpy.calls.reset();
  });

  it('should create', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('should show skeleton while first page is loading', () => {
    const pending$ = new Subject<unknown>();
    getListSpy.and.returnValue(pending$.asObservable());

    fixture.detectChanges();

    expect(component.isInitialLoading).toBe(true);
    expect(fixture.nativeElement.querySelectorAll('.skeleton-card').length).toBeGreaterThan(0);
  });

  it('should load applications and expose status text', () => {
    getListSpy.and.returnValue(of({
      Success: true,
      Data: [{ Id: 8, ReferenceNumber: 'HK20260701', Piece: 3, Source: '自行送货', Amount: 143, Status: 0 }]
    }));

    fixture.detectChanges();

    expect(component.applications.length).toBe(1);
    expect(component.getStatusMeta(0).label).toBe('待支付');
    expect(component.isLoaded).toBe(true);
  });

  it('should append next page and complete infinite scroll event', () => {
    const firstPage = Array.from({ length: 20 }).map((_, index) => ({
      Id: index + 1,
      ReferenceNumber: `HK${index + 1}`,
      Piece: 1,
      Source: '自行送货',
      Amount: 143,
      Status: 1,
    }));
    getListSpy.and.returnValues(
      of({ Success: true, Data: firstPage }),
      of({ Success: true, Data: [{ Id: 21, ReferenceNumber: 'HK21', Piece: 1, Source: '自行送货', Amount: 143, Status: 1 }] })
    );
    const complete = jasmine.createSpy('complete');

    fixture.detectChanges();
    component.loadMore({ target: { complete } } as unknown as CustomEvent);

    expect(getListSpy).toHaveBeenCalledWith(2);
    expect(component.applications.length).toBe(21);
    expect(complete).toHaveBeenCalled();
  });

  it('should enter error state when list request fails', () => {
    getListSpy.and.returnValue(throwError(() => new Error('network')));

    fixture.detectChanges();

    expect(component.loadError).toBe(true);
    expect(component.isLoaded).toBe(true);
    expect(toastSpy).toHaveBeenCalledWith('入仓申请加载失败，请稍后重试', 2200, 'middle', undefined, 'danger');
  });

  it('should navigate to add and detail pages', () => {
    component.add();
    component.goToDetail(9);

    expect(navigateForwardSpy).toHaveBeenCalledWith('/member/warehouse-application-detail/0');
    expect(navigateForwardSpy).toHaveBeenCalledWith('/member/warehouse-application-detail/9');
  });

  it('should show unsupported payment alert outside WeChat', async () => {
    await component.pay({ Id: 9, ReferenceNumber: 'HK9', Piece: 1, Source: '自行送货', Amount: 143, Status: 0 });

    expect(alertCreateSpy).toHaveBeenCalled();
    expect(paySpy).not.toHaveBeenCalled();
  });
});
