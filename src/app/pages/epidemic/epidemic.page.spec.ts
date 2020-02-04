import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EpidemicPage } from './epidemic.page';

describe('EpidemicPage', () => {
  let component: EpidemicPage;
  let fixture: ComponentFixture<EpidemicPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EpidemicPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EpidemicPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
