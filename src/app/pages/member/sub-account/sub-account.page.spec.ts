import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SubAccountPage } from './sub-account.page';

describe('SubAccountPage', () => {
  let component: SubAccountPage;
  let fixture: ComponentFixture<SubAccountPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SubAccountPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SubAccountPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
