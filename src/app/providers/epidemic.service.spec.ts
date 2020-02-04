import { TestBed } from '@angular/core/testing';

import { EpidemicService } from './epidemic.service';

describe('EpidemicService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: EpidemicService = TestBed.get(EpidemicService);
    expect(service).toBeTruthy();
  });
});
