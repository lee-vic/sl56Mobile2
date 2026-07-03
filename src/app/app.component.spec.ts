import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed, async } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';

import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let routerEvents: Subject<NavigationEnd>;

  beforeEach(async(() => {
    routerEvents = new Subject<NavigationEnd>();

    TestBed.configureTestingModule({
      declarations: [AppComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: Router,
          useValue: {
            url: '/',
            events: routerEvents.asObservable(),
          },
        },
      ],
    }).compileComponents();
  }));

  afterEach(() => {
    document.body.classList.remove('member-center-route');
    routerEvents.complete();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should scope member center styles to member routes', () => {
    TestBed.createComponent(AppComponent);

    routerEvents.next(new NavigationEnd(1, '/member/return-list', '/member/return-list'));
    expect(document.body.classList.contains('member-center-route')).toBe(true);

    routerEvents.next(new NavigationEnd(2, '/app/tabs/member', '/app/tabs/member'));
    expect(document.body.classList.contains('member-center-route')).toBe(true);

    routerEvents.next(new NavigationEnd(3, '/app/tabs/home', '/app/tabs/home'));
    expect(document.body.classList.contains('member-center-route')).toBe(false);
  });

});
