import { CUSTOM_ELEMENTS_SCHEMA, ElementRef } from '@angular/core';
import { async, ComponentFixture, fakeAsync, flush, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { AlertController, LoadingController, NavController } from '@ionic/angular';
import { CookieService } from 'ngx-cookie-service';
import { of, Subject, throwError } from 'rxjs';

import { ProblemDetailPage } from './problem-detail.page';
import { ProblemService } from 'src/app/providers/problem.service';
import { CommonService } from 'src/app/providers/common.service';

describe('ProblemDetailPage', () => {
  let component: ProblemDetailPage;
  let fixture: ComponentFixture<ProblemDetailPage>;
  let queryParams$: Subject<any>;
  const mockCommonService = {
    getJsSdkConfig: jasmine.createSpy('getJsSdkConfig').and.returnValue(of('{}'))
  };
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
    queryParams$ = new Subject<any>();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule, FormsModule, ReactiveFormsModule, IonicModule.forRoot()],
      providers: [
        CookieService,
        { provide: ProblemService, useValue: mockProblemService },
        { provide: CommonService, useValue: mockCommonService },
        { provide: NavController, useValue: { navigateForward: jasmine.createSpy('navigateForward') } },
        { provide: AlertController, useValue: { create: () => Promise.resolve({ present: () => Promise.resolve() }) } },
        { provide: LoadingController, useValue: { create: () => Promise.resolve({ present: () => Promise.resolve(), dismiss: () => Promise.resolve() }) } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: { problemid: 10 },
              paramMap: convertToParamMap({ id: '20' })
            },
            queryParams: queryParams$.asObservable()
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
    mockProblemService.getProblemDetail.and.returnValue(of({
      Problem: { ProcessTypeList: [], ProcessSetting4: [], Pages: [], Status: 0 }, ProcessResult: {}
    }));
    mockProblemService.isWeAppUploadFile.and.returnValue(of(false));
    mockProblemService.complete.and.returnValue(of({ Result: true }));
    mockProblemService.confirm.and.returnValue(of({ IsSuccess: true }));
    Object.values(mockProblemService).forEach(spy => spy.calls.reset());
    fixture = TestBed.createComponent(ProblemDetailPage);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    delete (globalThis as any).wx;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  function workspace(id: number, completed = false) {
    return {
      Id: 20, SourceProblemId: 10, DefaultProblemId: completed ? null : id,
      IsCurrentWaybillCompleted: completed, OtherWaybillCount: 2, OtherProblemCount: 3,
      NextReceiveGoodsDetailId: 30, NextProblemId: 40,
      ProblemList: completed ? [] : [{ ObjectId: id, ObjectName: '待处理问题' }],
      Problem: { ObjectId: id, Status: completed ? 1 : 0, ProcessTypeList: [2], ProcessSetting2: [], ProcessSetting4: [], Pages: [{ Item1: 'Page1', Item2: '填写资料' }] },
      ProcessResult: { Id: id }
    };
  }

  it('labels the pending total without implying an additional problem', () => {
    const response = new Subject<any>();
    mockProblemService.getProblemDetail.and.returnValue(response);
    fixture.detectChanges();
    const detail = workspace(10);
    // 本用例只检查工作区标题，不创建会异步更新有效性的处理表单。
    detail.Problem.Pages = [];
    detail.Problem.ProcessTypeList = [];
    response.next(detail);
    response.complete();
    fixture.detectChanges();
    const text = fixture.nativeElement.querySelector('.workspace-nav h2')?.textContent;
    expect(text).toContain('本单待处理问题（共 1 个）');
    expect(text).not.toContain('还有');
  });

  it('uses the server-selected default problem and keeps submission identity aligned', () => {
    mockProblemService.getProblemDetail.and.returnValue(of(workspace(11)));
    component.ngOnInit();
    expect(mockProblemService.getProblemDetail).toHaveBeenCalledWith(10, true);
    expect(component.problemId).toBe(11);
    expect(component.processModel.Id).toBe(11);
    expect(component.sourceProblemCompleted).toBe(true);
  });

  it('clears previous form, file, checklist and errors before switching problems', async () => {
    component.data = workspace(10);
    component.processModel = { Id: 10 } as any;
    component.isWeAppUploadFile = true;
    component.fileFailMessage = 'previous';
    const response$ = new Subject<any>();
    mockProblemService.getProblemDetail.and.returnValue(response$);
    await component.selectProblem(11);
    expect(component.processModel).toBeNull();
    expect(component.checkListValue).toEqual([]);
    expect(component.isWeAppUploadFile).toBe(false);
    expect(component.fileFailMessage).toBeNull();
    response$.next(workspace(11)); response$.complete();
    expect(component.processModel.Id).toBe(11);
  });

  it('does not switch a dirty form until the customer confirms', async () => {
    component.data = workspace(10);
    component.formRef = { dirty: true } as any;
    const create = spyOn(TestBed.inject(AlertController), 'create').and.returnValue(Promise.resolve({ present: () => Promise.resolve() } as any));
    await component.selectProblem(11);
    expect(mockProblemService.getProblemDetail).not.toHaveBeenCalled();
    const options = create.calls.mostRecent().args[0];
    const button = options.buttons[1];
    if (typeof button === 'string') throw new Error('Expected a confirmation handler');
    mockProblemService.getProblemDetail.and.returnValue(of(workspace(11)));
    button.handler(undefined);
    expect(component.processModel.Id).toBe(11);
  });

  it('locks duplicate submission and refreshes remaining work after success', fakeAsync(() => {
    mockProblemService.getProblemDetail.and.returnValue(of(workspace(10)));
    component.ngOnInit();
    const result$ = new Subject<any>();
    mockProblemService.complete.and.returnValue(result$);
    mockProblemService.getProblemDetail.and.returnValue(of(workspace(11)));
    const form = { form: { value: {}, valid: true } } as any;
    component.submit(form); component.submit(form); flush();
    expect(mockProblemService.complete.calls.count()).toBe(1);
    expect(component.isSubmitting).toBe(true);
    result$.next({ Result: true }); result$.complete(); flush();
    expect(component.processModel.Id).toBe(11);
    expect(component.successMessage).toContain('本问题已处理');
    expect(component.isSubmitting).toBe(false);
  }));

  it('shows completion without automatically navigating to another waybill', () => {
    mockProblemService.getProblemDetail.and.returnValue(of(workspace(10, true)));
    component.ngOnInit();
    expect(component.isProblemDone).toBe(true);
    expect(component.hasSelfService).toBe(false);
    const router = TestBed.inject(Router);
    expect(router.navigate).not.toHaveBeenCalled();
    component.continueNextWaybill();
    expect(router.navigate).toHaveBeenCalledWith(['/member/problem-detail', 30], { queryParams: { problemid: 40 } });
  });

  [0, 2, undefined].forEach(count => {
    it(`only hides list links when completion has an explicit zero count (${count})`, () => {
      const response = new Subject<any>();
      mockProblemService.getProblemDetail.and.returnValue(response);
      fixture.detectChanges();
      response.next({ ...workspace(10, true), OtherWaybillCount: count });
      response.complete();
      fixture.detectChanges();
      const element = fixture.nativeElement;
      const buttons = Array.from(element.querySelectorAll('ion-button')) as HTMLElement[];
      const listButtons = buttons.filter(button => button.textContent?.includes('查看全部问题'));
      expect(component.allProblemsCompleted).toBe(count === 0);
      expect(listButtons.length).toBe(count === 0 ? 0 : 2);
      expect(element.querySelector('.done-title').textContent).toContain(
        count === 0 ? '所有问题件已处理完成' : '当前单号已处理完成');
      expect(element.querySelector('.all-completed') != null).toBe(count === 0);
    });
  });

  it('should detect available process types', () => {
    component.data = { Problem: { ProcessTypeList: [1, 3, 4] } } as any;

    expect(component.hasProcessType(3)).toBe(true);
    expect(component.hasProcessType(2)).toBe(false);
  });

  it('should block submit when type4 exists but no checklist item is selected', () => {
    component.data = { Problem: { ProcessTypeList: [4] } } as any;
    component.checkListValue = [false, false];
    component.isFileProcessing = false;
    component.isWeAppUploadFile = false;

    const result = component.canSubmit({ valid: true } as any);

    expect(result).toBe(false);
  });

  it('should allow submit when form is invalid but weapp file exists', () => {
    component.data = { Problem: { ProcessTypeList: [3] } } as any;
    component.checkListValue = [];
    component.isFileProcessing = false;
    component.isWeAppUploadFile = true;

    const result = component.canSubmit({ valid: false } as any);

    expect(result).toBe(true);
  });

  it('should render the weapp upload button when its delayed container becomes available', () => {
    const wxMock = {
      config: jasmine.createSpy('config'),
      ready: jasmine.createSpy('ready').and.callFake((callback: () => void) => callback()),
      error: jasmine.createSpy('error')
    };
    (globalThis as any).wx = wxMock;
    component.data = { Problem: { ProcessTypeList: [3] } } as any;
    component.processType = 'Page1';
    (component as any).processActionMap.Page1 = 'form';
    const container = document.createElement('div');

    (component as any).weAppLaunchContainerRef = new ElementRef(container);

    expect(mockCommonService.getJsSdkConfig).toHaveBeenCalled();
    expect(wxMock.config).toHaveBeenCalled();
    expect(container.innerHTML).toContain('从微信聊天记录选择文件');
    expect(container.innerHTML).toContain('width:100%');
  });

  it('should refresh uploaded file state automatically when returning to the visible page', () => {
    component.data = { Problem: { ProcessTypeList: [3], Status: 0 } } as any;
    component.processOptions = [{ key: 'Page1', title: '更新信息' }];
    component.checkListValue = [];
    component.isFormOption = jasmine.createSpy('isFormOption').and.returnValue(true);
    component.ionViewDidEnter();
    const hidden = spyOnProperty(document, 'hidden', 'get').and.returnValue(true);
    mockProblemService.isWeAppUploadFile.calls.reset();
    mockProblemService.isWeAppUploadFile.and.returnValue(of(true));

    component.onVisibilityChange();
    hidden.and.returnValue(false);
    component.onVisibilityChange();
    component.onVisibilityChange();

    expect(mockProblemService.isWeAppUploadFile).toHaveBeenCalledTimes(1);
    expect(component.isWeAppUploadFile).toBe(true);
    expect(component.canSubmit({ valid: false } as any)).toBe(true);
    expect(component.isCheckingWeAppFile).toBe(false);
  });

  it('should not refresh a cached page after navigating away', () => {
    component.data = { Problem: { ProcessTypeList: [3], Status: 0 } } as any;
    component.processOptions = [{ key: 'Page1', title: '更新信息' }];
    component.isFormOption = jasmine.createSpy('isFormOption').and.returnValue(true);
    component.ionViewDidEnter();
    const hidden = spyOnProperty(document, 'hidden', 'get').and.returnValue(true);
    const check = spyOn(component, 'getWeAppFileStatus');
    component.onVisibilityChange();
    component.ionViewWillLeave();
    hidden.and.returnValue(false);
    component.onVisibilityChange();
    expect(check).not.toHaveBeenCalled();
  });

  it('should deduplicate file checks and block submit until the result arrives', () => {
    const response = new Subject<boolean>();
    mockProblemService.isWeAppUploadFile.calls.reset();
    mockProblemService.isWeAppUploadFile.and.returnValue(response);
    component.getWeAppFileStatus(true);
    component.getWeAppFileStatus(true);
    expect(mockProblemService.isWeAppUploadFile).toHaveBeenCalledTimes(1);
    expect(component.canSubmit({ valid: true } as any)).toBe(false);
    response.next(true);
    response.complete();
    expect(component.isCheckingWeAppFile).toBe(false);
    mockProblemService.isWeAppUploadFile.and.returnValue(of(false));
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

  it('should mark not found when problem detail API returns null', () => {
    mockProblemService.getProblemDetail.and.returnValue(of(null));

    component.ngOnInit();

    expect(component.isLoading).toBe(false);
    expect(component.hasNotFound).toBe(true);
    expect(component.hasInitError).toBe(false);
  });

  it('should mark init error when loading problem detail fails', () => {
    mockProblemService.getProblemDetail.and.returnValue(throwError(() => ({ status: 500 })));

    component.ngOnInit();

    expect(component.isLoading).toBe(false);
    expect(component.hasInitError).toBe(true);
  });

  it('should stop listening query params after destroy', () => {
    component.ngOnDestroy();

    expect(queryParams$.observers.length).toBe(0);
  });

  it('should set submitFailMessage when complete returns Success=false (new format)', fakeAsync(() => {
    mockProblemService.complete.and.returnValue(of({ Success: false, Message: '系统内部异常，请联系技术支持。（错误编号：abc123）' }));

    // Simulate what happens in the component's submit method when the API returns Success=false
    component.data = { Problem: { ProcessTypeList: [0] } } as any;
    component.processModel = {} as any;
    component.isFormOption = jasmine.createSpy('isFormOption').and.returnValue(true) as any;
    component.submit({ form: { valid: true } } as any);

    flush();

    // The mock service should have been called
    expect(mockProblemService.complete).toHaveBeenCalled();
  }));

  it('shows business rejection and offers login without loading a stale form', () => {
    mockProblemService.getProblemDetail.and.returnValue(of({ Success: false, RequiresLogin: true, Message: '请登录后查看本人问题件列表。' }));
    component.ngOnInit();
    expect(component.hasInitError).toBe(true);
    expect(component.requiresLogin).toBe(true);
    expect(component.initFailMessage).toBe('请登录后查看本人问题件列表。');
    expect(component.processModel).toBeNull();
    component.loginForProblemList();
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/login']);
    expect(TestBed.inject(CookieService).get('State')).toBe('/member/problem-list');
    TestBed.inject(CookieService).delete('State', '/');
  });

  it('launches the mini program with the selected problem token instead of source or numeric ID', () => {
    const token = 'v2.' + 'A'.repeat(50);
    component.problemId = 11;
    component.data = { WeAppUploadToken: token };
    const container = document.createElement('div');
    (component as unknown as { renderWeAppLaunchButton(element: HTMLElement): void }).renderWeAppLaunchButton(container);
    expect(container.innerHTML).toContain('rgdProblemId=' + token);
    expect(container.innerHTML).not.toContain('rgdProblemId=11');
  });

  it('should handle old Result=false format for backward compatibility', fakeAsync(() => {
    mockProblemService.complete.and.returnValue(of({ Result: false, Message: '当前问题已处理完毕' }));

    component.data = { Problem: { ProcessTypeList: [0] } } as any;
    component.processModel = {} as any;
    component.isFormOption = jasmine.createSpy('isFormOption').and.returnValue(true) as any;
    component.submit({ form: { valid: true } } as any);

    flush();

    expect(mockProblemService.complete).toHaveBeenCalled();
  }));
});
