import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { CookieService } from 'ngx-cookie-service';

import { DeliveryRecordDetailService } from './delivery-record-detail.service';

describe('DeliveryRecordDetailService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [HttpClientTestingModule, RouterTestingModule],
    providers: [CookieService]
  }));

  it('should be created', () => {
    const service: DeliveryRecordDetailService = TestBed.get(DeliveryRecordDetailService);
    expect(service).toBeTruthy();
  });
});
