import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { of, throwError } from 'rxjs';
import { PriceService } from 'src/app/providers/price.service';
import { UiFeedbackService } from 'src/app/providers/ui-feedback.service';

import { PriceListPage } from './price-list.page';

describe('PriceListPage', () => {
  let component: PriceListPage;
  let fixture: ComponentFixture<PriceListPage>;
  let getListSpy: jasmine.Spy;
  let presentToastSpy: jasmine.Spy;

  beforeEach(async(() => {
    getListSpy = jasmine.createSpy('getList').and.returnValue(of({ AllowDownloadPrice: false, Items: [] }));
    presentToastSpy = jasmine.createSpy('presentToast').and.returnValue(Promise.resolve());

    TestBed.configureTestingModule({
      imports: [FormsModule, ReactiveFormsModule, IonicModule.forRoot()],
      providers: [
        { provide: PriceService, useValue: { getList: getListSpy } },
        { provide: UiFeedbackService, useValue: { presentToast: presentToastSpy } }
      ],
      declarations: [PriceListPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PriceListPage);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('should load prices and expose full download state', () => {
    getListSpy.and.returnValue(of({
      AllowDownloadPrice: true,
      Items: [{ Name: '欧洲普货', ModeOfTransportName: '小包专线', StartDate: '2026-07-01', EndDate: '2026-07-31', Currency: 'CNY' }]
    }));

    fixture.detectChanges();

    expect(component.items.length).toBe(1);
    expect(component.allowDownload).toBe(true);
    expect(component.isLoaded).toBe(true);
  });

  it('should show empty state when no prices exist', () => {
    fixture.detectChanges();

    expect(component.items).toEqual([]);
    expect(component.allowDownload).toBe(false);
    expect(component.loadError).toBe(false);
  });

  it('should mark load error when request fails', () => {
    getListSpy.and.returnValue(throwError(() => new Error('network')));

    fixture.detectChanges();

    expect(component.loadError).toBe(true);
    expect(presentToastSpy).toHaveBeenCalledWith('报价列表加载失败，请稍后重试', 2200, 'middle', undefined, 'danger');
  });
});
