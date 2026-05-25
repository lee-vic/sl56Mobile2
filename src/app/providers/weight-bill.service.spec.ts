import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { WeightBillService } from './weight-bill.service';
import { apiUrl } from '../global';

describe('WeightBillService', () => {
  let service: WeightBillService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    service = TestBed.get(WeightBillService);
    httpMock = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getWeightBill should call endpoint with objectId', () => {
    service.getWeightBill('abc').subscribe();

    const req = httpMock.expectOne(r => r.url === apiUrl + '/Measure/GetWeightBill');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('objectId')).toBe('abc');
    expect(req.request.withCredentials).toBe(true);
    req.flush({});
  });

  it('payWeighingFee should post payload', () => {
    const payload = { id: 1, amount: 100 };
    service.payWeighingFee(payload).subscribe();

    const req = httpMock.expectOne(apiUrl + '/Measure/PayWeighingFee');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    expect(req.request.withCredentials).toBe(true);
    req.flush({});
  });

  it('start should call start endpoint with credentials', () => {
    service.start({} as any).subscribe();

    const req = httpMock.expectOne(apiUrl + '/Measure/Start');
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    req.flush(true);
  });

  it('getHistoryVehicleNo should send openid query param', () => {
    service.getHistoryVehicleNo('openid-1').subscribe();

    const req = httpMock.expectOne(r => r.url === apiUrl + '/Measure/HistoryVehicleNo');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('openid')).toBe('openid-1');
    expect(req.request.withCredentials).toBe(true);
    req.flush([]);
  });

  it('getWeightBillDefaultValue should send openId and vehicleNo query params', () => {
    service.getWeightBillDefaultValue('open-2', '粤B12345').subscribe();

    const req = httpMock.expectOne(r => r.url === apiUrl + '/Measure/GetWeightBillDefaultValue');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('openId')).toBe('open-2');
    expect(req.request.params.get('vehicleNo')).toBe('粤B12345');
    expect(req.request.withCredentials).toBe(true);
    req.flush({});
  });
});
