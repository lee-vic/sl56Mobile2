import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { of, Subject, throwError } from 'rxjs';

import { ImportManifestListPage } from './import-manifest-list.page';
import { ImportManifestService } from 'src/app/providers/import-manifest.service';
import { ImportManifestListItem } from 'src/app/interfaces/import-manifest';

describe('ImportManifestListPage', () => {
  let component: ImportManifestListPage;
  let fixture: ComponentFixture<ImportManifestListPage>;
  let serviceSpy: jasmine.SpyObj<ImportManifestService>;
  let router: Router;
  let alertCtrl: AlertController;

  const mockItem = (overrides?: Partial<ImportManifestListItem>): ImportManifestListItem => ({
    Id: 1,
    ObjectNo: 'TEST001',
    CountryName: '美国',
    ModeOfTransportName: '空运',
    CustomerPriceCode: 'PRICE01',
    Piece: 3,
    Weight: 2.0,
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
      'consumeListDirty',
      'batchDocuments',
      'batchStatus',
      'getMergedLabels',
      'markPrinted',
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
    router = TestBed.inject(Router);
    alertCtrl = TestBed.inject(AlertController);
    fixture = TestBed.createComponent(ImportManifestListPage);
    component = fixture.componentInstance;
  });

  it('registers only the labels included in the returned partial PDF', async () => {
    component.selectedIds = new Set([10, 20]);
    serviceSpy.getMergedLabels.and.returnValue(of(new HttpResponse({body: new Blob(['pdf']),
      headers: new HttpHeaders({'X-MergePrint-Included': '20'})})));
    serviceSpy.markPrinted.and.returnValue(of({Success: true, UpdatedIds: [20], Message: ''}));
    serviceSpy.getList.and.returnValue(of(mockListResponse([])));
    spyOn(alertCtrl, 'create').and.callFake(async (options: any) => {
      if (options.header === '登记打印') options.buttons[1].handler();
      return {present: async () => {}} as any;
    });
    component.selectedFile('labels');
    await component.confirmPrinted();
    expect(serviceSpy.markPrinted).toHaveBeenCalledWith([20]);
  });

  it('rejects print registration when a PDF comes back without the included IDs', async () => {
    component.selectedIds.add(10);
    serviceSpy.getMergedLabels.and.returnValue(of(new HttpResponse({body: new Blob(['pdf'])})));
    spyOn(alertCtrl, 'create').and.returnValue(Promise.resolve({present: async () => {}} as any));
    component.selectedFile('labels');
    await component.confirmPrinted();
    expect(serviceSpy.markPrinted).not.toHaveBeenCalled();
  });

  it('replaces a pending list request when only-unprinted is enabled', () => {
    const previous = new Subject<ReturnType<typeof mockListResponse>>();
    const unprinted = mockItem({ Id: 4 });
    serviceSpy.getList.and.returnValues(previous, of(mockListResponse([unprinted])));
    fixture.detectChanges();
    component.onlyUnprinted = true;
    component.loadFirstPage('ABC');
    previous.next(mockListResponse([mockItem({ IsLabelPrinted: true })]));
    expect(serviceSpy.getList).toHaveBeenCalledWith(1, 'ABC', undefined, undefined, true);
    expect(component.items).toEqual([unprinted]);
  });

  it('requires the inspection receipt before committing or querying a batch', () => {
    component.archive = new File(['fixture'], 'invoice.zip');
    component.documentType = 8;
    component.submitArchive('commit');
    component.submitArchive('status');
    expect(serviceSpy.batchDocuments).not.toHaveBeenCalled();
    expect(serviceSpy.batchStatus).not.toHaveBeenCalled();
  });

  it('confirms the inspected archive and recovers the same batch result', () => {
    serviceSpy.getList.and.returnValue(of(mockListResponse([])));
    fixture.detectChanges();
    const file = new File(['fixture'], 'invoice.zip');
    const checked = {BatchId: 'receipt', Status: 1, Items: [{FileName: 'Q1.pdf', ObjectNo: 'Q1'}]};
    const committed = {...checked, Status: 2, Items: [{...checked.Items[0], ForwardingDocumentId: 42}]};
    serviceSpy.batchDocuments.and.returnValues(of(checked), of(committed));
    serviceSpy.batchStatus.and.returnValue(of(committed));
    component.archive = file;
    component.documentType = 8;
    component.submitArchive('preview');
    component.submitArchive('commit');
    expect(serviceSpy.batchDocuments.calls.allArgs()).toEqual([[file, 8, undefined], [file, 8, 'receipt']]);
    component.archive = undefined;
    component.submitArchive('status');
    expect(serviceSpy.batchStatus).toHaveBeenCalledWith('receipt');
    expect(component.batch.Items[0].ForwardingDocumentId).toBe(42);
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

    expect(serviceSpy.getList).toHaveBeenCalledWith(1, undefined, undefined, undefined, false);
    expect(component.items.length).toBe(2);
    expect(component.items[0].ObjectNo).toBe('TEST001');
    expect(component.isLoaded).toBe(true);
  });

  it('ionViewWillEnter should refresh only when list is marked dirty', () => {
    serviceSpy.getList.and.returnValue(of(mockListResponse([])));
    serviceSpy.consumeListDirty.and.returnValues(false, true);
    component.searchKeyword = 'ABC';
    component.isSelectionMode = true;
    component.selectedIds.add(1);

    fixture.detectChanges();
    serviceSpy.getList.calls.reset();

    component.ionViewWillEnter();
    expect(serviceSpy.getList).not.toHaveBeenCalled();

    component.ionViewWillEnter();
    expect(serviceSpy.consumeListDirty).toHaveBeenCalledTimes(2);
    expect(component.isSelectionMode).toBe(false);
    expect(component.selectedIds.size).toBe(0);
    expect(serviceSpy.getList).toHaveBeenCalledWith(1, 'ABC', undefined, undefined, false);
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
      expect(serviceSpy.getList).toHaveBeenCalledWith(1, 'TEST', undefined, undefined, false);
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
    expect(serviceSpy.getList).toHaveBeenCalledWith(1, undefined, undefined, undefined, false);
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

  it('selectAllVisible should select all visible items', () => {
    component.items = [
      mockItem({ Id: 1, StatusCode: 0 }),
      mockItem({ Id: 2, StatusCode: 1 }),
      mockItem({ Id: 3, StatusCode: 0 }),
    ];

    component.selectAllVisible();

    expect(component.items[0].Selected).toBe(true);
    expect(component.items[1].Selected).toBe(true);
    expect(component.items[2].Selected).toBe(true);
    expect(component.selectedIds.has(1)).toBe(true);
    expect(component.selectedIds.has(2)).toBe(true);
    expect(component.selectedIds.has(3)).toBe(true);
  });

  it('clearSelection should clear selected item flags and ids', () => {
    component.items = [mockItem({ Id: 1, Selected: true })];
    component.selectedIds.add(1);

    component.clearSelection();

    expect(component.items[0].Selected).toBe(false);
    expect(component.selectedIds.size).toBe(0);
  });

  it('viewDetail should navigate to detail when selection mode is off', () => {
    const navigateSpy = spyOn(router, 'navigate');

    component.viewDetail(mockItem({ Id: 9 }));

    expect(navigateSpy).toHaveBeenCalledWith(['/member/import-manifest/detail', 9]);
  });

  it('viewDetail should toggle item selection when selection mode is on', () => {
    const item = mockItem({ Id: 9 });
    const navigateSpy = spyOn(router, 'navigate');
    component.isSelectionMode = true;

    component.viewDetail(item);

    expect(navigateSpy).not.toHaveBeenCalled();
    expect(item.Selected).toBe(true);
    expect(component.selectedIds.has(9)).toBe(true);
  });

  it('createNew and goToImport should navigate to their pages', () => {
    const navigateSpy = spyOn(router, 'navigate');

    component.createNew();
    component.goToImport();

    expect(navigateSpy).toHaveBeenCalledWith(['/member/import-manifest/form']);
    expect(navigateSpy).toHaveBeenCalledWith(['/member/import-manifest/import']);
  });

  it('loadNextPage should request next page with current keyword and complete event', () => {
    serviceSpy.getList.and.returnValue(of(mockListResponse([mockItem({ Id: 2 })], 11)));
    component.searchKeyword = 'ABC';
    component.currentPageIndex = 2;
    const event = { target: { complete: jasmine.createSpy('complete') } };

    component.loadNextPage(event);

    expect(serviceSpy.getList).toHaveBeenCalledWith(2, 'ABC', undefined, undefined, false);
    expect(event.target.complete).toHaveBeenCalled();
  });

  it('refreshItems should reload first page and complete refresher', fakeAsync(() => {
    serviceSpy.getList.and.returnValue(of(mockListResponse([])));
    component.searchKeyword = 'ABC';
    const event = { target: { complete: jasmine.createSpy('complete') } };

    component.refreshItems(event);
    tick(500);

    expect(serviceSpy.getList).toHaveBeenCalledWith(1, 'ABC', undefined, undefined, false);
    expect(event.target.complete).toHaveBeenCalled();
  }));

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

  it('deleteItem should present confirm alert and delete after confirmation', async () => {
    const item = mockItem({ Id: 10 });
    component.items = [item];
    serviceSpy.delete.and.returnValue(of({ Success: true, ErrMsg: '' }));
    const alert = { present: jasmine.createSpy('present') };
    spyOn(alertCtrl, 'create').and.callFake(async (options: any) => {
      const destructive = options.buttons.find((button: any) => button.role === 'destructive');
      destructive.handler();
      return alert as any;
    });

    await component.deleteItem(item);

    expect(alertCtrl.create).toHaveBeenCalledWith(jasmine.objectContaining({ header: '确认删除' }));
    expect(alert.present).toHaveBeenCalled();
    expect(serviceSpy.delete).toHaveBeenCalledWith(10);
    expect(component.items.length).toBe(0);
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

  it('confirmBulkDelete should do nothing when no item is selected', async () => {
    const createSpy = spyOn(alertCtrl, 'create');

    await component.confirmBulkDelete();

    expect(createSpy).not.toHaveBeenCalled();
  });

  it('confirmBulkDelete should present alert and bulk delete selected items', async () => {
    component.selectedIds.add(1);
    component.selectedIds.add(2);
    serviceSpy.bulkDelete.and.returnValue(of({
      Success: true,
      Message: 'ok',
      DeletedCount: 2,
      SkippedCount: 0,
      SkippedMessages: [],
    }));
    serviceSpy.getList.and.returnValue(of(mockListResponse([])));
    const alert = { present: jasmine.createSpy('present') };
    spyOn(alertCtrl, 'create').and.callFake(async (options: any) => {
      const destructive = options.buttons.find((button: any) => button.role === 'destructive');
      destructive.handler();
      return alert as any;
    });

    await component.confirmBulkDelete();

    expect(serviceSpy.bulkDelete).toHaveBeenCalledWith([1, 2]);
    expect(component.selectedIds.size).toBe(0);
    expect(component.isSelectionMode).toBe(false);
    expect(serviceSpy.getList).toHaveBeenCalledWith(1, undefined, undefined, undefined, false);
  });

  it('performBulkDelete should show skipped message and reload on partial success', () => {
    component.selectedIds.add(1);
    component.selectedIds.add(2);
    spyOn(component as any, 'showAlert');
    serviceSpy.bulkDelete.and.returnValue(of({
      Success: true,
      Message: 'partial',
      DeletedCount: 1,
      SkippedCount: 1,
      SkippedMessages: ['TEST002 已制单，不能删除'],
    }));
    serviceSpy.getList.and.returnValue(of(mockListResponse([])));

    (component as any).performBulkDelete();

    expect((component as any).showAlert).toHaveBeenCalledWith('删除结果', 'partial');
    expect(component.isBatchDeleting).toBe(false);
    expect(serviceSpy.getList).toHaveBeenCalled();
  });

  it('performBulkDelete should show alert and reset deleting flag on error', () => {
    component.selectedIds.add(1);
    spyOn(component as any, 'showAlert');
    serviceSpy.bulkDelete.and.returnValue(throwError(() => new Error('Network error')));

    (component as any).performBulkDelete();

    expect((component as any).showAlert).toHaveBeenCalledWith('错误', '网络错误，请稍后重试');
    expect(component.isBatchDeleting).toBe(false);
  });

  it('performBulkDelete should ignore duplicate requests while deleting', () => {
    component.selectedIds.add(1);
    component.isBatchDeleting = true;

    (component as any).performBulkDelete();

    expect(serviceSpy.bulkDelete).not.toHaveBeenCalled();
  });

  // ── 17. ngOnDestroy cleans up ──
  it('ngOnDestroy should clear timeout and unsubscribe', () => {
    (component as any).searchDebounceTimer = setTimeout(() => {}, 1000);
    spyOn(window, 'clearTimeout').and.callThrough();

    component.ngOnDestroy();

    expect(clearTimeout).toHaveBeenCalled();
  });
});
