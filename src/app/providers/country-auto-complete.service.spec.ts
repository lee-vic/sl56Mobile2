import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { CookieService } from 'ngx-cookie-service';

import { CountryAutoCompleteService } from './country-auto-complete.service';

describe('CountryAutoCompleteService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [HttpClientTestingModule, RouterTestingModule],
    providers: [CookieService]
  }));

  it('should be created', () => {
    const service: CountryAutoCompleteService = TestBed.get(CountryAutoCompleteService);
    expect(service).toBeTruthy();
  });
});
