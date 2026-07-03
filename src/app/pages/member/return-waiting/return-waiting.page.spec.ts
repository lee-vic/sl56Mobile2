import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AlertController, IonicModule, NavController, ToastController } from '@ionic/angular';
import { CookieService } from 'ngx-cookie-service';
import { NavigationEnd, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';

import { ReturnWaitingPage } from './return-waiting.page';
import { ReturnService } from 'src/app/providers/return.service';
import { WaitingReturnEventsService } from 'src/app/providers/waiting-return-events.service';

describe('ReturnWaitingComponent', () => {
  let component: ReturnWaitingPage;
  let fixture: ComponentFixture<ReturnWaitingPage>;
  let routerEvents$: Subject<any>;
  let router: Router;
  let waitingEventsService: any;

  const getWaitReturnListSpy = jasmine.createSpy('getWaitReturnList').and.returnValue(of([
    { Id: 1, Selected: false },
    { Id: 2, Selected: false }
  ]));
  const removeWaitReturnListSpy = jasmine.createSpy('removeWaitReturnList').and.returnValue(of({}));
  const clearWaitReturnListSpy = jasmine.createSpy('clearWaitReturnList').and.returnValue(of({}));

  const mockRouter = {
    events: null
  } as any;
  const mockNavCtrl = {
    navigateForward: jasmine.createSpy('navigateForward')
  };
  const mockAlert = {
    create: jasmine.createSpy('alertCreate').and.returnValue(Promise.resolve({ present: () => Promise.resolve() }))
  };
  const toastCreateSpy = jasmine.createSpy('toastCreate').and.returnValue(Promise.resolve({ present: () => Promise.resolve() }));

  beforeEach(async(() => {
    routerEvents$ = new Subject<any>();
    mockRouter.events = routerEvents$.asObservable();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule, FormsModule, ReactiveFormsModule, IonicModule.forRoot()],
      providers: [
        CookieService,
        { provide: ReturnService, useValue: {
          getWaitReturnList: getWaitReturnListSpy,
          removeWaitReturnList: removeWaitReturnListSpy,
          clearWaitReturnList: clearWaitReturnListSpy
        } },
        { provide: WaitingReturnEventsService, useValue: { notifyReloadWaitingReturn: jasmine.createSpy('notifyReloadWaitingReturn') } },
        { provide: Router, useValue: mockRouter },
        { provide: NavController, useValue: mockNavCtrl },
        { provide: AlertController, useValue: mockAlert },
        { provide: ToastController, useValue: { create: toastCreateSpy } },
      ],
      declarations: [ ReturnWaitingPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReturnWaitingPage);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    waitingEventsService = TestBed.inject(WaitingReturnEventsService) as any;
    getWaitReturnListSpy.calls.reset();
    getWaitReturnListSpy.and.returnValue(of([
      { Id: 1, Selected: false },
      { Id: 2, Selected: false }
    ]));
    removeWaitReturnListSpy.calls.reset();
    removeWaitReturnListSpy.and.returnValue(of({}));
    clearWaitReturnListSpy.calls.reset();
    clearWaitReturnListSpy.and.returnValue(of({}));
    mockNavCtrl.navigateForward.calls.reset();
    mockAlert.create.calls.reset();
    waitingEventsService.notifyReloadWaitingReturn.calls.reset();
    toastCreateSpy.calls.reset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show skeleton while waiting list initializes', () => {
    const pending$ = new Subject<any[]>();
    getWaitReturnListSpy.and.returnValue(pending$.asObservable());

    fixture.detectChanges();

    expect(component.showSkeleton).toBe(true);
    expect(fixture.nativeElement.querySelectorAll('.skeleton-card').length).toBeGreaterThan(0);
  });

  it('should load waiting return list on navigation end', () => {
    fixture.detectChanges();
    getWaitReturnListSpy.calls.reset();
    routerEvents$.next(new NavigationEnd(1, '/member/return-waiting', '/member/return-waiting'));

    expect(getWaitReturnListSpy).toHaveBeenCalled();
    expect(component.items.length).toBe(2);
    expect(component.selectedCount).toBe(2);
  });

  it('should enter error state when waiting list loading fails', () => {
    getWaitReturnListSpy.and.returnValue(throwError(() => new Error('network')));

    fixture.detectChanges();

    expect(component.hasLoadError).toBe(true);
    expect(component.isLoaded).toBe(true);
    expect(component.items.length).toBe(0);
    expect(component.selectedCount).toBe(0);
  });

  it('should toggle selected status and update selected count', () => {
    component.items = [
      { Id: 1, Selected: false },
      { Id: 2, Selected: false }
    ] as any;

    component.check(component.items[0] as any);

    expect(component.items[0].Selected).toBe(true);
    expect(component.selectedCount).toBe(1);
  });

  it('should select all items when selectAll is clicked', () => {
    component.items = [
      { Id: 1, Selected: false },
      { Id: 2, Selected: false }
    ] as any;
    component.selectAll();

    expect(component.items.every((item) => item.Selected)).toBe(true);
    expect(component.selectedCount).toBe(2);
  });

  it('should unselect all items when ionChange emits unchecked', () => {
    component.items = [
      { Id: 1, Selected: true },
      { Id: 2, Selected: true }
    ] as any;
    component.selectedCount = 2;

    component.selectAll({ detail: { checked: false } } as any);

    expect(component.items.every((item) => !item.Selected)).toBe(true);
    expect(component.selectedCount).toBe(0);
    expect(component.allSelected).toBe(false);
  });

  it('should compute allSelected from selectedCount and items length', () => {
    component.items = [
      { Id: 1, Selected: true },
      { Id: 2, Selected: true }
    ] as any;
    component.selectedCount = 2;

    expect(component.allSelected).toBe(true);
  });

  it('should remove selected items from list', () => {
    component.items = [
      { Id: 1, Selected: true },
      { Id: 2, Selected: false }
    ] as any;
    component.selectedCount = 1;
    component.remove();

    expect(removeWaitReturnListSpy).toHaveBeenCalledWith('1');
    expect(component.items.length).toBe(1);
    expect(component.items[0].Id).toBe(2);
    expect(component.selectedCount).toBe(0);
  });

  it('should show toast and skip remove when nothing is selected', () => {
    component.items = [
      { Id: 1, Selected: false },
      { Id: 2, Selected: false }
    ] as any;
    component.selectedCount = 0;

    component.remove();

    expect(removeWaitReturnListSpy).not.toHaveBeenCalled();
    expect(toastCreateSpy).toHaveBeenCalledWith(jasmine.objectContaining({
      message: '请先选择要移除的单号'
    }));
  });

  it('should reset mutating state when remove fails', () => {
    removeWaitReturnListSpy.and.returnValue(throwError(() => new Error('network')));
    component.items = [
      { Id: 1, Selected: true }
    ] as any;
    component.selectedCount = 1;

    component.remove();

    expect(component.isMutating).toBe(false);
    expect(component.items.length).toBe(1);
    expect(toastCreateSpy).toHaveBeenCalledWith(jasmine.objectContaining({
      message: '移除失败，请稍后重试'
    }));
  });

  it('should navigate to return apply with selected ids', () => {
    component.items = [
      { Id: 1, Selected: true },
      { Id: 2, Selected: true }
    ] as any;
    component.selectedCount = 2;

    component.goReturn();

    expect(mockNavCtrl.navigateForward).toHaveBeenCalledWith('/member/return-apply', { queryParams: { type: 0, ids: '1,2' } });
  });

  it('should remove one item from waiting list', () => {
    component.items = [
      { Id: 1, Selected: false },
      { Id: 2, Selected: true }
    ] as any;
    component.selectedCount = 1;
    component.removeOne(component.items[0] as any);

    expect(removeWaitReturnListSpy).toHaveBeenCalledWith('1');
    expect(component.items.length).toBe(1);
    expect(component.items[0].Id).toBe(2);
    expect(component.selectedCount).toBe(1);
  });

  it('should clear waiting list after confirmation', async () => {
    component.items = [
      { Id: 1, Selected: true },
      { Id: 2, Selected: true }
    ] as any;
    component.selectedCount = 2;

    await component.clear();
    const alertConfig = mockAlert.create.calls.mostRecent().args[0];
    alertConfig.buttons[1].handler();

    expect(clearWaitReturnListSpy).toHaveBeenCalled();
    expect(component.items.length).toBe(0);
    expect(component.selectedCount).toBe(0);
    expect(waitingEventsService.notifyReloadWaitingReturn).toHaveBeenCalled();
  });

  it('should show toast when submitting without selection', () => {
    component.items = [
      { Id: 1, Selected: false }
    ] as any;
    component.selectedCount = 0;

    component.goReturn();

    expect(mockNavCtrl.navigateForward).not.toHaveBeenCalled();
    expect(toastCreateSpy).toHaveBeenCalledWith(jasmine.objectContaining({
      message: '请先选择要申请退货的单号'
    }));
  });

  it('should notify reload event when back is triggered', () => {
    component.back();

    expect(waitingEventsService.notifyReloadWaitingReturn).toHaveBeenCalled();
  });
});
