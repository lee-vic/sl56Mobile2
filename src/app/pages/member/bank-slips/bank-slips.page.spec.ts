import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BankSlipsPage } from './bank-slips.page';

describe('BankSlipsPage', () => {
  let component: BankSlipsPage;
  let fixture: ComponentFixture<BankSlipsPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BankSlipsPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BankSlipsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
