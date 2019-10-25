import { TestBed } from '@angular/core/testing';

import { InstantMessageService } from './instant-message.service';

describe('InstantMessageService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: InstantMessageService = TestBed.get(InstantMessageService);
    expect(service).toBeTruthy();
  });
});
