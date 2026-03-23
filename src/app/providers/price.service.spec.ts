import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { CookieService } from 'ngx-cookie-service';

import { PriceService } from './price.service';

describe('PriceService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [HttpClientTestingModule, RouterTestingModule],
    providers: [CookieService]
  }));

  it('should be created', () => {
    const service: PriceService = TestBed.get(PriceService);
    expect(service).toBeTruthy();
  });
});
