import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { CookieService } from 'ngx-cookie-service';

import { DeliveryRecordService } from './delivery-record.service';

describe('DeliveryRecordService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [HttpClientTestingModule, RouterTestingModule],
    providers: [CookieService]
  }));

  it('should be created', () => {
    const service: DeliveryRecordService = TestBed.get(DeliveryRecordService);
    expect(service).toBeTruthy();
  });
});
