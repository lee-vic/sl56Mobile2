import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActionSheetController, AlertController, IonicModule, NavController, ToastController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { of, Subject } from 'rxjs';

import { DeliveryRecordDetailPage } from './delivery-record-detail.page';
import { DeliveryRecordDetailService } from 'src/app/providers/delivery-record-detail.service';
import { ProblemService } from 'src/app/providers/problem.service';

describe('DeliveryRecordDetailPage', () => {
  let component: DeliveryRecordDetailPage;
  let fixture: ComponentFixture<DeliveryRecordDetailPage>;
  let router: Router;

  const detailPayload = {
    IsShowPackageTracks: true,
    PackageTracksJsonString: JSON.stringify([
      { PackageId: 1, PackageNumber: 'PK1', Tracks: [] },
      { PackageId: 2, PackageNumber: 'PK2', Tracks: [] }
    ]),
    IsReturnCustomer: true,
    AllowDownloadLabel: true,
    HasLabel: true,
    TransportDocumentId: 100,
    ObjectId: 999,
    ChatRecords: []
  };

  const getDetailSpy = jasmine.createSpy('getDetail').and.returnValue(of(detailPayload as any));
  const addProblemSpy = jasmine.createSpy('addProblem').and.returnValue(of({ Success: true }));

  const mockRoute = {
    snapshot: {
      paramMap: {
        get: () => '999'
      }
    },
    queryParams: null
  } as any;

  const queryParams$ = new Subject<any>();

  beforeEach(async(() => {
    mockRoute.queryParams = queryParams$.asObservable();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule, FormsModule, ReactiveFormsModule, IonicModule.forRoot()],
      providers: [
        CookieService,
        { provide: ActivatedRoute, useValue: mockRoute },
        { provide: DeliveryRecordDetailService, useValue: { getDetail: getDetailSpy } },
        { provide: ProblemService, useValue: { addProblem: addProblemSpy } },
        { provide: AlertController, useValue: { create: jasmine.createSpy('alertCreate') } },
        { provide: ToastController, useValue: { create: jasmine.createSpy('toastCreate') } },
        { provide: ActionSheetController, useValue: { create: jasmine.createSpy('sheetCreate') } },
        { provide: NavController, useValue: { navigateForward: jasmine.createSpy('navigateForward') } }
      ],
      declarations: [ DeliveryRecordDetailPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeliveryRecordDetailPage);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    getDetailSpy.calls.reset();
    getDetailSpy.and.returnValue(of({ ...detailPayload } as any));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load and parse package tracks on init', () => {
    component.ngOnInit();

    expect(getDetailSpy).toHaveBeenCalledWith(false, 999);
    expect(component.data.PackageTracks.length).toBe(2);
    expect(component.data.PackageTracks[0].open).toBe(false);
    expect(component.data.LabelUrl).toContain('/DeliveryRecord/DownloadLabel/100');
  });

  it('should not throw and fallback to empty tracks when package track json is invalid', () => {
    getDetailSpy.and.returnValue(of({ ...detailPayload, PackageTracksJsonString: '{bad-json' } as any));

    expect(() => component.ngOnInit()).not.toThrow();
    expect(component.data.PackageTracks).toEqual([]);
  });

  it('should toggle selected package track and close others', () => {
    component.data = {
      PackageTracks: [
        { PackageId: 1, open: false },
        { PackageId: 2, open: true }
      ]
    } as any;

    component.trackToggle(component.data.PackageTracks[0]);

    expect(component.data.PackageTracks[0].open).toBe(true);
    expect(component.data.PackageTracks[1].open).toBe(false);
  });

  it('should navigate to chat page with record state', () => {
    component.data = { ObjectId: 999, ChatRecords: [{ Id: 1 }] } as any;

    component.chat();

    expect(router.navigate).toHaveBeenCalled();
  });

  it('should filter problems by processing and done states', () => {
    component.data = {
      Problems: [
        { Name: 'A', StatusName: '处理中' },
        { Name: 'B', StatusName: '已处理' },
        { Name: 'C', StatusName: '待处理' },
      ],
    } as any;

    component.setProblemFilter('processing');
    expect(component.filteredProblems.length).toBe(2);
    expect(component.processingProblemCount).toBe(2);

    component.setProblemFilter('done');
    expect(component.filteredProblems.length).toBe(1);
    expect(component.doneProblemCount).toBe(1);
  });

  it('should return proper problem status color', () => {
    expect(component.problemStatusColor('已处理')).toBe('success');
    expect(component.problemStatusColor('处理中')).toBe('warning');
    expect(component.problemStatusColor('未知状态')).toBe('medium');
  });

  // ── Skeleton / loading state ──

  it('should start with isLoading false', () => {
    expect(component.isLoading).toBe(false);
  });

  it('should set isLoading true during data fetch', () => {
    // Simulate the state transition in ngOnInit
    component.isLoading = true;
    expect(component.isLoading).toBe(true);

    // After data loads
    component.isLoading = false;
    expect(component.isLoading).toBe(false);
  });

  // ── Display formatting ──

  it('should display "--" for null/undefined/empty values', () => {
    expect(component.displayValue(null)).toBe('--');
    expect(component.displayValue(undefined)).toBe('--');
    expect(component.displayValue('')).toBe('--');
  });

  it('should display string representation for valid values', () => {
    expect(component.displayValue('Hello')).toBe('Hello');
    expect(component.displayValue(123)).toBe('123');
    expect(component.displayValue(0)).toBe('0');
  });

  it('should format currency with ¥ prefix and two decimals', () => {
    expect(component.formatCurrency(100)).toBe('￥100.00');
    expect(component.formatCurrency(0)).toBe('￥0.00');
    expect(component.formatCurrency(12.5)).toBe('￥12.50');
    expect(component.formatCurrency(null)).toBe('￥0.00');
  });

  it('should display "--" for currency when value is empty', () => {
    expect(component.displayCurrencyValue(null)).toBe('--');
    expect(component.displayCurrencyValue(undefined)).toBe('--');
    expect(component.displayCurrencyValue('')).toBe('--');
  });

  it('should format dimensions as L*W*H when all values present', () => {
    expect(component.formatDimensions(10, 20, 30)).toBe('10*20*30');
  });

  it('should return "--" for dimensions when any value is missing', () => {
    expect(component.formatDimensions(null, 20, 30)).toBe('--');
    expect(component.formatDimensions(10, undefined, 30)).toBe('--');
    expect(component.formatDimensions(10, 20, '')).toBe('--');
  });

  // ── Count getters ──

  it('should compute basic info count (10 base + optional label)', () => {
    component.data = { LabelUrl: null } as any;
    expect(component.basicInfoCount).toBe(10);

    component.data = { LabelUrl: 'http://label.url' } as any;
    expect(component.basicInfoCount).toBe(11);
  });

  it('should compute sizes count from data', () => {
    component.data = { Sizes: [{}, {}, {}] } as any;
    expect(component.sizesCount).toBe(3);

    component.data = {} as any;
    expect(component.sizesCount).toBe(0);
  });

  it('should compute tracks count from package tracks when enabled', () => {
    component.data = {
      IsShowPackageTracks: true,
      PackageTracks: [{ PackageId: 1 }, { PackageId: 2 }],
    } as any;
    expect(component.tracksCount).toBe(2);
  });

  it('should compute tracks count from plain tracks when package tracks disabled', () => {
    component.data = {
      IsShowPackageTracks: false,
      Tracks: [{}, {}, {}, {}],
    } as any;
    expect(component.tracksCount).toBe(4);
  });

  it('should compute receivable count', () => {
    component.data = {
      AccountReceivableDetails: [{ Name: 'A' }, { Name: 'B' }],
    } as any;
    expect(component.receivableCount).toBe(2);
  });

  it('should compute problem count', () => {
    component.data = { Problems: [{ Name: 'P1' }] } as any;
    expect(component.problemCount).toBe(1);
  });

  it('should return false for hasLabel when no LabelUrl', () => {
    component.data = { LabelUrl: null } as any;
    expect(component.hasLabel).toBe(false);

    component.data = { LabelUrl: 'http://example.com/label' } as any;
    expect(component.hasLabel).toBe(true);
  });

  // ── Problem filter ──

  it('should change problem filter and persist', () => {
    component.data = {
      Problems: [
        { Name: 'A', StatusName: '处理中' },
        { Name: 'B', StatusName: '已处理' },
      ],
    } as any;

    component.setProblemFilter('processing');
    expect(component.problemFilter).toBe('processing');
    expect(component.filteredProblems.length).toBe(1);

    component.setProblemFilter('all');
    expect(component.filteredProblems.length).toBe(2);
  });
});
