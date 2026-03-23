/* tslint:disable:no-unused-variable */
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { BehaviorSubject } from 'rxjs';

import { InvoicePreviewPage } from './invoice-preview.page';

describe('InvoicePreviewPage (ng2-pdf-viewer migration)', () => {
  let component: InvoicePreviewPage;
  let fixture: ComponentFixture<InvoicePreviewPage>;
  let mockNavCtrl: jasmine.SpyObj<NavController>;
  let queryParamsSubject: BehaviorSubject<any>;

  const defaultParams = {
    rgdId:       1,
    problemId:   2,
    filePath:    'path with spaces.pdf',
    isWeAppFile: false
  };

  beforeEach(async(() => {
    mockNavCtrl = jasmine.createSpyObj('NavController', ['navigateBack']);
    queryParamsSubject = new BehaviorSubject<any>(defaultParams);

    TestBed.configureTestingModule({
      declarations: [InvoicePreviewPage],
      providers: [
        { provide: ActivatedRoute, useValue: { queryParams: queryParamsSubject.asObservable() } },
        { provide: Router,         useValue: {} },
        { provide: NavController,  useValue: mockNavCtrl }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    spyOn(console, 'log').and.stub(); // suppress URL log from constructor
    fixture   = TestBed.createComponent(InvoicePreviewPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── 1. Creation ───────────────────────────────────────────────────
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── 2. invoiceSrc built from queryParams ──────────────────────────
  it('invoiceSrc.withCredentials is true and URL contains the encoded filePath', () => {
    expect(component.invoiceSrc.withCredentials).toBe(true);
    // 'path with spaces.pdf' → 'path%20with%20spaces.pdf'
    expect(component.invoiceSrc.url).toContain(encodeURIComponent('path with spaces.pdf'));
  });

  // ── 3. onPdfLoaded ────────────────────────────────────────────────
  it('onPdfLoaded() sets totalPages, resets currentPage to 1 and clears loadFailed', () => {
    component.currentPage  = 3;
    component.loadFailed   = true;
    component.onPdfLoaded({ numPages: 5 });
    expect(component.totalPages).toBe(5);
    expect(component.currentPage).toBe(1);
    expect(component.loadFailed).toBe(false);
  });

  // ── 4. onPdfError ─────────────────────────────────────────────────
  it('onPdfError() sets loadFailed to true', () => {
    component.loadFailed = false;
    component.onPdfError(new Error('load fail'));
    expect(component.loadFailed).toBe(true);
  });

  // ── 5. prevPage ───────────────────────────────────────────────────
  it('prevPage() decrements currentPage but does not go below 1', () => {
    component.currentPage = 2;
    component.prevPage();
    expect(component.currentPage).toBe(1);

    component.prevPage(); // already at 1
    expect(component.currentPage).toBe(1);
  });

  // ── 6. nextPage ───────────────────────────────────────────────────
  it('nextPage() increments currentPage but does not exceed totalPages', () => {
    component.totalPages  = 3;
    component.currentPage = 1;
    component.nextPage();
    expect(component.currentPage).toBe(2);

    component.currentPage = 3;
    component.nextPage(); // already at last page
    expect(component.currentPage).toBe(3);
  });

  // ── 7. reSelect navigates back with confirmFile=false ─────────────
  it('reSelect() calls navigateBack with the correct path and confirmFile=false', () => {
    component.reSelect();
    expect(mockNavCtrl.navigateBack).toHaveBeenCalledWith(
      '/member/problem-detail/1',
      jasmine.objectContaining({
        queryParams: { problemid: 2 },
        state: jasmine.objectContaining({ confirmFile: false })
      })
    );
  });

  // ── 8. confirm navigates back with confirmFile=true ───────────────
  it('confirm() calls navigateBack with the correct path and confirmFile=true', () => {
    component.confirm();
    expect(mockNavCtrl.navigateBack).toHaveBeenCalledWith(
      '/member/problem-detail/1',
      jasmine.objectContaining({
        state: jasmine.objectContaining({ confirmFile: true })
      })
    );
  });
});
