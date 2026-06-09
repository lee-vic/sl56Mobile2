import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { of, throwError } from 'rxjs';

import { ImportManifestListPage } from './import-manifest-list.page';
import { ImportManifestService } from 'src/app/providers/import-manifest.service';
import { ImportManifestListItem } from 'src/app/interfaces/import-manifest';

describe('ImportManifestListPage', () => {
  let component: ImportManifestListPage;
  let fixture: ComponentFixture<ImportManifestListPage>;
  let serviceSpy: jasmine.SpyObj<ImportManifestService>;

  const mockItem = (overrides?: Partial<ImportManifestListItem>): ImportManifestListItem => ({
    Id: 1,
    ObjectNo: 'TEST001',
    CountryName: '美国',
    ModeOfTransportName: '空运',
    CustomerPriceName: 'PRICE01',
    Piece: 3,
    ContentTypeName: '包裹',
    ContentType: 1,
    PostalCode: '90001',
    CustomerExpressNo: '',
    DeclaredValue: '100.00',
    StatusName: '已预报',
    StatusCode: 0,
    ForwardingDocumentCount: 0,
    IsLabelPrinted: false,
    CreateAt: '2025-06-01',
    Selected: false,
    ...overrides,
  });

  const mockListResponse = (rows: ImportManifestListItem[], total: number = rows.length) => ({
    TotalRecords: total,
    Rows: rows,
    Summary: { totalRecords: total, pageIndex: 1, pageSize: 10, currentPageCount: rows.length },
  });

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ImportManifestService', [
      'getList',
      'delete',
      'bulkDelete',
    ]);

    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        FormsModule,
        IonicModule.forRoot(),
      ],
      declarations: [ImportManifestListPage],
      providers: [
        { provide: ImportManifestService, useValue: spy },
        AlertController,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    serviceSpy = TestBed.inject(ImportManifestService) as jasmine.SpyObj<ImportManifestService>;
    fixture = TestBed.createComponent(ImportManifestListPage);
    component = fixture.componentInstance;
  });

  // ── 1. Creation ──
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── 2. ngOnInit loads first page ──
  it('ngOnInit should load first page of items', () => {
    const items = [mockItem({ Id: 1 }), mockItem({ Id: 2, ObjectNo: 'TEST002' })];
    serviceSpy.getList.and.returnValue(of(mockListResponse(items)));

    fixture.detectChanges(); // triggers ngOnInit

    expect(serviceSpy.getList).toHaveBeenCalledWith(1, undefined);
    expect(component.items.length).toBe(2);
    expect(component.items[0].ObjectNo).toBe('TEST001');
    expect(component.isLoaded).toBe(true);
  });

  // ── 3. Load error handling ──
  it('should set error state when load fails', () => {
    serviceSpy.getList.and.returnValue(throwError(() => new Error('Network error')));
    spyOn(console, 'error').and.stub();

    fixture.detectChanges();

    expect(component.hasLoadError).toBe(true);
    expect(component.loadErrorMessage).toBe('加载失败，请下拉刷新重试');
  });

  // ── 4. Empty state ──
  it('should handle empty response', () => {
    serviceSpy.getList.and.returnValue(of(mockListResponse([])));

    fixture.detectChanges();

    expect(component.items.length).toBe(0);
    expect(component.isLoaded).toBe(true);
    expect(component.hasLoadError).toBe(false);
  });

  // ── 5. Infinite scroll disables when less than page size ──
  it('should disable infinite scroll when response has fewer items than page size', () => {
    serviceSpy.getList.and.returnValue(of(mockListResponse([mockItem()], 1)));

    fixture.detectChanges();

    expect(component.infiniteScroll.disabled).toBe(true);
  });

  // ── 6. Search input with debounce ──
  it('should debounce search input and reload', (done) => {
    serviceSpy.getList.and.returnValue(of(mockListResponse([])));

    // First load
    fixture.detectChanges();

    const event = { detail: { value: 'TEST' } } as CustomEvent;
    component.onSearchInput(event);

    expect(component.searchKeyword).toBe('TEST');

    setTimeout(() => {
      expect(serviceSpy.getList).toHaveBeenCalledWith(1, 'TEST');
      done();
    }, 300);
  });

  // ── 7. Search cancel clears keyword ──
  it('onSearchCancel should clear keyword and reload all', () => {
    serviceSpy.getList.and.returnValue(of(mockListResponse([])));

    component.searchKeyword = 'TEST';
    component.onSearchCancel();

    expect(component.searchKeyword).toBe('');
    // loadFirstPage passes '' through getItems which does key || undefined => undefined
    expect(serviceSpy.getList).toHaveBeenCalledWith(1, undefined);
  });

  // ── 8. Selection mode toggle ──
  it('toggleSelectionMode should toggle mode and clear selections', () => {
    component.items = [mockItem({ Id: 1, Selected: true })];
    component.selectedIds.add(1);

    component.toggleSelectionMode();
    expect(component.isSelectionMode).toBe(true);

    component.toggleSelectionMode();
    expect(component.isSelectionMode).toBe(false);
    expect(component.selectedIds.size).toBe(0);
  });

  // ── 9. Toggle item selection ──
  it('toggleItemSelection should add/remove items from selectedIds', () => {
    const item = mockItem();
    component.toggleItemSelection(item);

    expect(item.Selected).toBe(true);
    expect(component.selectedIds.has(1)).toBe(true);

    component.toggleItemSelection(item);

    expect(item.Selected).toBe(false);
    expect(component.selectedIds.has(1)).toBe(false);
  });

  // ── 11. getSelectedCount ──
  it('getSelectedCount should return correct count', () => {
    component.selectedIds.add(1);
    component.selectedIds.add(2);
    expect(component.getSelectedCount()).toBe(2);
  });

  // ── 12. getStatusColor ──
  it('getStatusColor should return correct color for each status', () => {
    expect(component.getStatusColor(0)).toBe('warning');
    expect(component.getStatusColor(1)).toBe('success');
    expect(component.getStatusColor(2)).toBe('danger');
    expect(component.getStatusColor(99)).toBe('medium');
  });

  // ── 13. canDelete ──
  it('canDelete should be true only for StatusCode 0', () => {
    expect(component.canDelete(mockItem({ StatusCode: 0 }))).toBe(true);
    expect(component.canDelete(mockItem({ StatusCode: 1 }))).toBe(false);
    expect(component.canDelete(mockItem({ StatusCode: 2 }))).toBe(false);
  });

  // ── 14. trackById ──
  it('trackById should return item Id', () => {
    expect(component.trackById(0, mockItem({ Id: 42 }))).toBe(42);
  });

  // ── 15. Perform delete success ──
  it('performDelete should remove item on success', () => {
    const item = mockItem({ Id: 10, ObjectNo: 'DEL001' });
    component.items = [item];
    component.selectedIds.add(10);
    serviceSpy.delete.and.returnValue(of({ Success: true, ErrMsg: '' }));

    (component as any).performDelete(10);

    expect(component.items.length).toBe(0);
    expect(component.selectedIds.has(10)).toBe(false);
  });

  // ── 16. Perform delete failure keeps item ──
  it('performDelete should keep item on API error', () => {
    const item = mockItem({ Id: 10 });
    component.items = [item];
    serviceSpy.delete.and.returnValue(of({ Success: false, ErrMsg: '无法删除' }));
    spyOn(component as any, 'showAlert');

    (component as any).performDelete(10);

    expect(component.items.length).toBe(1);
    expect((component as any).showAlert).toHaveBeenCalledWith('删除失败', '无法删除');
  });

  // ── 17. ngOnDestroy cleans up ──
  it('ngOnDestroy should clear timeout and unsubscribe', () => {
    (component as any).searchDebounceTimer = setTimeout(() => {}, 1000);
    spyOn(window, 'clearTimeout').and.callThrough();

    component.ngOnDestroy();

    expect(clearTimeout).toHaveBeenCalled();
  });
});
