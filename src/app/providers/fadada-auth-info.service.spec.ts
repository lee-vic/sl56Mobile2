import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { FaDaDaAuthInfoService } from './fadada-auth-info.service';
import { apiUrl } from '../global';

describe('FaDaDaAuthInfoService', () => {
  let service: FaDaDaAuthInfoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    service = TestBed.get(FaDaDaAuthInfoService);
    httpMock = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getIsAuth should call IsAuth endpoint with credentials', () => {
    let value: boolean;

    service.getIsAuth().subscribe(res => (value = res));

    const req = httpMock.expectOne(apiUrl + '/FaDaDa/IsAuth');
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBe(true);

    req.flush(true);
    expect(value).toBe(true);
  });

  it('getAuthUrl should call GetAuthUrl endpoint with credentials', () => {
    let value: string;

    service.getAuthUrl().subscribe(res => (value = res));

    const req = httpMock.expectOne(apiUrl + '/FaDaDa/GetAuthUrl');
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBe(true);

    req.flush('https://auth.example.com');
    expect(value).toBe('https://auth.example.com');
  });
});
