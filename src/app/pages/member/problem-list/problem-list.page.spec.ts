import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { of, Subject, throwError } from 'rxjs';

import { ProblemListPage } from './problem-list.page';
import { ProblemService } from 'src/app/providers/problem.service';
import { NavController } from '@ionic/angular';

describe('ProblemListPage', () => {
  let component: ProblemListPage;
  let fixture: ComponentFixture<ProblemListPage>;
  const getListSpy = jasmine.createSpy('getList').and.returnValue(of([]));
  const countsSpy = jasmine.createSpy('getListCounts');
  const mockNavCtrl = jasmine.createSpyObj('NavController', ['navigateForward']);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule, FormsModule, ReactiveFormsModule, IonicModule.forRoot()],
      providers: [
        CookieService,
        { provide: ProblemService, useValue: { getList: getListSpy, getListCounts: countsSpy } },
        { provide: NavController, useValue: mockNavCtrl },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParams: {} } },
        },
      ],
      declarations: [ ProblemListPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProblemListPage);
    component = fixture.componentInstance;
    getListSpy.calls.reset();
    getListSpy.and.returnValue(of([]));
    countsSpy.calls.reset();
    countsSpy.and.returnValue(of({ Before: 12, InTransit: 3, Confirmable: 5 }));
    fixture.detectChanges();
    component.ionViewWillEnter();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows server totals for the first three tabs, not the loaded page length', () => {
    fixture.detectChanges();
    expect(component.items.length).toBe(0);
    expect(component.categoryCounts).toEqual([12, 3, 5]);
    const badges = Array.from(fixture.nativeElement.querySelectorAll('ion-segment ion-badge')) as HTMLElement[];
    expect(badges.map(badge => badge.textContent?.trim())).toEqual(['12', '3', '5']);
  });

  it('refreshes counts on return and does not show zero when the count request fails', () => {
    countsSpy.and.returnValue(throwError(() => new Error('offline')));
    component.ionViewWillEnter();
    fixture.detectChanges();
    expect(component.categoryCounts).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('ion-segment ion-badge').length).toBe(0);
  });

  it('hides unknown category totals without hiding other valid badges', () => {
    countsSpy.and.returnValue(of({ Before: 0, InTransit: 3, Confirmable: null }));
    component.ionViewWillEnter();
    fixture.detectChanges();
    const badges = Array.from(fixture.nativeElement.querySelectorAll('ion-segment ion-badge')) as HTMLElement[];
    expect(badges.map(badge => badge.textContent?.trim())).toEqual(['0', '3']);
  });

  it('should load first page on init', () => {
    expect(getListSpy).toHaveBeenCalledWith(1, '', 0);
    expect(component.isLoaded).toBe(true);
  });

  it('reloads the unfiltered list when returning to a cached page', () => {
    component.searchKeyword = 'old-order';
    component.items = [{ Id: 1 } as any];
    component.ionViewWillEnter();
    expect(component.searchKeyword).toBe('');
    expect(component.items).toEqual([]);
    expect(getListSpy).toHaveBeenCalledWith(1, '', 0);
  });

  it('cancels an earlier response when a new list load starts', () => {
    const oldResponse = new Subject<any[]>();
    getListSpy.and.returnValue(oldResponse);
    component.loadFirstPage('old');
    getListSpy.and.returnValue(of([{ Id: 2 }]));
    component.loadFirstPage('new');
    oldResponse.next([{ Id: 1 }]);
    expect(component.items.map(item => item.Id)).toEqual([2] as any);
    expect(component.isBusy).toBe(false);
  });

  [0, 1, 2, 3].forEach(type => {
    it('queries the selected PC-aligned category ' + type, () => {
      component.problemType = type === 0 ? 1 : 0;
      component.changeProblemType({ detail: { value: type } } as CustomEvent);
      expect(component.problemType).toBe(type);
      expect(getListSpy).toHaveBeenCalledWith(1, '', type);
    });
  });

  it('should debounce search input and trim keyword', fakeAsync(() => {
    spyOn(component, 'loadFirstPage');

    component.onSearchInput({ detail: { value: '  abc  ' } } as any);
    tick(279);
    expect(component.loadFirstPage).not.toHaveBeenCalled();

    tick(1);
    expect(component.searchKeyword).toBe('abc');
    expect(component.loadFirstPage).toHaveBeenCalledWith('abc');
  }));

  it('should reset search and reload first page', () => {
    component.searchKeyword = 'xyz';
    spyOn(component, 'loadFirstPage');

    component.clearSearch();

    expect(component.searchKeyword).toBe('');
    expect(component.loadFirstPage).toHaveBeenCalledWith('');
  });

  it('should calculate total problem count from grouped list', () => {
    component.items = [
      { ProblemList: [{}, {}] } as any,
      { ProblemList: [{}] } as any,
      { ProblemList: [] } as any,
    ];

    expect(component.totalProblemCount).toBe(3);
  });

  it('counts unique loaded waybills when quick confirmation repeats a waybill across problem rows', () => {
    component.problemType = 2;
    component.items = [
      { Id: 20, ProblemList: [{}] } as any,
      { Id: 20, ProblemList: [{}] } as any,
      { Id: 21, ProblemList: [{}] } as any
    ];
    fixture.detectChanges();
    expect(component.loadedWaybillCount).toBe(2);
    expect(component.totalProblemCount).toBe(3);
    const values = fixture.nativeElement.querySelectorAll('.summary-value');
    expect(values[0].textContent.trim()).toBe('2');
    expect(values[1].textContent.trim()).toBe('3');
    expect(fixture.nativeElement.querySelector('.summary-label').textContent).toContain('已加载运单');
    component.items = [];
    expect(component.loadedWaybillCount).toBe(0);
  });

  it('should mark load error and complete scroll handlers on getItems failure', () => {
    getListSpy.and.returnValue(throwError(() => new Error('network')));
    const completeSpy = jasmine.createSpy('complete');
    const refresherCompleteSpy = jasmine.createSpy('refresherComplete');
    component.infiniteScroll = { complete: completeSpy } as any;

    component.getItems('', true, { target: { complete: refresherCompleteSpy } } as any);

    expect(component.hasLoadError).toBe(true);
    expect(component.isBusy).toBe(false);
    expect(completeSpy).toHaveBeenCalled();
    expect(refresherCompleteSpy).toHaveBeenCalled();
  });

  it('should clear pending debounce timer on destroy', fakeAsync(() => {
    spyOn(component, 'loadFirstPage');

    component.onSearchInput({ detail: { value: 'abc' } } as any);
    component.ngOnDestroy();
    tick(300);

    expect(component.loadFirstPage).not.toHaveBeenCalled();
  }));

  it('should navigate to problem detail when query params contain problem context', () => {
    const injectedRoute = TestBed.inject(ActivatedRoute) as any;
    injectedRoute.snapshot.queryParams = {
      problemId: 11,
      receiveGoodsDetailId: 22,
    };

    fixture = TestBed.createComponent(ProblemListPage);
    component = fixture.componentInstance;
    spyOn(component, 'problemDetail');

    component.ngOnInit();

    expect(component.problemDetail).toHaveBeenCalledWith(22, 11);
  });
});
