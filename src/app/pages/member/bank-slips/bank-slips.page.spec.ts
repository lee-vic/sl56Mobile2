import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { of, throwError } from 'rxjs';
import { BankSlipsService } from 'src/app/providers/bank-slips.service';
import { UiFeedbackService } from 'src/app/providers/ui-feedback.service';

import { BankSlipsPage } from './bank-slips.page';

describe('BankSlipsPage', () => {
  let component: BankSlipsPage;
  let fixture: ComponentFixture<BankSlipsPage>;
  let getListSpy: jasmine.Spy;
  let deleteSpy: jasmine.Spy;
  let presentToastSpy: jasmine.Spy;

  beforeEach(async(() => {
    getListSpy = jasmine.createSpy('getList').and.returnValue(of([]));
    deleteSpy = jasmine.createSpy('delete').and.returnValue(of({ Success: true }));
    presentToastSpy = jasmine.createSpy('presentToast').and.returnValue(Promise.resolve());

    TestBed.configureTestingModule({
      imports: [FormsModule, ReactiveFormsModule, IonicModule.forRoot()],
      providers: [
        { provide: BankSlipsService, useValue: { getList: getListSpy, upload: jasmine.createSpy('upload'), delete: deleteSpy } },
        { provide: UiFeedbackService, useValue: { presentToast: presentToastSpy } },
        { provide: NavController, useValue: {} }
      ],
      declarations: [BankSlipsPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BankSlipsPage);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('should load slips and append download url', () => {
    getListSpy.and.returnValue(of([{ Id: 8, Name: '付款凭证.pdf', Extension: 'pdf', Status: '待确认', Date: '2026-07-02', Url: '' }]));

    fixture.detectChanges();

    expect(component.items.length).toBe(1);
    expect(component.items[0].Url).toContain('/UploadBankSlips/Detail/8');
    expect(component.isLoaded).toBe(true);
    expect(component.loadError).toBe(false);
  });

  it('should mark load error when list request fails', () => {
    getListSpy.and.returnValue(throwError(() => new Error('network')));

    fixture.detectChanges();

    expect(component.loadError).toBe(true);
    expect(component.isLoaded).toBe(true);
    expect(presentToastSpy).toHaveBeenCalledWith('水单列表加载失败，请稍后重试', 2200, 'middle', undefined, 'danger');
  });

  it('should delete a slip and reload list on success', () => {
    getListSpy.and.returnValues(of([]), of([]));
    fixture.detectChanges();

    component.doDelete(8);

    expect(deleteSpy).toHaveBeenCalledWith(8);
    expect(getListSpy).toHaveBeenCalledTimes(2);
    expect(presentToastSpy).toHaveBeenCalledWith('水单已删除', 1600, 'middle', undefined, 'success');
  });
});
