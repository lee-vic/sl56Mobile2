import { TestBed } from '@angular/core/testing';

import { DeliveryRecordService } from './delivery-record.service';

describe('DeliveryRecordService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DeliveryRecordService = TestBed.get(DeliveryRecordService);
    expect(service).toBeTruthy();
  });
});
