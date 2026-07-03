import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AlertController, IonicModule } from '@ionic/angular';
import { of, throwError } from 'rxjs';
import { UiFeedbackService } from 'src/app/providers/ui-feedback.service';
import { WechatBindingService } from 'src/app/providers/wechat-binding.service';

import { WechatBindingPage } from './wechat-binding.page';

describe('WechatBindingPage', () => {
  let component: WechatBindingPage;
  let fixture: ComponentFixture<WechatBindingPage>;
  let getListSpy: jasmine.Spy;
  let deleteSpy: jasmine.Spy;
  let presentToastSpy: jasmine.Spy;

  beforeEach(async(() => {
    getListSpy = jasmine.createSpy('getList').and.returnValue(of([]));
    deleteSpy = jasmine.createSpy('delete').and.returnValue(of([]));
    presentToastSpy = jasmine.createSpy('presentToast').and.returnValue(Promise.resolve());

    TestBed.configureTestingModule({
      imports: [FormsModule, ReactiveFormsModule, IonicModule.forRoot()],
      providers: [
        { provide: WechatBindingService, useValue: { getList: getListSpy, delete: deleteSpy } },
        { provide: UiFeedbackService, useValue: { presentToast: presentToastSpy } },
        AlertController
      ],
      declarations: [WechatBindingPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WechatBindingPage);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('should load bound wechat accounts', () => {
    getListSpy.and.returnValue(of([{ Id: 1, Name: '微信用户', ShortName: '用户' }]));

    fixture.detectChanges();

    expect(component.list.length).toBe(1);
    expect(component.isLoaded).toBe(true);
    expect(component.loadError).toBe(false);
  });

  it('should mark load error when request fails', () => {
    getListSpy.and.returnValue(throwError(() => new Error('network')));

    fixture.detectChanges();

    expect(component.loadError).toBe(true);
    expect(presentToastSpy).toHaveBeenCalledWith('微信绑定信息加载失败，请稍后重试', 2200, 'middle', undefined, 'danger');
  });

  it('should update list after deleting a binding', () => {
    getListSpy.and.returnValue(of([{ Id: 1, Name: '微信用户', ShortName: '用户' }]));
    deleteSpy.and.returnValue(of([{ Id: 2, Name: '保留用户', ShortName: '保留' }]));
    fixture.detectChanges();

    component.deleteBinding({
      Id: 1,
      Name: '微信用户',
      HeadUrl: '',
      ShortName: '用户',
      SubscribeMessageTypes: [],
      SubscribeMessageTypeNames: ''
    });

    expect(deleteSpy).toHaveBeenCalledWith(1);
    expect(component.list.length).toBe(1);
    expect(component.list[0].Id).toBe(2);
    expect(presentToastSpy).toHaveBeenCalledWith('微信绑定已解除', 1600, 'middle', undefined, 'success');
  });
});
