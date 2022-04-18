/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoicePreviewPage } from './invoice-preview.page';

describe('InvoicePreviewComponent', () => {
  let component: InvoicePreviewPage;
  let fixture: ComponentFixture<InvoicePreviewPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InvoicePreviewPage ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InvoicePreviewPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
