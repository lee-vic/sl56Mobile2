import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PriceListPage } from './price-list.page';

describe('PriceListPage', () => {
  let component: PriceListPage;
  let fixture: ComponentFixture<PriceListPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PriceListPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PriceListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
