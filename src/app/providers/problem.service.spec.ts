import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { CookieService } from 'ngx-cookie-service';

import { ProblemService } from './problem.service';
import { apiUrl } from '../global';

describe('ProblemService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [HttpClientTestingModule, RouterTestingModule],
    providers: [CookieService]
  }));

  it('should be created', () => {
    const service: ProblemService = TestBed.get(ProblemService);
    expect(service).toBeTruthy();
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('loads category totals with customer credentials', () => {
    TestBed.inject(ProblemService).getListCounts().subscribe(counts => expect(counts.Before).toBe(12));
    const request = TestBed.inject(HttpTestingController).expectOne(apiUrl + '/Problem/GetListCounts');
    expect(request.request.withCredentials).toBe(true);
    request.flush({ Before: 12, InTransit: 3, Confirmable: 5 });
  });

  [0, 1, 2, 3].forEach(type => {
    it('sends the PC-aligned problem category ' + type, () => {
      TestBed.inject(ProblemService).getList(1, '', type).subscribe();
      const request = TestBed.inject(HttpTestingController).expectOne(req => req.url === apiUrl + '/Problem/GetList');
      expect(request.request.params.get('type')).toBe(String(type));
      expect(request.request.withCredentials).toBe(true);
      request.flush([]);
    });
  });

  ['confirm', 'complete', 'invoicePretreatment'].forEach(action => {
    it('normalizes Messages failures for ' + action, () => {
      const service = TestBed.inject(ProblemService);
      const request$ = action === 'confirm' ? service.confirm(10)
        : action === 'complete' ? service.complete({ Id: 10 }) : service.invoicePretreatment({ Id: 10 });
      request$.subscribe(response => {
        expect(response.Result).toBe(false);
        expect(response.IsSuccess).toBe(false);
        expect(response.Message).toBe('处理失败，请刷新');
        expect(response.ErrorId).toBe('test-error');
      });
      TestBed.inject(HttpTestingController).expectOne(req => req.method === 'POST')
        .flush({ Success: false, Messages: ['处理失败，请刷新'], ErrorId: 'test-error' });
    });
  });

  it('keeps normal business failure messages', () => {
    TestBed.inject(ProblemService).complete({ Id: 10 }).subscribe(response => {
      expect(response.Result).toBe(false);
      expect(response.Message).toBe('文件页数超限');
    });
    TestBed.inject(HttpTestingController).expectOne(req => req.method === 'POST')
      .flush({ Result: false, Message: '文件页数超限' });
  });

  [10, 'v2.ABC_def-123'].forEach(problemId => {
    it('keeps legacy or signed problemId unchanged: ' + problemId, () => {
      const service = TestBed.inject(ProblemService);
      service.getProblemDetail(problemId).subscribe();
      const request = TestBed.inject(HttpTestingController).expectOne(req =>
        req.url === apiUrl + '/Problem/GetProblemDetail');
      expect(request.request.params.get('problemId')).toBe(String(problemId));
      expect(request.request.params.has('workspaceMode')).toBe(false);
      expect(request.request.withCredentials).toBe(true);
      request.flush({});
    });
  });

  it('opts into workspace selection without changing the link payload', () => {
    TestBed.inject(ProblemService).getProblemDetail('v2.ABC_def-123', true).subscribe();
    const request = TestBed.inject(HttpTestingController).expectOne(req =>
      req.url === apiUrl + '/Problem/GetProblemDetail');
    expect(request.request.params.get('problemId')).toBe('v2.ABC_def-123');
    expect(request.request.params.get('workspaceMode')).toBe('true');
    request.flush({});
  });
});
