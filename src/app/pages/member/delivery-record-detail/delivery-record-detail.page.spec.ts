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
});
