import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CalculationDetailPage } from './calculation-detail.page';

describe('CalculationDetailPage', () => {
  let component: CalculationDetailPage;
  let fixture: ComponentFixture<CalculationDetailPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CalculationDetailPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CalculationDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
