import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { CookieService } from 'ngx-cookie-service';

import { apiUrl } from '../global';
import { ReturnService } from './return.service';

describe('ReturnService', () => {
  let service: ReturnService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [CookieService]
    });

    service = TestBed.get(ReturnService);
    httpMock = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should request completed returns with page and keyword params', () => {
    service.getList1(2, 'REF').subscribe(res => {
      expect(res).toEqual([]);
    });

    const req = httpMock.expectOne(request =>
      request.url === apiUrl + '/Return/GetList1' &&
      request.params.get('pageIndex') === '2' &&
      request.params.get('key') === 'REF'
    );

    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBe(true);
    req.flush([]);
  });

  it('should request ongoing returns without search params', () => {
    service.getList2().subscribe(res => {
      expect(res).toEqual([]);
    });

    const req = httpMock.expectOne(apiUrl + '/Return/GetList2');

    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.params.keys().length).toBe(0);
    req.flush([]);
  });

  it('should post apply payload as json body', () => {
    const payload = { PersonName: '张三', MobilePhone: '13800138000', IdList: '1,2' };

    service.apply1(payload).subscribe(res => {
      expect(res.IsSuccess).toBe(true);
    });

    const req = httpMock.expectOne(apiUrl + '/Return/Apply');

    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.body).toEqual(payload);
    req.flush({ IsSuccess: true });
  });

  it('should post wait-list mutation params without a request body', () => {
    service.removeWaitReturnList('1,2').subscribe(res => {
      expect(res).toBe(true);
    });

    const req = httpMock.expectOne(request =>
      request.url === apiUrl + '/Return/RemoveWaitReturnList' &&
      request.params.get('ids') === '1,2'
    );

    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBeNull();
    expect(req.request.withCredentials).toBe(true);
    req.flush(true);
  });

  it('should post mobile update with expected params', () => {
    service.updateMobilePhone(8, '13800138000').subscribe(res => {
      expect(res).toBe('');
    });

    const req = httpMock.expectOne(request =>
      request.url === apiUrl + '/Return/UpdateMobile' &&
      request.params.get('id') === '8' &&
      request.params.get('mobile') === '13800138000'
    );

    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBeNull();
    expect(req.request.withCredentials).toBe(true);
    req.flush('');
  });
});
