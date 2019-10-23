import { TestBed } from '@angular/core/testing';

import { DeliveryRecordDetailService } from './delivery-record-detail.service';

describe('DeliveryRecordDetailService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DeliveryRecordDetailService = TestBed.get(DeliveryRecordDetailService);
    expect(service).toBeTruthy();
  });
});
