import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { WarehouseApplicationService } from './warehouse-application.service';
import { apiUrl } from '../global';

describe('WarehouseApplicationService', () => {
  let service: WarehouseApplicationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    service = TestBed.get(WarehouseApplicationService);
    httpMock = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getList should call list endpoint with pageIndex', () => {
    service.getList(3).subscribe();

    const req = httpMock.expectOne(r => r.url === apiUrl + '/WarehouseTask/GetList');
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.params.get('pageIndex')).toBe('3');
    req.flush({});
  });

  it('save should set Id to null when application Id is 0', () => {
    const model: any = { Id: 0, Name: 'A' };

    service.save(model).subscribe();

    const req = httpMock.expectOne(apiUrl + '/WarehouseTask/Save');
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    expect(req.request.body.Id).toBeNull();
    req.flush({ Success: true });
  });

  it('cancel should post id payload', () => {
    service.cancel(8).subscribe();

    const req = httpMock.expectOne(apiUrl + '/WarehouseTask/Cancel');
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.body).toEqual({ id: 8 });
    req.flush({ Success: true });
  });

  it('detail should call detail endpoint with id query', () => {
    service.detail(77).subscribe();

    const req = httpMock.expectOne(r => r.url === apiUrl + '/WarehouseTask/Detail');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('id')).toBe('77');
    expect(req.request.withCredentials).toBe(true);
    req.flush({});
  });

  it('pay should post data with credentials', () => {
    const payload = { orderId: 10, amount: 20 };
    service.pay(payload).subscribe();

    const req = httpMock.expectOne(apiUrl + '/WarehouseTask/Pay');
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    expect(req.request.body).toEqual(payload);
    req.flush({});
  });
});
