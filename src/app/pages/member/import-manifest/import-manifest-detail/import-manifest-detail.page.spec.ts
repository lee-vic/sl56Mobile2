import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { IonicModule, AlertController, NavController } from '@ionic/angular';
import { of, throwError } from 'rxjs';

import { ImportManifestDetailPage } from './import-manifest-detail.page';
import { ImportManifestService } from 'src/app/providers/import-manifest.service';
import { ImportManifestDetail, ForwardingDocumentItem } from 'src/app/interfaces/import-manifest';

describe('ImportManifestDetailPage', () => {
  let component: ImportManifestDetailPage;
  let fixture: ComponentFixture<ImportManifestDetailPage>;
  let serviceSpy: jasmine.SpyObj<ImportManifestService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let navCtrlSpy: jasmine.SpyObj<NavController>;
  let alertCtrlSpy: jasmine.SpyObj<AlertController>;

  const mockDetail: ImportManifestDetail = {
    ObjectId: 11,
    ObjectNo: 'FAST001',
    CustomerId: 100,
    CountryId: 1,
    CountryName: '美国',
    ModeOfTransportId: 1,
    ModeOfTransportName: '空运',
    CustomerPriceCode: 'PRICE01',
    Status: 0,
    StatusName: '已预报',
    Piece: 2,
    Weight: 1.5,
    PostalCode: '90001',
    ContentType: 1,
    ContentTypeName: '包裹',
    DeclaredValue: 100,
    CustomerExpressNo: 'SF001',
    EntryType: 0,
    RequiresSeparateCustomsDeclaration: false,
    RequiresDutiesAndTaxesPrepayment: false,
    RequiresSpecialVatInvoice: false,
    BatteryModel: 'BAT01',
    WaybillCreationStatus: 0,
    TrackNumber: '',
    LabelPath: '',
    IsLabelPrinted: false,
    ForwardingDocumentCount: 0,
    CreateAt: '2026-06-01',
    LastChanged: null,
  };

  const mockDocuments: ForwardingDocumentItem[] = [
    {
      id: 8,
      fileName: 'invoice.pdf',
      attachmentTypeId: 58,
      attachmentTypeName: '报关资料',
      size: 1024,
      uploadDate: '2026-06-01',
    },
  ];

  const mockAlert = {
    present: jasmine.createSpy('present'),
  };

  beforeEach(() => {
    const sSpy = jasmine.createSpyObj('ImportManifestService', [
      'getDetail',
      'getForwardingDocuments',
      'getBatteryModelOptions',
      'delete',
      'openForwardingDocumentPreview',
      'downloadForwardingDocument',
      'downloadLabel',
      'markListDirty',
    ]);
    const rSpy = jasmine.createSpyObj('Router', ['navigate']);
    const nSpy = jasmine.createSpyObj('NavController', ['back']);
    const aSpy = jasmine.createSpyObj('AlertController', ['create']);

    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot()],
      declarations: [ImportManifestDetailPage],
      providers: [
        { provide: ImportManifestService, useValue: sSpy },
        { provide: Router, useValue: rSpy },
        { provide: NavController, useValue: nSpy },
        { provide: AlertController, useValue: aSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: new Map([['id', '11']]) } },
        },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    serviceSpy = TestBed.inject(ImportManifestService) as jasmine.SpyObj<ImportManifestService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    navCtrlSpy = TestBed.inject(NavController) as jasmine.SpyObj<NavController>;
    alertCtrlSpy = TestBed.inject(AlertController) as jasmine.SpyObj<AlertController>;

    serviceSpy.getDetail.and.returnValue(of({ ...mockDetail }));
    serviceSpy.getForwardingDocuments.and.returnValue(of({ success: true, rows: mockDocuments }));
    serviceSpy.getBatteryModelOptions.and.returnValue(of([{ Value: 'BAT01', Text: '电池型号一' }]));
    serviceSpy.delete.and.returnValue(of({ Success: true, ErrMsg: '' }));
    alertCtrlSpy.create.and.returnValue(Promise.resolve(mockAlert as any));

    fixture = TestBed.createComponent(ImportManifestDetailPage);
    component = fixture.componentInstance;
  });

  it('should load detail and update forwarding document count', () => {
    fixture.detectChanges();

    expect(serviceSpy.getDetail).toHaveBeenCalledWith(11);
    expect(serviceSpy.getForwardingDocuments).toHaveBeenCalledWith(11);
    expect(component.data?.ObjectNo).toBe('FAST001');
    expect(component.attachments.length).toBe(1);
    expect(component.data?.ForwardingDocumentCount).toBe(1);
    expect(component.isLoading).toBe(false);
    expect(component.hasError).toBe(false);
  });

  it('should expose skeleton card rows matching detail sections', () => {
    expect(component.skeletonInfoCards.map((card) => card.rows.length)).toEqual([5, 4, 3]);
  });

  it('should set error state when detail load fails', () => {
    serviceSpy.getDetail.and.returnValue(throwError(() => new Error('network')));

    component.loadDetail();

    expect(component.isLoading).toBe(false);
    expect(component.hasError).toBe(true);
  });

  it('should clear attachments when forwarding document load fails', () => {
    serviceSpy.getForwardingDocuments.and.returnValue(throwError(() => new Error('network')));

    component.loadDetail();

    expect(component.attachments).toEqual([]);
    expect(component.isLoading).toBe(false);
  });

  it('edit should navigate only when manifest is editable', () => {
    component.id = 11;
    component.data = { ...mockDetail, Status: 0 };

    component.edit();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/member/import-manifest/form', 11]);

    routerSpy.navigate.calls.reset();
    component.data = { ...mockDetail, Status: 1 };
    component.edit();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('downloadLabel should download by ObjectId and ignore missing data', () => {
    component.downloadLabel();
    expect(serviceSpy.downloadLabel).not.toHaveBeenCalled();

    component.data = { ...mockDetail, ObjectId: 11 };
    component.downloadLabel();

    expect(serviceSpy.downloadLabel).toHaveBeenCalledWith(11);
  });

  it('should preview and download saved forwarding documents only', () => {
    const savedDoc = mockDocuments[0];
    const pendingDoc = { fileName: 'pending.pdf', attachmentTypeId: 2, attachmentTypeName: '运单' };

    component.previewDocument(savedDoc);
    component.downloadDocument(savedDoc);
    component.previewDocument(pendingDoc);
    component.downloadDocument(pendingDoc);

    expect(serviceSpy.openForwardingDocumentPreview).toHaveBeenCalledTimes(1);
    expect(serviceSpy.openForwardingDocumentPreview).toHaveBeenCalledWith(8);
    expect(serviceSpy.downloadForwardingDocument).toHaveBeenCalledTimes(1);
    expect(serviceSpy.downloadForwardingDocument).toHaveBeenCalledWith(8);
  });

  it('should map delegated display helpers through domain service', () => {
    fixture.detectChanges();

    expect(component.getStatusColor(0)).toBe('warning');
    expect(component.getCustomerStatusName()).toBe('已预报');
    expect(component.getBatteryModelText()).toBe('电池型号一');
    expect(component.getFileIcon('invoice.pdf')).toBe('document-outline');
    expect(component.formatFileSize(1024)).toBe('1.0 KB');
  });

  it('confirmDelete should call delete handler and navigate back on success', async () => {
    component.id = 11;
    component.data = { ...mockDetail, Status: 0 };
    alertCtrlSpy.create.and.callFake((options: any) => {
      const deleteButton = options.buttons.find((button: any) => button.role === 'destructive');
      deleteButton.handler();
      return Promise.resolve(mockAlert as any);
    });

    await component.confirmDelete();

    expect(serviceSpy.delete).toHaveBeenCalledWith(11);
    expect(serviceSpy.markListDirty).toHaveBeenCalled();
    expect(navCtrlSpy.back).toHaveBeenCalled();
    expect(mockAlert.present).toHaveBeenCalled();
  });
});
