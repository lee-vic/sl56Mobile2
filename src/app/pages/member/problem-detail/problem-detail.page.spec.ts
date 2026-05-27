import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { AlertController, LoadingController, NavController } from '@ionic/angular';
import { CookieService } from 'ngx-cookie-service';
import { of } from 'rxjs';

import { ProblemDetailPage } from './problem-detail.page';
import { ProblemService } from 'src/app/providers/problem.service';
import { CommonService } from 'src/app/providers/common.service';

describe('ProblemDetailPage', () => {
  let component: ProblemDetailPage;
  let fixture: ComponentFixture<ProblemDetailPage>;
  const mockProblemService = {
    getProblemDetail: jasmine.createSpy('getProblemDetail').and.returnValue(of({
      Problem: { ProcessTypeList: [], ProcessSetting4: [], Pages: [], Status: 0 },
      ProcessResult: {}
    })),
    isWeAppUploadFile: jasmine.createSpy('isWeAppUploadFile').and.returnValue(of(false)),
    complete: jasmine.createSpy('complete').and.returnValue(of({ Result: true })),
    confirm: jasmine.createSpy('confirm').and.returnValue(of({ IsSuccess: true })),
    invoicePretreatment: jasmine.createSpy('invoicePretreatment').and.returnValue(of({ Result: true, Path: '' })),
    deleteProblemTempFile: jasmine.createSpy('deleteProblemTempFile').and.returnValue(of({}))
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule, FormsModule, ReactiveFormsModule, IonicModule.forRoot()],
      providers: [
        CookieService,
        { provide: ProblemService, useValue: mockProblemService },
        { provide: CommonService, useValue: { getJsSdkConfig: () => of('{}') } },
        { provide: NavController, useValue: { navigateForward: jasmine.createSpy('navigateForward') } },
        { provide: AlertController, useValue: { create: () => Promise.resolve({ present: () => Promise.resolve() }) } },
        { provide: LoadingController, useValue: { create: () => Promise.resolve({ present: () => Promise.resolve() }), dismiss: () => Promise.resolve() } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: { problemid: 10 },
              paramMap: convertToParamMap({ id: '20' })
            },
            queryParams: of({})
          }
        },
        { provide: Router, useValue: { getCurrentNavigation: () => null, url: '/member/problem-detail/20', navigate: jasmine.createSpy('navigate') } },
      ],
      declarations: [ ProblemDetailPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProblemDetailPage);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should detect available process types', () => {
    component.data = { Problem: { ProcessTypeList: [1, 3, 4] } } as any;

    expect(component.hasProcessType(3)).toBe(true);
    expect(component.hasProcessType(2)).toBe(false);
  });

  it('should block submit when type4 exists but no checklist item is selected', () => {
    component.data = { Problem: { ProcessTypeList: [4] } } as any;
    component.checkListValue = [false, false];
    component.isSubmiting = false;
    component.isFileProcessing = false;
    component.isWeAppUploadFile = false;

    const result = component.canSubmit({ valid: true } as any);

    expect(result).toBe(false);
  });

  it('should allow submit when form is invalid but weapp file exists', () => {
    component.data = { Problem: { ProcessTypeList: [3] } } as any;
    component.checkListValue = [];
    component.isSubmiting = false;
    component.isFileProcessing = false;
    component.isWeAppUploadFile = true;

    const result = component.canSubmit({ valid: false } as any);

    expect(result).toBe(true);
  });

  it('should clear failure messages when process type changes', () => {
    component.submitFailMessage = 'old-submit-error';
    component.confirmFailMessage = 'old-confirm-error';
    spyOn<any>(component, 'renderWeAppButtonIfNeeded');

    component.processTypeChanged({ detail: { value: 'Page2' } });

    expect(component.processType).toBe('Page2');
    expect(component.submitFailMessage).toBeNull();
    expect(component.confirmFailMessage).toBeNull();
    expect((component as any).renderWeAppButtonIfNeeded).toHaveBeenCalled();
  });
});
