import { TestBed } from '@angular/core/testing';
import { ImportManifestDomainService } from './import-manifest-domain.service';
import { AttachmentTypeOption, DropdownOption, ForwardingDocumentItem, ImportPreviewRow } from '../interfaces/import-manifest';

describe('ImportManifestDomainService', () => {
  let service: ImportManifestDomainService;

  const countries: DropdownOption[] = [
    { Id: 1, Code: 'US', Name: '美国' },
    { Id: 2, Code: 'GB', Name: '英国' },
  ];

  const prices: DropdownOption[] = [
    { Id: 1, Code: 'P01', Name: '报价一' },
    { Id: 2, Code: 'P02', Name: '报价二' },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImportManifestDomainService);
  });

  it('normalizes and validates object no', () => {
    expect(service.normalizeObjectNo(' ab-12 ')).toBe('AB-12');
    expect(service.validateObjectNo('AB-12').ok).toBe(true);
    expect(service.validateObjectNo('测试').ok).toBe(false);
  });

  it('normalizes customer express numbers with de-duplication', () => {
    const result = service.normalizeCustomerExpressNo(' SF1；sf1, SF2 ');
    expect(result.ok).toBe(true);
    expect(result.value).toBe('SF1,SF2');
  });

  it('rejects overlong customer express item', () => {
    const result = service.normalizeCustomerExpressNo('A'.repeat(33));
    expect(result.ok).toBe(false);
    expect(result.error).toContain('32');
  });

  it('maps status names and colors', () => {
    expect(service.getStatusColor(0)).toBe('warning');
    expect(service.getStatusColor(1)).toBe('success');
    expect(service.getCustomerStatusName('已交货')).toBe('已交货');
    expect(service.getCustomerStatusNameByCode(0)).toBe('待交货');
    expect(service.getCustomerStatusNameByCode(1)).toBe('已交货');
    expect(service.canDelete(0)).toBe(true);
    expect(service.canDelete(1)).toBe(false);
  });

  it('validates attachment rules for printed and archive files', () => {
    const types: AttachmentTypeOption[] = [
      { id: 58, name: '报关资料', isPrint: true },
      { id: 9, name: '其他资料', isPrint: false },
    ];
    const attachments: ForwardingDocumentItem[] = [];
    const pdf = new File(['x'], 'a.pdf');
    const zip = new File(['x'], 'a.zip');

    expect(service.validateAttachment(pdf, 58, types, attachments).ok).toBe(true);
    expect(service.validateAttachment(zip, 58, types, attachments).ok).toBe(false);
    expect(service.validateAttachment(zip, 9, types, attachments).ok).toBe(true);
  });

  it('syncs customs declaration from customs attachment', () => {
    const docs: ForwardingDocumentItem[] = [
      { fileName: 'customs.pdf', attachmentTypeId: 58, attachmentTypeName: '报关资料' },
    ];
    const state = service.resolveCustomsState(docs, false, true);
    expect(state.requiresSeparateCustomsDeclaration).toBe(true);
    expect(state.requiresSpecialVatInvoice).toBe(true);
    expect(state.showSpecialVat).toBe(true);

    const emptyState = service.resolveCustomsState([], true, true);
    expect(emptyState.requiresSeparateCustomsDeclaration).toBe(false);
    expect(emptyState.requiresSpecialVatInvoice).toBe(false);
  });

  it('validates import row and detects duplicate object no', () => {
    const rows: Partial<ImportPreviewRow>[] = [
      { ObjectNo: 'DUP001' },
      { ObjectNo: 'DUP001' },
    ];
    const result = service.validateImportRow({
      ObjectNo: 'dup001',
      CountryId: 1,
      CustomerPriceCode: 'P01',
      Piece: 1,
      ContentType: 1,
    }, countries, prices, 0, rows);

    expect(result.row.ObjectNo).toBe('DUP001');
    expect(result.row.HasError).toBe(true);
    expect(result.errors.some((e) => e.Code === 'DUPLICATE_IN_FILE')).toBe(true);
  });

  it('maps valid import row to save model', () => {
    const result = service.validateImportRow({
      ObjectNo: 'OK001',
      CountryId: 1,
      CustomerPriceCode: 'P01',
      Piece: 2,
      ContentType: 0,
      CustomerExpressNo: 'SF1;SF2',
      DeclaredValue: 12.5,
    }, countries, prices, 0, []);

    const model = service.toImportRowModel(result.row);
    expect(model.ObjectNo).toBe('OK001');
    expect(model.CustomerExpressNo).toBe('SF1,SF2');
    expect(model.DeclaredValue).toBe(12.5);
  });

  it('aligns import row customs and piece rules with backend save validation', () => {
    const result = service.validateImportRow({
      ObjectNo: 'OK002',
      CountryId: 1,
      CustomerPriceCode: 'P01',
      Piece: 10000,
      Weight: 1,
      ContentType: 1,
      RequiresSeparateCustomsDeclaration: false,
      RequiresSpecialVatInvoice: true,
    }, countries, prices, 0, []);

    expect(result.row.HasError).toBe(false);
    expect(result.row.RequiresSeparateCustomsDeclaration).toBe(true);
    expect(result.row.RequiresSpecialVatInvoice).toBe(true);
  });

  it('validates import row battery model against backend options', () => {
    const result = service.validateImportRow({
      ObjectNo: 'OK003',
      CountryId: 1,
      CustomerPriceCode: 'P01',
      Piece: 1,
      ContentType: 1,
      BatteryModel: 'BAD',
    }, countries, prices, 0, [], [{ Value: 'PI966', Text: 'PI966 锂离子电池与设备分开包装' }]);

    expect(result.row.HasError).toBe(true);
    expect(result.errors.some((e) => e.Code === 'BATTERY_MODEL_INVALID')).toBe(true);
  });
});
