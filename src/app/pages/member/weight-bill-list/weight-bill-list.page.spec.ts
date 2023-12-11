import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WeightBillListPage } from './weight-bill-list.page';

describe('WeightBillListPage', () => {
  let component: WeightBillListPage;
  let fixture: ComponentFixture<WeightBillListPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WeightBillListPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WeightBillListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
