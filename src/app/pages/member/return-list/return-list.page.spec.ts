import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReturnListPage } from './return-list.page';

describe('ReturnListPage', () => {
  let component: ReturnListPage;
  let fixture: ComponentFixture<ReturnListPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReturnListPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReturnListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
