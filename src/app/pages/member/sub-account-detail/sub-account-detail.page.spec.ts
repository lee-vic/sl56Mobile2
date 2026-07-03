import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { AlertController, IonicModule, NavController } from '@ionic/angular';
import { of, throwError } from 'rxjs';
import { SubAccountService } from 'src/app/providers/sub-account.service';
import { UiFeedbackService } from 'src/app/providers/ui-feedback.service';

import { SubAccountDetailPage } from './sub-account-detail.page';

describe('SubAccountDetailPage', () => {
  let component: SubAccountDetailPage;
  let fixture: ComponentFixture<SubAccountDetailPage>;
  let detailSpy: jasmine.Spy;
  let createSpy: jasmine.Spy;
  let editSpy: jasmine.Spy;
  let deleteSpy: jasmine.Spy;
  let backSpy: jasmine.Spy;
  let presentToastSpy: jasmine.Spy;

  beforeEach(async(() => {
    detailSpy = jasmine.createSpy('detail').and.returnValue(of({}));
    createSpy = jasmine.createSpy('create').and.returnValue(of({ Success: true }));
    editSpy = jasmine.createSpy('edit').and.returnValue(of({ Success: true }));
    deleteSpy = jasmine.createSpy('delete').and.returnValue(of({ Success: true }));
    backSpy = jasmine.createSpy('back');
    presentToastSpy = jasmine.createSpy('presentToast').and.returnValue(Promise.resolve());

    TestBed.configureTestingModule({
      imports: [FormsModule, ReactiveFormsModule, IonicModule.forRoot()],
      providers: [
        { provide: SubAccountService, useValue: { detail: detailSpy, create: createSpy, edit: editSpy, delete: deleteSpy } },
        { provide: NavController, useValue: { back: backSpy } },
        { provide: UiFeedbackService, useValue: { presentToast: presentToastSpy } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '0' }) } } },
        AlertController
      ],
      declarations: [SubAccountDetailPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SubAccountDetailPage);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('should initialize new account mode with empty password', () => {
    fixture.detectChanges();

    expect(component.isNew).toBe(true);
    expect(component.title).toBe('新增子账号');
    expect(component.myForm.get('password').value).toBe('');
    expect(component.myForm.invalid).toBe(true);
  });

  it('should load detail into form for edit mode', () => {
    detailSpy.and.returnValue(of({
      ObjectId: 7,
      MobilePhone: '13800138000',
      ContactName: '李四',
      Password1: '',
      Discount: 0.9
    }));
    fixture.detectChanges();
    component.id = 7;
    component.isNew = false;

    component.loadDetail();

    expect(detailSpy).toHaveBeenCalledWith(7);
    expect(component.myForm.get('mobilephone').value).toBe('13800138000');
    expect(component.myForm.get('contactname').value).toBe('李四');
    expect(component.myForm.get('discount').value).toBe(0.9);
  });

  it('should save a new account and navigate back on success', () => {
    fixture.detectChanges();
    component.myForm.patchValue({
      mobilephone: '13800138000',
      contactname: '李四',
      password: 'abc12345',
      discount: 1
    });

    component.onSubmit(component.myForm.value);

    expect(createSpy).toHaveBeenCalled();
    expect(backSpy).toHaveBeenCalled();
    expect(presentToastSpy).toHaveBeenCalledWith('子账号已新增', 1600, 'middle', undefined, 'success');
  });

  it('should show load error when detail request fails', () => {
    detailSpy.and.returnValue(throwError(() => new Error('network')));
    fixture.detectChanges();
    component.id = 7;
    component.isNew = false;

    component.loadDetail();

    expect(component.loadError).toBe(true);
    expect(presentToastSpy).toHaveBeenCalledWith('子账号详情加载失败，请稍后重试', 2200, 'middle', undefined, 'danger');
  });
});
