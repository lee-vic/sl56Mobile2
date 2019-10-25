import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReturnApplyPage } from './return-apply.page';

describe('ReturnApplyPage', () => {
  let component: ReturnApplyPage;
  let fixture: ComponentFixture<ReturnApplyPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReturnApplyPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReturnApplyPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
