import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { of, throwError } from 'rxjs';
import { SubAccount } from 'src/app/interfaces/sub-account';
import { SubAccountService } from 'src/app/providers/sub-account.service';
import { UiFeedbackService } from 'src/app/providers/ui-feedback.service';

import { SubAccountPage } from './sub-account.page';

describe('SubAccountPage', () => {
  let component: SubAccountPage;
  let fixture: ComponentFixture<SubAccountPage>;
  let getListSpy: jasmine.Spy;
  let navigateForwardSpy: jasmine.Spy;
  let presentToastSpy: jasmine.Spy;

  beforeEach(async(() => {
    getListSpy = jasmine.createSpy('getList').and.returnValue(of([]));
    navigateForwardSpy = jasmine.createSpy('navigateForward');
    presentToastSpy = jasmine.createSpy('presentToast').and.returnValue(Promise.resolve());

    TestBed.configureTestingModule({
      imports: [FormsModule, ReactiveFormsModule, IonicModule.forRoot()],
      providers: [
        { provide: SubAccountService, useValue: { getList: getListSpy } },
        { provide: NavController, useValue: { navigateForward: navigateForwardSpy } },
        { provide: UiFeedbackService, useValue: { presentToast: presentToastSpy } }
      ],
      declarations: [SubAccountPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SubAccountPage);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('should load sub accounts', () => {
    getListSpy.and.returnValue(of([{ ObjectId: 12, ContactName: '张三', MobilePhone: '13800138000' }]));

    fixture.detectChanges();

    expect(component.items.length).toBe(1);
    expect(component.isLoaded).toBe(true);
    expect(component.loadError).toBe(false);
  });

  it('should mark load error when request fails', () => {
    getListSpy.and.returnValue(throwError(() => new Error('network')));

    fixture.detectChanges();

    expect(component.loadError).toBe(true);
    expect(presentToastSpy).toHaveBeenCalledWith('子账号列表加载失败，请稍后重试', 2200, 'middle', undefined, 'danger');
  });

  it('should navigate to add and detail pages', () => {
    fixture.detectChanges();

    component.add();
    component.detail(Object.assign(new SubAccount(), { ObjectId: 12, ContactName: '张三', MobilePhone: '13800138000' }));

    expect(navigateForwardSpy).toHaveBeenCalledWith('/member/sub-account-detail/');
    expect(navigateForwardSpy).toHaveBeenCalledWith('/member/sub-account-detail/12');
  });
});
