import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { CommonService } from './common.service';
import { apiUrl } from '../global';

describe('CommonService', () => {
  let service: CommonService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    service = TestBed.get(CommonService);
    httpMock = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getJsSdkConfig should request sdk config with expected query params', () => {
    service.getJsSdkConfig('https://example.com/cb', 'chooseImage,scanQRCode', 'wx-open-launch-app').subscribe();

    const req = httpMock.expectOne(r => r.url === apiUrl + '/common/GetWxSdkConfigInfo');
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.params.get('url')).toBe('https://example.com/cb');
    expect(req.request.params.get('jsApiList')).toBe('chooseImage,scanQRCode');
    expect(req.request.params.get('openTagList')).toBe('wx-open-launch-app');

    req.flush({});
  });
});
