import { TestBed } from '@angular/core/testing';

import { MessageSubscriptionService } from './message-subscription.service';

describe('MessageSubscriptionService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: MessageSubscriptionService = TestBed.get(MessageSubscriptionService);
    expect(service).toBeTruthy();
  });
});
