import { SignalR, SignalRConnection } from './signal-r.service';

// ------------------------------------------------------------------
// Helper: build a chainable mock that simulates $.connection.start()
// ------------------------------------------------------------------
function makeSuccessStart(): any {
  return { done(cb) { cb(); return { fail() {} }; } };
}

function makeFailStart(message: string = 'connection failed'): any {
  return { done() { return { fail(cb) { cb(new Error(message)); } }; } };
}

// ------------------------------------------------------------------

describe('SignalR / SignalRConnection', () => {
  let mockProxy: any;
  let mockConn: any;

  beforeEach(() => {
    mockProxy = {
      on:     jasmine.createSpy('proxy.on'),
      invoke: jasmine.createSpy('proxy.invoke')
    };
    mockConn = {
      logging:          false,
      data:             '' as any,
      disconnected:     jasmine.createSpy('conn.disconnected'),
      reconnecting:     jasmine.createSpy('conn.reconnecting'),
      reconnected:      jasmine.createSpy('conn.reconnected'),
      createHubProxy:   jasmine.createSpy('conn.createHubProxy').and.returnValue(mockProxy),
      start:            jasmine.createSpy('conn.start'),
      stop:             jasmine.createSpy('conn.stop')
    };
    (window as any).$ = {
      hubConnection: jasmine.createSpy('$.hubConnection').and.returnValue(mockConn)
    };
  });

  // ── 1. Factory service ────────────────────────────────────────────
  describe('SignalR factory', () => {
    it('createConnection() should return a SignalRConnection instance', () => {
      mockConn.start.and.returnValue(makeSuccessStart());
      const svc = new SignalR();
      expect(svc.createConnection() instanceof SignalRConnection).toBe(true);
    });
  });

  // ── 2. Construction ───────────────────────────────────────────────
  describe('constructor', () => {
    it('calls $.hubConnection with the given URL and registers __forceHubRegistration__', () => {
      new SignalRConnection('https://test-url', 'chatGroupHub', false);

      expect((window as any).$.hubConnection).toHaveBeenCalledWith(
        'https://test-url',
        jasmine.objectContaining({ useDefaultPath: false })
      );
      expect(mockProxy.on).toHaveBeenCalledWith(
        '__forceHubRegistration__',
        jasmine.any(Function)
      );
    });
  });

  // ── 3. start() success ────────────────────────────────────────────
  describe('start() – success path', () => {
    it('sets connection.data to lowercased hub name, resolves with self, emits connected', (done) => {
      mockConn.start.and.returnValue(makeSuccessStart());

      const conn = new SignalRConnection('https://test-url', 'chatGroupHub', false);
      const emitted: string[] = [];
      conn.status.subscribe(s => emitted.push(s.name));

      conn.start().then(result => {
        expect(mockConn.data).toBe(JSON.stringify([{ name: 'chatgrouphub' }]));
        expect(result).toBe(conn);
        expect(emitted).toContain('connected');
        done();
      }).catch(done.fail);
    });
  });

  // ── 4. start() retry → success ────────────────────────────────────
  describe('start() – retry then succeed', () => {
    it('reinitialises the connection and resolves on the second attempt', (done) => {
      let callCount = 0;
      mockConn.start.and.callFake(() => {
        callCount++;
        return callCount === 1 ? makeFailStart() : makeSuccessStart();
      });

      jasmine.clock().install();

      const conn = new SignalRConnection('https://test-url', 'chatGroupHub', false);
      conn.start().then(result => {
        expect(callCount).toBe(2);
        expect(result).toBe(conn);
        jasmine.clock().uninstall();
        done();
      }).catch(err => { jasmine.clock().uninstall(); done.fail(err); });

      // Advance past the first retry delay (baseDelayMs = 800ms)
      jasmine.clock().tick(800);
    });
  });

  // ── 5. start() exhaust retries ────────────────────────────────────
  describe('start() – exhaust all retries', () => {
    it('rejects after maxAttempts (5) and emits disconnected', (done) => {
      spyOn(console, 'error').and.stub(); // suppress expected error log
      mockConn.start.and.returnValue(makeFailStart('always fails'));

      jasmine.clock().install();

      const conn = new SignalRConnection('https://test-url', 'chatGroupHub', false);
      const emitted: string[] = [];
      conn.status.subscribe(s => emitted.push(s.name));

      conn.start().then(() => {
        jasmine.clock().uninstall();
        done.fail('Expected the promise to reject');
      }).catch(err => {
        expect(err).toBeTruthy();
        expect(emitted[emitted.length - 1]).toBe('disconnected');
        jasmine.clock().uninstall();
        done();
      });

      // Total time for 4 retries: 800 + 1600 + 3200 + 6400 = 12 000 ms
      jasmine.clock().tick(12001);
    });
  });

  // ── 6. stop() during pending retry ────────────────────────────────
  describe('stop()', () => {
    it('cancels the pending retry timer and calls connection.stop()', () => {
      mockConn.start.and.returnValue(makeFailStart());

      jasmine.clock().install();

      const conn = new SignalRConnection('https://test-url', 'chatGroupHub', false);
      const emitted: string[] = [];
      conn.status.subscribe(s => emitted.push(s.name));

      conn.start(); // first attempt fails, 800 ms retry scheduled

      conn.stop();  // should cancel that timer

      expect(mockConn.stop).toHaveBeenCalled();
      expect(emitted).toContain('disconnected');

      jasmine.clock().tick(1000); // advance past would-be retry

      // start() should have been called only once (retry was cancelled)
      expect(mockConn.start.calls.count()).toBe(1);

      jasmine.clock().uninstall();
    });
  });

  // ── 7. getRetryDelay() ────────────────────────────────────────────
  describe('getRetryDelay()', () => {
    it('doubles the delay per attempt and caps at 8 000 ms', () => {
      const conn: any = new SignalRConnection('https://test-url', 'chatGroupHub', false);
      expect(conn.getRetryDelay(1)).toBe(800);     // 800 * 2^0
      expect(conn.getRetryDelay(2)).toBe(1600);    // 800 * 2^1
      expect(conn.getRetryDelay(3)).toBe(3200);    // 800 * 2^2
      expect(conn.getRetryDelay(4)).toBe(6400);    // 800 * 2^3
      expect(conn.getRetryDelay(5)).toBe(8000);    // capped at maxDelayMs
    });
  });

  // ── 8. listenFor() ────────────────────────────────────────────────
  describe('listenFor()', () => {
    it('registers the event on the hub proxy and the returned Subject emits incoming data', () => {
      const conn = new SignalRConnection('https://test-url', 'chatGroupHub', false);
      const received: any[] = [];

      const subject = conn.listenFor('myEvent');
      subject.subscribe(d => received.push(d));

      // Locate the callback registered via proxy.on('myEvent', cb)
      const allRegistrations = (mockProxy.on as jasmine.Spy).calls.allArgs();
      const entry = allRegistrations.find(args => args[0] === 'myEvent');
      expect(entry).toBeDefined('Expected proxy.on to be called with "myEvent"');

      entry[1]({ payload: 'hello' });

      expect(received.length).toBe(1);
      expect(received[0]).toEqual({ payload: 'hello' });
    });
  });

  // ── 9. invoke() ───────────────────────────────────────────────────
  describe('invoke()', () => {
    it('resolves with the server response on success', (done) => {
      mockProxy.invoke.and.returnValue({
        done(cb) { cb({ result: 42 }); return { fail() {} }; }
      });

      const conn = new SignalRConnection('https://test-url', 'chatGroupHub', false);
      conn.invoke('ServerMethod', 'arg1').then(data => {
        expect(data).toEqual({ result: 42 });
        done();
      }).catch(done.fail);
    });

    it('rejects when the proxy invocation fails', (done) => {
      mockProxy.invoke.and.returnValue({
        done() { return { fail(cb) { cb(new Error('invoke error')); } }; }
      });

      const conn = new SignalRConnection('https://test-url', 'chatGroupHub', false);
      conn.invoke('ServerMethod').then(() => done.fail('Expected rejection')).catch(err => {
        expect(err.message).toBe('invoke error');
        done();
      });
    });
  });
});
