import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AlertController, IonicModule, LoadingController, ModalController, NavController, ToastController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { of } from 'rxjs';

import { ReturnApplyPage } from './return-apply.page';
import { ReturnService } from 'src/app/providers/return.service';

describe('ReturnApplyPage', () => {
  let component: ReturnApplyPage;
  let fixture: ComponentFixture<ReturnApplyPage>;

  const navBackSpy = jasmine.createSpy('navBack');
  const alertCreateSpy = jasmine.createSpy('alertCreate').and.returnValue(Promise.resolve({ present: () => Promise.resolve() }));
  const toastCreateSpy = jasmine.createSpy('toastCreate').and.returnValue(Promise.resolve({ present: () => Promise.resolve() }));
  const loadingPresentSpy = jasmine.createSpy('loadingPresent').and.returnValue(Promise.resolve());
  const loadingDismissSpy = jasmine.createSpy('loadingDismiss').and.returnValue(Promise.resolve());

  const applySpy = jasmine.createSpy('apply').and.returnValue(of({
    AllowApply: true,
    RequiredDate: '2026-05-23',
    ReferenceNumber: 'RGD-001'
  }));
  const apply1Spy = jasmine.createSpy('apply1').and.returnValue(of({ IsSuccess: true }));
  const fillSpy = jasmine.createSpy('fill').and.returnValue(of({ RequiredDate: '2026-05-23', ReferenceNumber: 'RGD-002' }));
  const fill1Spy = jasmine.createSpy('fill1').and.returnValue(of({ IsSuccess: true }));

  const mockModal = {
    onDidDismiss: () => Promise.resolve({ data: { val: '张三 13800138000' } }),
    present: () => Promise.resolve()
  };

  const mockRoute = {
    snapshot: {
      queryParams: {
        type: 0,
        ids: '1,2'
      }
    }
  } as any;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule, FormsModule, ReactiveFormsModule, IonicModule.forRoot()],
      providers: [
        CookieService,
        { provide: ActivatedRoute, useValue: mockRoute },
        { provide: NavController, useValue: { back: navBackSpy } },
        {
          provide: ReturnService,
          useValue: {
            apply: applySpy,
            apply1: apply1Spy,
            fill: fillSpy,
            fill1: fill1Spy,
          },
        },
        { provide: AlertController, useValue: { create: alertCreateSpy } },
        { provide: ToastController, useValue: { create: toastCreateSpy } },
        { provide: ModalController, useValue: { create: jasmine.createSpy('modalCreate').and.returnValue(Promise.resolve(mockModal)) } },
        {
          provide: LoadingController,
          useValue: {
            create: () => Promise.resolve({ present: loadingPresentSpy }),
            dismiss: loadingDismissSpy,
          },
        },
      ],
      declarations: [ ReturnApplyPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReturnApplyPage);
    component = fixture.componentInstance;
    component.btnSubmit = { disabled: false } as any;
    navBackSpy.calls.reset();
    applySpy.calls.reset();
    apply1Spy.calls.reset();
    apply1Spy.and.returnValue(of({ IsSuccess: true }));
    fillSpy.calls.reset();
    fill1Spy.calls.reset();
    alertCreateSpy.calls.reset();
    toastCreateSpy.calls.reset();
    loadingDismissSpy.calls.reset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load apply defaults on init when type is 0', () => {
    component.type = 0;
    component.ids = '1,2';

    component.ngOnInit();

    expect(applySpy).toHaveBeenCalledWith('1,2');
    expect(component.applyForm.controls['RequiredDate'].value).toBe('2026-05-23');
    expect(component.applyForm.controls['ReferenceNumber'].value).toBe('RGD-001');
  });

  it('should disable submit and navigate back after successful apply submit', fakeAsync(() => {
    const form = component.applyForm.value;

    component.doApply(form);
    tick();

    expect(component.btnSubmit.disabled).toBe(true);
    expect(apply1Spy).toHaveBeenCalled();
    expect(navBackSpy).toHaveBeenCalled();
    expect(loadingDismissSpy).toHaveBeenCalled();
  }));

  it('should re-enable submit and show alert when apply submit fails', fakeAsync(() => {
    apply1Spy.and.returnValue(of({ IsSuccess: false, ErrorMessage: '提交失败' }));

    component.doApply(component.applyForm.value);
    tick();

    expect(component.btnSubmit.disabled).toBe(false);
    expect(alertCreateSpy).toHaveBeenCalled();
  }));

  it('should dispatch doSubmit to fill flow when type is 1', () => {
    component.type = 1;
    spyOn(component, 'doFill');

    component.doSubmit(component.applyForm.value);

    expect(component.doFill).toHaveBeenCalled();
  });

  it('should fill contact info from history modal result', fakeAsync(() => {
    component.presentModal();
    tick();

    expect(component.applyForm.controls['PersonName'].value).toBe('张三');
    expect(component.applyForm.controls['MobilePhone'].value).toBe('13800138000');
  }));
});
