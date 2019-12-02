import { TestBed } from '@angular/core/testing';

import { SubAccountService } from './sub-account.service';

describe('SubAccountService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SubAccountService = TestBed.get(SubAccountService);
    expect(service).toBeTruthy();
  });
});
