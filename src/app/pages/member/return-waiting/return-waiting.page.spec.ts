import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AlertController, IonicModule, NavController } from '@ionic/angular';
import { CookieService } from 'ngx-cookie-service';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { of, Subject } from 'rxjs';

import { ReturnWaitingPage } from './return-waiting.page';
import { ReturnService } from 'src/app/providers/return.service';
import { WaitingReturnEventsService } from 'src/app/providers/waiting-return-events.service';

describe('ReturnWaitingComponent', () => {
  let component: ReturnWaitingPage;
  let fixture: ComponentFixture<ReturnWaitingPage>;
  let routerEvents$: Subject<any>;
  let router: Router;

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
        { provide: ActivatedRoute, useValue: {} },
        { provide: NavController, useValue: mockNavCtrl },
        { provide: AlertController, useValue: mockAlert },
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
    component.ckAll = { checked: false } as any;
    getWaitReturnListSpy.calls.reset();
    removeWaitReturnListSpy.calls.reset();
    clearWaitReturnListSpy.calls.reset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load waiting return list on navigation end', () => {
    routerEvents$.next(new NavigationEnd(1, '/member/return-waiting', '/member/return-waiting'));

    expect(getWaitReturnListSpy).toHaveBeenCalled();
    expect(component.items.length).toBe(2);
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
    component.ckAll = { checked: false } as any;

    component.selectAll();

    expect(component.items.every((item) => item.Selected)).toBe(true);
    expect(component.selectedCount).toBe(2);
  });

  it('should remove selected items from list', () => {
    component.items = [
      { Id: 1, Selected: true },
      { Id: 2, Selected: false }
    ] as any;
    component.ckAll = { checked: true } as any;

    component.remove();

    expect(removeWaitReturnListSpy).toHaveBeenCalledWith('1');
    expect(component.items.length).toBe(1);
    expect(component.items[0].Id).toBe(2);
    expect(component.selectedCount).toBe(0);
  });

  it('should navigate to return apply with selected ids', () => {
    component.items = [
      { Id: 1, Selected: true },
      { Id: 2, Selected: true }
    ] as any;

    component.goReturn();

    expect(mockNavCtrl.navigateForward).toHaveBeenCalledWith('/member/return-apply', { queryParams: { type: 0, ids: '1,2' } });
  });
});
