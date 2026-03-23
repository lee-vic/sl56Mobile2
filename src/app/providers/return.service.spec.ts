import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { CookieService } from 'ngx-cookie-service';

import { ReturnService } from './return.service';

describe('ReturnListService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [HttpClientTestingModule, RouterTestingModule],
    providers: [CookieService]
  }));

  it('should be created', () => {
    const service: ReturnService = TestBed.get(ReturnService);
    expect(service).toBeTruthy();
  });
});
