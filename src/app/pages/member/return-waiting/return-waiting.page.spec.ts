import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReturnWaitingPage } from './return-waiting.page';

describe('ReturnWaitingComponent', () => {
  let component: ReturnWaitingPage;
  let fixture: ComponentFixture<ReturnWaitingPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReturnWaitingPage ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReturnWaitingPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
