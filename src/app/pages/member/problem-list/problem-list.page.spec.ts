import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProblemListPage } from './problem-list.page';

describe('ProblemListPage', () => {
  let component: ProblemListPage;
  let fixture: ComponentFixture<ProblemListPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProblemListPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProblemListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
