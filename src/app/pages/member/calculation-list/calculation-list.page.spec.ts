import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CalculationListPage } from './calculation-list.page';

describe('CalculationListPage', () => {
  let component: CalculationListPage;
  let fixture: ComponentFixture<CalculationListPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CalculationListPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CalculationListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
