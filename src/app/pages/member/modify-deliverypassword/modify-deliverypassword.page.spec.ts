import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { IonicModule, NavController, ToastController } from '@ionic/angular';

import { ModifyDeliverypasswordPage } from './modify-deliverypassword.page';
import { UserService } from 'src/app/providers/user.service';

describe('ModifyDeliverypasswordPage', () => {
  let component: ModifyDeliverypasswordPage;
  let fixture: ComponentFixture<ModifyDeliverypasswordPage>;
  let userServiceSpy: jasmine.SpyObj<UserService>;
  let navCtrlSpy: jasmine.SpyObj<NavController>;
  let toastCtrlSpy: jasmine.SpyObj<ToastController>;

  beforeEach(async(() => {
    userServiceSpy = jasmine.createSpyObj('UserService', ['changeDeliveryPassword']);
    navCtrlSpy = jasmine.createSpyObj('NavController', ['back']);
    toastCtrlSpy = jasmine.createSpyObj('ToastController', ['create']);
    toastCtrlSpy.create.and.returnValue(Promise.resolve({ present: () => Promise.resolve() } as any));

    TestBed.configureTestingModule({
      imports: [FormsModule, ReactiveFormsModule, IonicModule.forRoot()],
      declarations: [ModifyDeliverypasswordPage],
      providers: [
        { provide: UserService, useValue: userServiceSpy },
        { provide: NavController, useValue: navCtrlSpy },
        { provide: ToastController, useValue: toastCtrlSpy }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModifyDeliverypasswordPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('newPassword1 should be invalid when not a 6-digit number', () => {
    component.myForm.controls.newPassword1.setValue('abc123');
    expect(component.myForm.controls.newPassword1.valid).toBe(false);

    component.myForm.controls.newPassword1.setValue('123456');
    expect(component.myForm.controls.newPassword1.valid).toBe(true);
  });

  it('doNext should show success toast and navigate back on success', fakeAsync(() => {
    userServiceSpy.changeDeliveryPassword.and.returnValue(of({ Success: true, ErrMsg: '' } as any));

    component.doNext({
      password: '123456',
      newPassword1: '654321',
      newPassword2: '654321'
    });

    expect(userServiceSpy.changeDeliveryPassword).toHaveBeenCalled();
    tick();
    expect(toastCtrlSpy.create).toHaveBeenCalledWith(jasmine.objectContaining({ message: '交货密码修改成功' }));

    tick(1000);
    expect(navCtrlSpy.back).toHaveBeenCalled();
  }));

  it('doNext should show error toast and keep current page on failure', fakeAsync(() => {
    userServiceSpy.changeDeliveryPassword.and.returnValue(of({ Success: false, ErrMsg: '失败原因' } as any));

    component.doNext({
      password: '123456',
      newPassword1: '654321',
      newPassword2: '654321'
    });

    tick();
    expect(toastCtrlSpy.create).toHaveBeenCalledWith(jasmine.objectContaining({ message: '失败原因' }));
    expect(navCtrlSpy.back).not.toHaveBeenCalled();
  }));
});
