import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { ImportManifestService } from './import-manifest.service';
import { apiUrl } from '../global';
import {
  ImportManifestListItem,
  ImportManifestListResponse,
  ImportManifestDetail,
  ImportManifestSaveRequest,
  ParseImportResponse,
  ImportManifestActionResult,
  BulkDeleteResult,
  DropdownOption,
} from '../interfaces/import-manifest';

describe('ImportManifestService', () => {
  let service: ImportManifestService;
  let httpMock: HttpTestingController;
  const baseUrl = apiUrl + '/ImportManifest';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    service = TestBed.get(ImportManifestService);
    httpMock = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ── getList ──
  it('getList should request with pageIndex and return typed response', () => {
    const mockResponse: ImportManifestListResponse = {
      TotalRecords: 25,
      Rows: [
        {
          Id: 1,
          ObjectNo: 'TEST001',
          CountryName: '美国',
          ModeOfTransportName: '空运',
          CustomerPriceName: 'PRICE01',
          Piece: 3,
          ContentTypeName: '包裹',
          ContentType: 1,
          PostalCode: '90001',
          CustomerExpressNo: '',
          DeclaredValue: '100.00',
          StatusName: '已预报',
          StatusCode: 0,
          ForwardingDocumentCount: 0,
          IsLabelPrinted: false,
          CreateAt: '2025-01-01',
        },
      ],
      Summary: { totalRecords: 25, pageIndex: 1, pageSize: 10, currentPageCount: 1 },
    };

    service.getList(1).subscribe((res) => {
      expect(res.TotalRecords).toBe(25);
      expect(res.Rows.length).toBe(1);
      expect(res.Rows[0].ObjectNo).toBe('TEST001');
    });

    const req = httpMock.expectOne((r) => r.url === baseUrl + '/GetList');
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.params.get('pageIndex')).toBe('1');
    req.flush(mockResponse);
  });

  it('getList should include search and date params when provided', () => {
    service.getList(1, 'TEST', '2025-01-01', '2025-01-31').subscribe();

    const req = httpMock.expectOne((r) => r.url === baseUrl + '/GetList');
    expect(req.request.params.get('search')).toBe('TEST');
    expect(req.request.params.get('startDate')).toBe('2025-01-01');
    expect(req.request.params.get('endDate')).toBe('2025-01-31');
    req.flush({ TotalRecords: 0, Rows: [], Summary: { totalRecords: 0, pageIndex: 1, pageSize: 10, currentPageCount: 0 } });
  });

  it('getList should omit empty search param', () => {
    service.getList(1, '   ').subscribe();

    const req = httpMock.expectOne((r) => r.url === baseUrl + '/GetList');
    expect(req.request.params.has('search')).toBe(false);
    req.flush({ TotalRecords: 0, Rows: [], Summary: { totalRecords: 0, pageIndex: 1, pageSize: 10, currentPageCount: 0 } });
  });

  // ── getDetail ──
  it('getDetail should request detail by id', () => {
    const mockDetail: ImportManifestDetail = {
      ObjectId: 1,
      ObjectNo: 'TEST001',
      CustomerId: 100,
      CountryId: 10,
      CountryName: '美国',
      ModeOfTransportId: 1,
      ModeOfTransportName: '空运',
      CustomerPriceName: 'PRICE01',
      Status: 0,
      StatusName: '已预报',
      Piece: 3,
      PostalCode: '90001',
      ContentType: 1,
      ContentTypeName: '包裹',
      DeclaredValue: 100,
      CustomerExpressNo: '',
      EntryType: 0,
      RequiresSeparateCustomsDeclaration: false,
      RequiresDutiesAndTaxesPrepayment: false,
      RequiresSpecialVatInvoice: false,
      WaybillCreationStatus: 0,
      TrackNumber: '',
      LabelPath: '',
      IsLabelPrinted: false,
      ForwardingDocumentCount: 0,
      CreateAt: '2025-01-01',
      LastChanged: null,
    };

    service.getDetail(1).subscribe((res) => {
      expect(res.ObjectNo).toBe('TEST001');
    });

    const req = httpMock.expectOne((r) => r.url === baseUrl + '/GetDetail?id=1');
    expect(req.request.method).toBe('GET');
    req.flush(mockDetail);
  });

  // ── create ──
  it('create should POST with request body', () => {
    const request: ImportManifestSaveRequest = {
      ObjectId: null,
      ObjectNo: 'NEW001',
      CountryId: 10,
      CustomerPriceName: 'PRICE01',
      Piece: 5,
      ContentType: 1,
      PostalCode: '90001',
      DeclaredValue: 200,
      CustomerExpressNo: null,
      RequiresSeparateCustomsDeclaration: false,
      RequiresDutiesAndTaxesPrepayment: false,
      RequiresSpecialVatInvoice: false,
    };

    service.create(request).subscribe((res) => {
      expect(res.Success).toBe(true);
    });

    const req = httpMock.expectOne(baseUrl + '/Create');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.ObjectNo).toBe('NEW001');
    req.flush({ Success: true, ErrMsg: '' });
  });

  // ── edit ──
  it('edit should POST with request body including ObjectId', () => {
    const request: ImportManifestSaveRequest = {
      ObjectId: 5,
      ObjectNo: 'EDIT001',
      CountryId: 20,
      CustomerPriceName: 'PRICE02',
      Piece: 2,
      ContentType: 0,
      PostalCode: null,
      DeclaredValue: null,
      CustomerExpressNo: null,
      RequiresSeparateCustomsDeclaration: true,
      RequiresDutiesAndTaxesPrepayment: false,
      RequiresSpecialVatInvoice: false,
    };

    service.edit(request).subscribe();

    const req = httpMock.expectOne(baseUrl + '/Edit');
    expect(req.request.body.ObjectId).toBe(5);
    req.flush({ Success: true, ErrMsg: '' });
  });

  // ── delete ──
  it('delete should POST with id param', () => {
    service.delete(10).subscribe((res) => {
      expect(res.Success).toBe(true);
    });

    const req = httpMock.expectOne((r) => r.url === baseUrl + '/Delete?id=10');
    expect(req.request.method).toBe('POST');
    req.flush({ Success: true, ErrMsg: '' });
  });

  // ── bulkDelete ──
  it('bulkDelete should POST with Ids array', () => {
    const ids = [1, 2, 3];
    service.bulkDelete(ids).subscribe((res) => {
      expect(res.DeletedCount).toBe(2);
      expect(res.SkippedCount).toBe(1);
    });

    const req = httpMock.expectOne(baseUrl + '/BulkDelete');
    expect(req.request.body.Ids).toEqual([1, 2, 3]);
    const result: BulkDeleteResult = {
      Success: true,
      Message: '删除成功，1条已收货记录被跳过',
      DeletedCount: 2,
      SkippedCount: 1,
      SkippedMessages: ['单据 TEST003 已收货，无法删除'],
    };
    req.flush(result);
  });

  // ── parseImport ──
  it('parseImport should POST FormData', () => {
    const formData = new FormData();
    formData.append('file', new Blob(['test']), 'test.csv');

    service.parseImport(formData).subscribe((res) => {
      expect(res.Success).toBe(true);
      expect(res.Summary.TotalRows).toBe(5);
    });

    const req = httpMock.expectOne(baseUrl + '/ParseImport');
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    const mockResponse: ParseImportResponse = {
      Success: true,
      ErrorType: '',
      Message: '',
      Summary: { TotalRows: 5, ValidRows: 4, ErrorRows: 1 },
      Rows: [],
    };
    req.flush(mockResponse);
  });

  // ── saveImport ──
  it('saveImport should POST with Rows wrapper', () => {
    const rows = [
      {
        ObjectNo: 'IMP001',
        CountryId: 10,
        CustomerPriceName: 'PRICE01',
        Piece: 3,
        ContentType: 1,
        PostalCode: '',
        CustomerExpressNo: '',
        DeclaredValue: null,
        RequiresSeparateCustomsDeclaration: false,
        RequiresDutiesAndTaxesPrepayment: false,
        RequiresSpecialVatInvoice: false,
      },
    ];

    service.saveImport(rows).subscribe((res) => {
      expect(res.Success).toBe(true);
    });

    const req = httpMock.expectOne(baseUrl + '/SaveImport');
    expect(req.request.body.Rows.length).toBe(1);
    req.flush({ Success: true, ErrMsg: '' });
  });

  // ── getCountryOptions ──
  it('getCountryOptions should GET dropdown options', () => {
    const mockOptions: DropdownOption[] = [
      { Id: 1, Code: 'US', Name: '美国' },
      { Id: 2, Code: 'GB', Name: '英国' },
    ];

    service.getCountryOptions().subscribe((res) => {
      expect(res.length).toBe(2);
      expect(res[0].Code).toBe('US');
    });

    const req = httpMock.expectOne(baseUrl + '/GetCountryOptions');
    expect(req.request.method).toBe('GET');
    req.flush(mockOptions);
  });

  // ── getCustomerPriceOptions ──
  it('getCustomerPriceOptions should GET price dropdown options', () => {
    service.getCustomerPriceOptions().subscribe();

    const req = httpMock.expectOne(baseUrl + '/GetCustomerPriceOptions');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  // ── validateObjectNo ──
  it('validateObjectNo should POST with objectNo and excludeId', () => {
    service.validateObjectNo('DUP001', 99).subscribe((res) => {
      expect(res.Success).toBe(false);
      expect(res.ErrMsg).toBe('单号已存在');
    });

    const req = httpMock.expectOne(baseUrl + '/ValidateObjectNo');
    expect(req.request.body.ObjectNo).toBe('DUP001');
    expect(req.request.body.ExcludeId).toBe(99);
    req.flush({ Success: false, ErrMsg: '单号已存在' });
  });

  it('validateObjectNo should send null excludeId when not provided', () => {
    service.validateObjectNo('NEW001').subscribe();

    const req = httpMock.expectOne(baseUrl + '/ValidateObjectNo');
    expect(req.request.body.ExcludeId).toBeNull();
    req.flush({ Success: true, ErrMsg: '' });
  });

  // ── validateCustomerPriceName ──
  it('validateCustomerPriceName should POST with PriceCode', () => {
    service.validateCustomerPriceName('PRICE01').subscribe((res) => {
      expect(res.Success).toBe(true);
    });

    const req = httpMock.expectOne(baseUrl + '/ValidateCustomerPriceName');
    expect(req.request.body.PriceCode).toBe('PRICE01');
    req.flush({ Success: true, ErrMsg: '' });
  });

  // ── downloadTemplate ──
  it('downloadTemplate should GET as blob', () => {
    service.downloadTemplate().subscribe((res) => {
      expect(res instanceof Blob).toBe(true);
    });

    const req = httpMock.expectOne(baseUrl + '/DownloadTemplate');
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['template data']));
  });
});
