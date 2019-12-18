import { TestBed } from '@angular/core/testing';

import { BankSlipsService } from './bank-slips.service';

describe('BankSlipsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: BankSlipsService = TestBed.get(BankSlipsService);
    expect(service).toBeTruthy();
  });
});
