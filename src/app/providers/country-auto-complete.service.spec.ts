import { TestBed } from '@angular/core/testing';

import { CountryAutoCompleteService } from './country-auto-complete.service';

describe('CountryAutoCompleteService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: CountryAutoCompleteService = TestBed.get(CountryAutoCompleteService);
    expect(service).toBeTruthy();
  });
});
