import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { of, throwError } from 'rxjs';

import { ProblemListPage } from './problem-list.page';
import { ProblemService } from 'src/app/providers/problem.service';
import { NavController } from '@ionic/angular';

describe('ProblemListPage', () => {
  let component: ProblemListPage;
  let fixture: ComponentFixture<ProblemListPage>;
  const getListSpy = jasmine.createSpy('getList').and.returnValue(of([]));
  const mockNavCtrl = jasmine.createSpyObj('NavController', ['navigateForward']);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule, FormsModule, ReactiveFormsModule, IonicModule.forRoot()],
      providers: [
        CookieService,
        { provide: ProblemService, useValue: { getList: getListSpy } },
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
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load first page on init', () => {
    expect(getListSpy).toHaveBeenCalledWith(1, '');
    expect(component.isLoaded).toBe(true);
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
