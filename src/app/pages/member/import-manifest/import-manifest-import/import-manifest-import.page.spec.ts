import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, NavController, ToastController } from '@ionic/angular';
import { of, throwError } from 'rxjs';

import { ImportManifestImportPage } from './import-manifest-import.page';
import { ImportManifestService } from 'src/app/providers/import-manifest.service';
import { ImportManifestDomainService } from 'src/app/providers/import-manifest-domain.service';
import { DropdownOption, ImportPreviewRow } from 'src/app/interfaces/import-manifest';

describe('ImportManifestImportPage', () => {
  let component: ImportManifestImportPage;
  let fixture: ComponentFixture<ImportManifestImportPage>;
  let serviceSpy: jasmine.SpyObj<ImportManifestService>;
  let alertCtrlSpy: jasmine.SpyObj<AlertController>;
  let navCtrlSpy: jasmine.SpyObj<NavController>;
  let toastCtrlSpy: jasmine.SpyObj<ToastController>;

  const countryOptions: DropdownOption[] = [
    { Id: 1, Code: 'US', Name: '美国' },
    { Id: 2, Code: 'GB', Name: '英国' },
  ];

  const priceOptions: DropdownOption[] = [
    { Id: 1, Code: 'PRICE01', Name: '报价一' },
    { Id: 2, Code: 'PRICE02', Name: '报价二' },
  ];

  const mockRow = (overrides?: Partial<ImportPreviewRow>): ImportPreviewRow => ({
    RowIndex: 1,
    ObjectNo: 'TEST001',
    CountryName: '美国',
    CountryId: 1,
    CustomerPriceName: 'PRICE01',
    Piece: 1,
    ContentType: 1,
    ContentTypeName: '包裹',
    PostalCode: '90001',
    CustomerExpressNo: '',
    DeclaredValue: 100,
    RequiresSeparateCustomsDeclaration: false,
    RequiresDutiesAndTaxesPrepayment: false,
    RequiresSpecialVatInvoice: false,
    BatteryModel: '',
    Errors: [],
    HasError: false,
    ...overrides,
  });

  const createFile = (name: string, content = 'ObjectNo,Country'): File =>
    new File([content], name, { type: 'text/csv' });

  beforeEach(() => {
    const sSpy = jasmine.createSpyObj('ImportManifestService', [
      'getCountryOptions',
      'getCustomerPriceOptions',
      'getBatteryModelOptions',
      'parseImport',
      'downloadTemplate',
      'saveImport',
      'validateImportRows',
      'markListDirty',
    ]);
    const aSpy = jasmine.createSpyObj('AlertController', ['create']);
    const nSpy = jasmine.createSpyObj('NavController', ['navigateBack']);
    const tSpy = jasmine.createSpyObj('ToastController', ['create']);

    TestBed.configureTestingModule({
      imports: [FormsModule, IonicModule.forRoot()],
      declarations: [ImportManifestImportPage],
      providers: [
        ImportManifestDomainService,
        { provide: ImportManifestService, useValue: sSpy },
        { provide: AlertController, useValue: aSpy },
        { provide: NavController, useValue: nSpy },
        { provide: ToastController, useValue: tSpy },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    serviceSpy = TestBed.inject(ImportManifestService) as jasmine.SpyObj<ImportManifestService>;
    alertCtrlSpy = TestBed.inject(AlertController) as jasmine.SpyObj<AlertController>;
    navCtrlSpy = TestBed.inject(NavController) as jasmine.SpyObj<NavController>;
    toastCtrlSpy = TestBed.inject(ToastController) as jasmine.SpyObj<ToastController>;

    serviceSpy.getCountryOptions.and.returnValue(of(countryOptions));
    serviceSpy.getCustomerPriceOptions.and.returnValue(of(priceOptions));
    serviceSpy.getBatteryModelOptions.and.returnValue(of([{ Value: 'BAT01', Text: '电池型号一' }]));
    serviceSpy.parseImport.and.returnValue(of({
      Success: true,
      ErrorType: '',
      Message: '解析成功',
      Summary: { TotalRows: 1, ValidRows: 1, ErrorRows: 0 },
      Rows: [mockRow()],
    }));
    serviceSpy.saveImport.and.returnValue(of({ Success: true, ErrMsg: '' }));
    serviceSpy.validateImportRows.and.callFake((rows: any[]) => of({
      Success: true,
      ErrorType: 'NONE',
      Message: '校验通过',
      Summary: { TotalRows: rows.length, ValidRows: rows.length, ErrorRows: 0 },
      Rows: rows.map((r, index) => ({
        RowIndex: r.RowIndex ?? index,
        ObjectNo: (r.ObjectNo || '').trim().toUpperCase(),
        CountryName: r.CountryId === 2 ? '英国' : '美国',
        CountryId: r.CountryId,
        CustomerPriceName: (r.CustomerPriceName || '').trim().toUpperCase(),
        Piece: r.Piece,
        ContentType: r.ContentType,
        ContentTypeName: r.ContentType === 1 ? '包裹' : '文件',
        PostalCode: r.PostalCode || '',
        CustomerExpressNo: r.CustomerExpressNo || '',
        DeclaredValue: r.DeclaredValue,
        RequiresSeparateCustomsDeclaration: !!r.RequiresSeparateCustomsDeclaration,
        RequiresDutiesAndTaxesPrepayment: !!r.RequiresDutiesAndTaxesPrepayment,
        RequiresSpecialVatInvoice: !!r.RequiresSpecialVatInvoice,
        BatteryModel: r.BatteryModel || '',
        Errors: [],
        HasError: false,
      })),
      RowErrors: [],
    }));
    serviceSpy.downloadTemplate.and.returnValue(of(new Blob(['template'])));
    alertCtrlSpy.create.and.returnValue(Promise.resolve({ present: jasmine.createSpy('present') } as any));
    toastCtrlSpy.create.and.returnValue(Promise.resolve({ present: jasmine.createSpy('present') } as any));

    fixture = TestBed.createComponent(ImportManifestImportPage);
    component = fixture.componentInstance;
  });

  it('should create and load reference data on init', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(component.countryOptions).toEqual(countryOptions);
    expect(component.priceOptions).toEqual(priceOptions);
    expect(component.batteryModelOptions.length).toBe(1);
    expect(component.isReferenceLoading).toBe(false);
  });

  it('loadReferenceData should show alert when options fail to load', () => {
    serviceSpy.getCountryOptions.and.returnValue(throwError(() => new Error('Network error')));

    component.loadReferenceData();

    expect(component.isReferenceLoading).toBe(false);
    expect(alertCtrlSpy.create).toHaveBeenCalledWith(jasmine.objectContaining({ header: '加载失败' }));
  });

  it('onFileSelected should reject unsupported file types', () => {
    fixture.detectChanges();
    const input = { files: [createFile('bad.txt')], value: 'bad.txt' };

    component.onFileSelected({ target: input } as any);

    expect(component.selectedFile).toBeNull();
    expect(input.value).toBe('');
    expect(serviceSpy.parseImport).not.toHaveBeenCalled();
    expect(alertCtrlSpy.create).toHaveBeenCalledWith(jasmine.objectContaining({ header: '文件格式错误' }));
  });

  it('onFileSelected should parse supported files and move to preview step', () => {
    fixture.detectChanges();
    const file = createFile('manifest.csv');

    component.onFileSelected({ target: { files: [file], value: file.name } } as any);

    expect(component.selectedFile).toBe(file);
    expect(component.selectedFileName).toBe('manifest.csv');
    expect(serviceSpy.parseImport).toHaveBeenCalled();
    expect(component.previewRows.length).toBe(1);
    expect(component.filteredRows.length).toBe(1);
    expect(component.currentStep).toBe(2);
    expect(component.summary.validRows).toBe(1);
    expect(component.activeFilter).toBe('valid');
  });

  it('onFileSelected should default to actionable view when parsed rows contain errors', () => {
    fixture.detectChanges();
    serviceSpy.parseImport.and.returnValue(of({
      Success: true,
      ErrorType: '',
      Message: '解析成功',
      Summary: { TotalRows: 2, ValidRows: 1, ErrorRows: 1 },
      Rows: [
        mockRow(),
        mockRow({
          RowIndex: 2,
          ObjectNo: '',
          HasError: true,
          Errors: [{ Code: 'OBJECT_NO_REQUIRED', Message: '单号不能为空' }],
        }),
      ],
    }));

    component.onFileSelected({ target: { files: [createFile('manifest.csv')], value: 'manifest.csv' } } as any);

    expect(component.currentStep).toBe(2);
    expect(component.activeFilter).toBe('actionable');
    expect(component.filteredRows.length).toBe(1);
    expect(component.filteredRows[0].HasError).toBe(true);
  });

  it('parseFile should expose service parse errors', () => {
    serviceSpy.parseImport.and.returnValue(of({
      Success: false,
      ErrorType: 'ParseError',
      Message: '模板格式错误',
      Summary: { TotalRows: 0, ValidRows: 0, ErrorRows: 0 },
      Rows: [],
    }));
    component.selectedFile = createFile('manifest.xlsx');

    component.parseFile();

    expect(component.parseError).toBe('模板格式错误');
    expect(component.currentStep).toBe(1);
  });

  it('applyFilter should filter error and modified rows', () => {
    const errorRow = mockRow({
      RowIndex: 2,
      ObjectNo: '',
      HasError: true,
      Errors: [{ Code: 'OBJECT_NO_REQUIRED', Message: '单号不能为空' }],
    });
    component.previewRows = [mockRow(), { ...errorRow, IsDirty: true } as any];

    component.applyFilter('actionable');
    expect(component.filteredRows.length).toBe(1);
    expect(component.filteredRows[0].HasError).toBe(true);

    component.applyFilter('valid');
    expect(component.filteredRows.length).toBe(1);
    expect(component.filteredRows[0].HasError).toBe(false);

    component.applyFilter('modified');
    expect(component.filteredRows.length).toBe(1);
    expect(component.filteredRows[0].IsDirty).toBe(true);
  });

  it('applyErrorCategory should filter rows by error category', () => {
    component.previewRows = [
      mockRow({ RowIndex: 1, HasError: true, Errors: [{ Code: 'PRICE_INVALID', Message: '报价代码无效' }] }),
      mockRow({ RowIndex: 2, HasError: true, Errors: [{ Code: 'COUNTRY_INVALID', Message: '请选择有效目的国' }] }),
    ] as any;
    (component as any).recalculateSummary();

    component.applyErrorCategory({ key: 'price', firstIndex: 0 });

    expect(component.activeFilter).toBe('actionable');
    expect(component.activeErrorCategory).toBe('price');
    expect(component.filteredRows.length).toBe(1);
    expect(component.filteredRows[0].Errors[0].Message).toContain('报价');
  });

  it('saveRowEdit should validate edited row and update summary', () => {
    fixture.detectChanges();
    const row = mockRow({ ObjectNo: 'old001' }) as any;
    component.previewRows = [row];
    component.startEdit(row);
    row.EditModel.ObjectNo = 'new001';
    row.EditModel.Piece = 2;

    expect(component.editingRow).toBe(row);

    component.saveRowEdit(row);

    expect(row.IsEditing).toBe(false);
    expect(row.IsDirty).toBe(true);
    expect(component.editingRow).toBeNull();
    expect(row.ObjectNo).toBe('NEW001');
    expect(row.Piece).toBe(2);
    expect(component.summary.modifiedRows).toBe(1);
  });

  it('selectRows and clearSelection should manage selected rows', () => {
    component.previewRows = [
      mockRow(),
      mockRow({ RowIndex: 2, HasError: true, Errors: [{ Code: 'PRICE_INVALID', Message: '报价无效' }] }),
    ] as any;
    component.applyFilter('all');

    component.selectRows('errors');
    expect(component.getSelectedCount()).toBe(1);
    expect(component.previewRows[1].Selected).toBe(true);

    component.clearSelection();
    expect(component.getSelectedCount()).toBe(0);
  });

  it('openBatchPanel should require selected rows', () => {
    component.previewRows = [mockRow()] as any;

    component.openBatchPanel('country');

    expect(component.batchMode).toBeNull();
    expect(component.isBatchSheetOpen).toBe(false);
    expect(toastCtrlSpy.create).toHaveBeenCalledWith(jasmine.objectContaining({ message: '请先选择要批量修改的行' }));
  });

  it('applyBatchSet should update selected rows and revalidate them', () => {
    fixture.detectChanges();
    component.previewRows = [{ ...mockRow(), Selected: true } as any];
    component.openBatchSheet();
    component.batchCountryId = 2;

    expect(component.isBatchSheetOpen).toBe(true);

    component.applyBatchSet();

    expect(component.previewRows[0].CountryId).toBe(2);
    expect(component.previewRows[0].CountryName).toBe('英国');
    expect(component.previewRows[0].IsDirty).toBe(true);
    expect(component.batchMode).toBeNull();
    expect(component.isBatchSheetOpen).toBe(false);
  });

  it('getConfirmButtonText should explain disabled and busy states', () => {
    component.previewRows = [mockRow()] as any;
    (component as any).recalculateSummary();
    expect(component.getConfirmButtonText()).toBe('确认导入 1 条');

    component.isValidatingRows = true;
    expect(component.getConfirmButtonText()).toBe('正在校验');

    component.isValidatingRows = false;
    component.isSaving = true;
    expect(component.getConfirmButtonText()).toBe('正在导入');

    component.isSaving = false;
    (component.previewRows[0] as any).IsEditing = true;
    expect(component.getConfirmButtonText()).toBe('请先保存编辑');
  });

  it('confirmImport should save valid rows only and show result step', () => {
    const validRow = mockRow();
    const errorRow = mockRow({
      RowIndex: 2,
      ObjectNo: '',
      HasError: true,
      Errors: [{ Code: 'OBJECT_NO_REQUIRED', Message: '单号不能为空' }],
    });
    component.previewRows = [validRow, errorRow] as any;

    component.confirmImport();

    expect(serviceSpy.saveImport).toHaveBeenCalledWith([
      jasmine.objectContaining({ ObjectNo: 'TEST001', CountryId: 1 }),
    ]);
    expect(component.currentStep).toBe(3);
    expect(component.saveResult).toEqual(jasmine.objectContaining({ success: true, count: 1 }));
    expect(serviceSpy.markListDirty).toHaveBeenCalled();
  });

  it('confirmImport should apply server row errors and stay on preview step', () => {
    component.currentStep = 2;
    component.previewRows = [mockRow()] as any;
    serviceSpy.saveImport.and.returnValue(of({
      Success: false,
      ErrorType: 'VALIDATION',
      Message: '数据校验未通过',
      Summary: { TotalRows: 1, ValidRows: 0, ErrorRows: 1 },
      Rows: [{
        ...mockRow(),
        Errors: [{ Code: 'DUPLICATE_IN_SYSTEM', Message: '该单号已在系统中存在' }],
        HasError: true,
      }],
      RowErrors: [{
        RowIndex: 1,
        ObjectNo: 'TEST001',
        Errors: [{ Code: 'DUPLICATE_IN_SYSTEM', Message: '该单号已在系统中存在' }],
      }],
    }));

    component.confirmImport();

    expect(component.currentStep).toBe(2);
    expect(component.previewRows[0].HasError).toBe(true);
    expect(component.summary.errorRows).toBe(1);
    expect(component.filteredRows.length).toBe(1);
    expect(component.filteredRows[0].Errors[0].Code).toBe('DUPLICATE_IN_SYSTEM');
  });

  it('confirmImport should block while rows are editing', () => {
    component.previewRows = [mockRow({} as any)] as any;
    (component.previewRows[0] as any).IsEditing = true;

    component.confirmImport();

    expect(serviceSpy.saveImport).not.toHaveBeenCalled();
    expect(alertCtrlSpy.create).toHaveBeenCalledWith(jasmine.objectContaining({ header: '仍有行正在编辑' }));
  });

  it('confirmImport should show alert when save fails', () => {
    component.previewRows = [mockRow()] as any;
    serviceSpy.saveImport.and.returnValue(throwError(() => new Error('Network error')));

    component.confirmImport();

    expect(component.isSaving).toBe(false);
    expect(alertCtrlSpy.create).toHaveBeenCalledWith(jasmine.objectContaining({ header: '导入失败' }));
  });

  it('resetImport should clear import state', () => {
    component.currentStep = 3;
    component.selectedFile = createFile('manifest.csv');
    component.selectedFileName = 'manifest.csv';
    component.previewRows = [mockRow()] as any;
    component.filteredRows = [mockRow()] as any;
    component.parseError = 'error';
    component.saveResult = { success: true, message: 'ok', count: 1 };
    component.batchMode = 'price';

    component.resetImport();

    expect(component.currentStep).toBe(1);
    expect(component.selectedFile).toBeNull();
    expect(component.previewRows.length).toBe(0);
    expect(component.summary.totalRows).toBe(0);
  });

  it('backToList should navigate back to list page', () => {
    component.backToList();

    expect(navCtrlSpy.navigateBack).toHaveBeenCalledWith('/member/import-manifest/list');
  });
});
