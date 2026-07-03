import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AlertController, IonicModule, LoadingController, NavController } from '@ionic/angular';
import { of, Subject, throwError } from 'rxjs';
import { WarehouseApplicationService } from 'src/app/providers/warehouse-application.service';

import { WarehouseApplicationDetailPage } from './warehouse-application-detail.page';

describe('WarehouseApplicationDetailPage', () => {
  let component: WarehouseApplicationDetailPage;
  let fixture: ComponentFixture<WarehouseApplicationDetailPage>;
  let detailSpy: jasmine.Spy;
  let saveSpy: jasmine.Spy;
  let cancelSpy: jasmine.Spy;
  let alertCreateSpy: jasmine.Spy;
  let loadingCreateSpy: jasmine.Spy;
  let navBackSpy: jasmine.Spy;

  const createComponent = (id: string = '0'): void => {
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: { snapshot: { paramMap: { get: () => id } } }
    });
    fixture = TestBed.createComponent(WarehouseApplicationDetailPage);
    component = fixture.componentInstance;
  };

  beforeEach(async(() => {
    detailSpy = jasmine.createSpy('detail').and.returnValue(of({ Success: true, Data: null }));
    saveSpy = jasmine.createSpy('save').and.returnValue(of({ Success: true }));
    cancelSpy = jasmine.createSpy('cancel').and.returnValue(of({ Success: true }));
    alertCreateSpy = jasmine.createSpy('create').and.returnValue(Promise.resolve({ present: jasmine.createSpy('present') }));
    loadingCreateSpy = jasmine.createSpy('create').and.returnValue(Promise.resolve({
      present: jasmine.createSpy('present').and.returnValue(Promise.resolve()),
      dismiss: jasmine.createSpy('dismiss').and.returnValue(Promise.resolve()),
    }));
    navBackSpy = jasmine.createSpy('back');

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, IonicModule.forRoot()],
      providers: [
        {
          provide: WarehouseApplicationService,
          useValue: {
            detail: detailSpy,
            save: saveSpy,
            cancel: cancelSpy,
          }
        },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '0' } } } },
        { provide: AlertController, useValue: { create: alertCreateSpy } },
        { provide: LoadingController, useValue: { create: loadingCreateSpy } },
        { provide: NavController, useValue: { back: navBackSpy } },
      ],
      declarations: [WarehouseApplicationDetailPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    detailSpy.calls.reset();
    detailSpy.and.returnValue(of({ Success: true, Data: null }));
    saveSpy.calls.reset();
    saveSpy.and.returnValue(of({ Success: true }));
    cancelSpy.calls.reset();
    cancelSpy.and.returnValue(of({ Success: true }));
    alertCreateSpy.calls.reset();
    loadingCreateSpy.calls.reset();
    navBackSpy.calls.reset();
  });

  it('should create', () => {
    createComponent();
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('should show skeleton while existing detail is loading', () => {
    const pending$ = new Subject<unknown>();
    detailSpy.and.returnValue(pending$.asObservable());
    createComponent('8');

    fixture.detectChanges();

    expect(component.isLoading).toBe(true);
    expect(fixture.nativeElement.querySelector('.detail-skeleton')).toBeTruthy();
  });

  it('should load existing application into form', () => {
    detailSpy.and.returnValue(of({
      Success: true,
      Data: { Id: 8, ReferenceNumber: 'HK20260701', Piece: 3, Source: '自行送货', Amount: 143, Status: 1 }
    }));
    createComponent('8');

    fixture.detectChanges();

    expect(component.form.get('ReferenceNumber').value).toBe('HK20260701');
    expect(component.status).toBe(1);
    expect(component.isEditable).toBe(false);
  });

  it('should enter error state when detail fails', () => {
    detailSpy.and.returnValue(throwError(() => new Error('network')));
    createComponent('8');

    fixture.detectChanges();

    expect(component.loadError).toBe(true);
    expect(alertCreateSpy).toHaveBeenCalled();
  });

  it('should uppercase reference number and calculate amount', () => {
    createComponent();
    fixture.detectChanges();

    component.form.get('ReferenceNumber').setValue('hk20260701');
    component.form.get('Piece').setValue(11);

    expect(component.form.get('ReferenceNumber').value).toBe('HK20260701');
    expect(component.form.get('Amount').value).toBe(285);
  });

  it('should validate before save', () => {
    createComponent();
    fixture.detectChanges();

    component.save();

    expect(alertCreateSpy).toHaveBeenCalled();
    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('should save valid application with current id and raw amount', async () => {
    createComponent('8');
    fixture.detectChanges();
    component.form.patchValue({
      ReferenceNumber: 'HK20260701',
      Piece: 3,
      Source: '自行送货',
      Amount: 143,
    });

    component.save();
    await Promise.resolve();

    expect(saveSpy).toHaveBeenCalledWith({
      Id: 8,
      ReferenceNumber: 'HK20260701',
      Piece: 3,
      Source: '自行送货',
      Amount: 143,
      Status: 0,
    });
    expect(navBackSpy).toHaveBeenCalled();
  });

  it('should cancel after confirmation', async () => {
    createComponent('8');
    fixture.detectChanges();

    component.cancel();
    await Promise.resolve();
    const alertConfig = alertCreateSpy.calls.mostRecent().args[0];
    alertConfig.buttons[1].handler();
    await Promise.resolve();

    expect(cancelSpy).toHaveBeenCalledWith(8);
    expect(navBackSpy).toHaveBeenCalled();
  });
});
