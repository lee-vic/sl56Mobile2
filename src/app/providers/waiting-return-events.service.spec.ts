import { TestBed } from '@angular/core/testing';

import { WaitingReturnEventsService } from './waiting-return-events.service';

describe('WaitingReturnEventsService', () => {
  let service: WaitingReturnEventsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.get(WaitingReturnEventsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should emit reload event when notifyReloadWaitingReturn is called', () => {
    const handler = jasmine.createSpy('reloadHandler');
    service.onReloadWaitingReturn().subscribe(() => handler());

    service.notifyReloadWaitingReturn();

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should emit once for each notify call', () => {
    let count = 0;
    service.onReloadWaitingReturn().subscribe(() => count++);

    service.notifyReloadWaitingReturn();
    service.notifyReloadWaitingReturn();

    expect(count).toBe(2);
  });
});
