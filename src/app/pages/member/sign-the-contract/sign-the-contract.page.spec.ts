import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule, LoadingController, NavController } from '@ionic/angular';
import { of, Subject, throwError } from 'rxjs';
import { FadadaSignTask } from 'src/app/interfaces/fadada-sign-task';
import { FadadaService } from 'src/app/providers/fadada.service';
import { UiFeedbackService } from 'src/app/providers/ui-feedback.service';

import { SignTheContractComponent } from './sign-the-contract.page';

describe('SignTheContractComponent', () => {
  let component: SignTheContractComponent;
  let fixture: ComponentFixture<SignTheContractComponent>;
  let getSignTasksSpy: jasmine.Spy;
  let getSignTaskUrlSpy: jasmine.Spy;
  let loadingCreateSpy: jasmine.Spy;
  let toastSpy: jasmine.Spy;

  const task = (overrides: Partial<FadadaSignTask>): FadadaSignTask => ({
    ObjectId: 1,
    ObjectName: '运输合同',
    SignTaskId: 'TASK-1',
    ActorId: 'ACTOR-1',
    Status: '签署进行中',
    StatusIndex: 4,
    ActorStatus: '待签署',
    ActorPermissions: [],
    ...overrides,
  });

  beforeEach(async(() => {
    getSignTasksSpy = jasmine.createSpy('getSignTasks').and.returnValue(of([]));
    getSignTaskUrlSpy = jasmine.createSpy('getSignTaskUrl').and.returnValue(of('https://example.com/sign'));
    loadingCreateSpy = jasmine.createSpy('create').and.returnValue(Promise.resolve({
      present: jasmine.createSpy('present').and.returnValue(Promise.resolve()),
      dismiss: jasmine.createSpy('dismiss').and.returnValue(Promise.resolve()),
    }));
    toastSpy = jasmine.createSpy('presentToast').and.returnValue(Promise.resolve());

    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot()],
      providers: [
        {
          provide: FadadaService,
          useValue: {
            getSignTasks: getSignTasksSpy,
            getSignTaskUrl: getSignTaskUrlSpy,
          }
        },
        { provide: NavController, useValue: {} },
        { provide: LoadingController, useValue: { create: loadingCreateSpy } },
        { provide: UiFeedbackService, useValue: { presentToast: toastSpy } },
      ],
      declarations: [SignTheContractComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SignTheContractComponent);
    component = fixture.componentInstance;
    getSignTasksSpy.calls.reset();
    getSignTasksSpy.and.returnValue(of([]));
    getSignTaskUrlSpy.calls.reset();
    getSignTaskUrlSpy.and.returnValue(of('https://example.com/sign'));
    loadingCreateSpy.calls.reset();
    toastSpy.calls.reset();
  });

  it('should create', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('should show skeleton while contracts are loading', () => {
    const pending$ = new Subject<FadadaSignTask[]>();
    getSignTasksSpy.and.returnValue(pending$.asObservable());

    fixture.detectChanges();

    expect(component.isLoading).toBe(true);
    expect(fixture.nativeElement.querySelectorAll('.skeleton-card').length).toBeGreaterThan(0);
  });

  it('should classify contracts by status index', () => {
    getSignTasksSpy.and.returnValue(of([
      task({ SignTaskId: 'TASK-1', StatusIndex: 2, ActorStatus: '待填写' }),
      task({ SignTaskId: 'TASK-2', StatusIndex: 6, Status: '已完成' }),
      task({ SignTaskId: 'TASK-3', StatusIndex: 9, Status: '已撤销' }),
    ]));

    fixture.detectChanges();

    expect(component.list1.length).toBe(1);
    expect(component.list2.length).toBe(1);
    expect(component.list3.length).toBe(1);
    expect(component.totalCount).toBe(3);
  });

  it('should expose action types for fill, sign and waiting states', () => {
    expect(component.getShowButtonType(task({ StatusIndex: 2, ActorStatus: '待填写' }))).toBe(0);
    expect(component.getShowButtonType(task({ StatusIndex: 4, ActorStatus: '待签署' }))).toBe(1);
    expect(component.getShowButtonType(task({ StatusIndex: 2, ActorStatus: '已填写' }))).toBe(3);
    expect(component.getShowButtonType(task({ StatusIndex: 4, ActorStatus: '已签署' }))).toBe(5);
  });

  it('should enter error state when loading contracts fails', () => {
    getSignTasksSpy.and.returnValue(throwError(() => new Error('network')));

    fixture.detectChanges();

    expect(component.loadError).toBe(true);
    expect(component.isLoaded).toBe(true);
    expect(toastSpy).toHaveBeenCalledWith('合同列表加载失败，请稍后重试', 2200, 'middle', undefined, 'danger');
  });

  it('should open preview link in a new window', async () => {
    spyOn(window, 'open');

    await component.goToPreview(task({}));

    expect(loadingCreateSpy).toHaveBeenCalled();
    expect(getSignTaskUrlSpy).toHaveBeenCalledWith('TASK-1', 'ACTOR-1');
    expect(window.open).toHaveBeenCalledWith('https://example.com/sign', '_blank');
  });
});
