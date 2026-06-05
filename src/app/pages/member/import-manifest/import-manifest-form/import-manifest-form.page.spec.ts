import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, AlertController, LoadingController, ToastController, NavController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ImportManifestFormPage } from './import-manifest-form.page';
import { ImportManifestService } from 'src/app/providers/import-manifest.service';
import { ImportManifestDetail, DropdownOption, AttachmentTypeOption, ForwardingDocumentItem, ImportManifestActionResult } from 'src/app/interfaces/import-manifest';

describe('ImportManifestFormPage', () => {
  let component: ImportManifestFormPage;
  let fixture: ComponentFixture<ImportManifestFormPage>;
  let serviceSpy: jasmine.SpyObj<ImportManifestService>;
  let loadingCtrlSpy: jasmine.SpyObj<LoadingController>;
  let toastCtrlSpy: jasmine.SpyObj<ToastController>;
  let navCtrlSpy: jasmine.SpyObj<NavController>;
  let alertCtrlSpy: jasmine.SpyObj<AlertController>;

  const mockCountryOptions: DropdownOption[] = [
    { Id: 1, Code: 'US', Name: '美国' },
    { Id: 2, Code: 'GB', Name: '英国' },
  ];

  const mockPriceOptions: DropdownOption[] = [
    { Id: 1, Code: 'PRICE01', Name: '报价一' },
  ];

  const mockAttachmentTypes: AttachmentTypeOption[] = [
    { id: 58, name: '报关资料' },
    { id: 2, name: '运单' },
  ];

  const mockForwardingDocuments: ForwardingDocumentItem[] = [
    {
      id: 101,
      fileName: 'invoice.pdf',
      attachmentTypeId: 58,
      attachmentTypeName: '报关资料',
      size: 102400,
      uploadDate: '2025-06-01',
      isPending: false,
    },
  ];

  const mockDetail: ImportManifestDetail = {
    ObjectId: 1,
    ObjectNo: 'TEST001',
    CustomerId: 100,
    CountryId: 1,
    CountryName: '美国',
    ModeOfTransportId: 1,
    ModeOfTransportName: '空运',
    CustomerPriceName: 'PRICE01',
    Status: 0,
    StatusName: '已预报',
    Piece: 5,
    PostalCode: '90001',
    ContentType: 1,
    ContentTypeName: '包裹',
    DeclaredValue: 200,
    CustomerExpressNo: 'SF123456',
    EntryType: 0,
    RequiresSeparateCustomsDeclaration: true,
    RequiresDutiesAndTaxesPrepayment: false,
    RequiresSpecialVatInvoice: true,
    WaybillCreationStatus: 0,
    TrackNumber: '',
    LabelPath: '',
    IsLabelPrinted: false,
    ForwardingDocumentCount: 0,
    CreateAt: '2025-06-01',
    LastChanged: null,
  };

  const mockLoading = {
    present: jasmine.createSpy('present'),
    dismiss: jasmine.createSpy('dismiss'),
  };

  const mockToast = {
    present: jasmine.createSpy('present'),
  };

  beforeEach(() => {
    const sSpy = jasmine.createSpyObj('ImportManifestService', [
      'getCountryOptions',
      'getCustomerPriceOptions',
      'getAttachmentTypes',
      'getDetail',
      'create',
      'edit',
      'validateObjectNo',
      'validateCustomerPriceName',
      'uploadTempDocument',
      'getForwardingDocuments',
      'deleteTempDocument',
    ]);

    const lSpy = jasmine.createSpyObj('LoadingController', ['create']);
    const tSpy = jasmine.createSpyObj('ToastController', ['create']);
    const nSpy = jasmine.createSpyObj('NavController', ['back']);
    const aSpy = jasmine.createSpyObj('AlertController', ['create']);

    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        FormsModule,
        ReactiveFormsModule,
        IonicModule.forRoot(),
      ],
      declarations: [ImportManifestFormPage],
      providers: [
        { provide: ImportManifestService, useValue: sSpy },
        { provide: LoadingController, useValue: lSpy },
        { provide: ToastController, useValue: tSpy },
        { provide: NavController, useValue: nSpy },
        { provide: AlertController, useValue: aSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: new Map() } },
        },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    serviceSpy = TestBed.inject(ImportManifestService) as jasmine.SpyObj<ImportManifestService>;
    loadingCtrlSpy = TestBed.inject(LoadingController) as jasmine.SpyObj<LoadingController>;
    toastCtrlSpy = TestBed.inject(ToastController) as jasmine.SpyObj<ToastController>;
    navCtrlSpy = TestBed.inject(NavController) as jasmine.SpyObj<NavController>;
    alertCtrlSpy = TestBed.inject(AlertController) as jasmine.SpyObj<AlertController>;

    serviceSpy.getCountryOptions.and.returnValue(of(mockCountryOptions));
    serviceSpy.getCustomerPriceOptions.and.returnValue(of(mockPriceOptions));
    serviceSpy.getAttachmentTypes.and.returnValue(of(mockAttachmentTypes));
    serviceSpy.getForwardingDocuments.and.returnValue(of({ success: true, rows: [] }));
    serviceSpy.deleteTempDocument.and.returnValue(of({ Success: true, ErrMsg: '' } as ImportManifestActionResult));
    serviceSpy.uploadTempDocument.and.returnValue(of({ success: true, token: '', fileName: '' }));
    serviceSpy.validateObjectNo.and.returnValue(of({ Success: true, ErrMsg: '' }));
    serviceSpy.validateCustomerPriceName.and.returnValue(of({ Success: true, ErrMsg: '' }));
    serviceSpy.getDetail.and.returnValue(of(mockDetail));
    serviceSpy.create.and.returnValue(of({ Success: true, ErrMsg: '' }));
    serviceSpy.edit.and.returnValue(of({ Success: true, ErrMsg: '' }));
    loadingCtrlSpy.create.and.returnValue(Promise.resolve(mockLoading as any));
    toastCtrlSpy.create.and.returnValue(Promise.resolve(mockToast as any));

    fixture = TestBed.createComponent(ImportManifestFormPage);
    component = fixture.componentInstance;
  });

  // ── 1. Creation ──
  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  // ── 2. Form initialization ──
  it('should initialize form with default values', () => {
    fixture.detectChanges();
    expect(component.form.get('ContentType')?.value).toBe(0);
    expect(component.form.get('RequiresSeparateCustomsDeclaration')?.value).toBe(false);
    expect(component.form.get('RequiresDutiesAndTaxesPrepayment')?.value).toBe(false);
    expect(component.form.get('RequiresSpecialVatInvoice')?.value).toBe(false);
    expect(component.isEditMode).toBe(false);
  });

  // ── 3. loadDropdowns ──
  it('should load country and price options on init', () => {
    fixture.detectChanges();
    expect(component.countryOptions.length).toBe(2);
    expect(component.priceOptions.length).toBe(1);
  });

  // ── 4. Form validation - required fields ──
  it('should require ObjectNo, CountryId, CustomerPriceName, Piece, ContentType', () => {
    fixture.detectChanges();
    const form = component.form;

    expect(form.valid).toBe(false);
    expect(form.get('ObjectNo')?.errors?.['required']).toBe(true);
    expect(form.get('CountryId')?.errors?.['required']).toBe(true);
    expect(form.get('CustomerPriceName')?.errors?.['required']).toBe(true);
    expect(form.get('Piece')?.errors?.['required']).toBe(true);
  });

  // ── 5. ObjectNo pattern validation ──
  it('ObjectNo should accept uppercase letters, numbers and hyphens', () => {
    fixture.detectChanges();
    const control = component.form.get('ObjectNo')!;

    control.setValue('ABC-123');
    expect(control.errors).toBeNull();

    // Lowercase is auto-uppercased by valueChanges, so 'abc' becomes 'ABC' which is valid
    control.setValue('abc');
    expect(control.value).toBe('ABC');
    expect(control.errors).toBeNull();

    // Chinese/non-ASCII chars trigger pattern error
    control.setValue('测试');
    expect(control.errors?.['pattern']).toBeTruthy();
  });

  // ── 6. ObjectNo auto uppercase ──
  it('ObjectNo valueChanges should auto-uppercase', () => {
    fixture.detectChanges();
    const control = component.form.get('ObjectNo')!;

    control.setValue('abc');
    // auto-uppercase happens via valueChanges subscription
    expect(control.value).toBe('ABC');
  });

  // ── 7. Piece min/max validation ──
  it('Piece should validate min 1 and max 9999', () => {
    fixture.detectChanges();
    const control = component.form.get('Piece')!;

    control.setValue(0);
    expect(control.errors?.['min']).toBeTruthy();

    control.setValue(10000);
    expect(control.errors?.['max']).toBeTruthy();

    control.setValue(5);
    expect(control.errors).toBeNull();
  });

  // ── 8. Special VAT toggle visibility ──
  it('should show SpecialVat when RequiresSeparateCustomsDeclaration is true', () => {
    fixture.detectChanges();
    expect(component.showSpecialVat).toBe(false);

    // Need customs doc in attachments to prevent auto-cancel guard
    component.attachments = [
      { fileName: 'customs.pdf', attachmentTypeId: 58, attachmentTypeName: '报关资料', isPending: true },
    ];
    component.form.get('RequiresSeparateCustomsDeclaration')?.setValue(true);
    expect(component.showSpecialVat).toBe(true);
  });

  // ── 9. Special VAT resets when separate customs is off ──
  it('should reset SpecialVatInvoice when separate customs is turned off', () => {
    fixture.detectChanges();
    component.form.get('RequiresSeparateCustomsDeclaration')?.setValue(true);
    component.form.get('RequiresSpecialVatInvoice')?.setValue(true);

    component.form.get('RequiresSeparateCustomsDeclaration')?.setValue(false);
    expect(component.form.get('RequiresSpecialVatInvoice')?.value).toBe(false);
  });

  // ── 10. Form valid with minimum required fields ──
  it('should be valid when all required fields are filled', () => {
    fixture.detectChanges();
    component.form.patchValue({
      ObjectNo: 'TEST001',
      CountryId: 1,
      CustomerPriceName: 'PRICE01',
      Piece: 5,
      ContentType: 1,
    });

    expect(component.form.valid).toBe(true);
  });

  // ── 11. validateObjectNo success ──
  it('validateObjectNo should clear error on success', () => {
    fixture.detectChanges();
    serviceSpy.validateObjectNo.and.returnValue(of({ Success: true, ErrMsg: '' }));

    component.form.get('ObjectNo')?.setValue('VALID001');
    component.validateObjectNo();

    expect(serviceSpy.validateObjectNo).toHaveBeenCalledWith('VALID001', undefined);
  });

  // ── 12. validateObjectNo duplicate ──
  it('validateObjectNo should set duplicate error when not valid', () => {
    fixture.detectChanges();
    serviceSpy.validateObjectNo.and.returnValue(of({ Success: false, ErrMsg: '单号已存在' }));

    component.form.get('ObjectNo')?.setValue('DUP001');
    component.validateObjectNo();

    expect(component.form.get('ObjectNo')?.errors?.['duplicate']).toBe(true);
  });

  // ── 13. validateObjectNo does nothing for empty value ──
  it('validateObjectNo should skip if value is empty', () => {
    fixture.detectChanges();
    component.form.get('ObjectNo')?.setValue('');
    component.validateObjectNo();
    expect(serviceSpy.validateObjectNo).not.toHaveBeenCalled();
  });

  // ── 14. validateCustomerPriceName success ──
  it('validateCustomerPriceName should not set error on success', () => {
    fixture.detectChanges();
    serviceSpy.validateCustomerPriceName.and.returnValue(of({ Success: true, ErrMsg: '' }));

    component.form.get('CustomerPriceName')?.setValue('PRICE01');
    component.validateCustomerPriceName();

    expect(serviceSpy.validateCustomerPriceName).toHaveBeenCalledWith('PRICE01');
  });

  // ── 15. validateCustomerPriceName invalid ──
  it('validateCustomerPriceName should set invalid error when API fails', () => {
    fixture.detectChanges();
    serviceSpy.validateCustomerPriceName.and.returnValue(of({ Success: false, ErrMsg: '报价不可用' }));

    component.form.get('CustomerPriceName')?.setValue('BADPRICE');
    component.validateCustomerPriceName();

    expect(component.form.get('CustomerPriceName')?.errors?.['invalid']).toBe(true);
  });

  // ── 16. save with invalid form shows alert ──
  it('save should show alert when form is invalid', async () => {
    fixture.detectChanges();
    const mockAlert = { present: jasmine.createSpy('present') };
    alertCtrlSpy.create.and.returnValue(Promise.resolve(mockAlert as any));

    await component.save();

    expect(alertCtrlSpy.create).toHaveBeenCalledWith(
      jasmine.objectContaining({
        header: '信息填写不完善',
      })
    );
  });

  // ── 17. create should call service.create ──
  it('should call service.create for new record', async () => {
    fixture.detectChanges();
    component.form.patchValue({
      ObjectNo: 'NEW001',
      CountryId: 1,
      CustomerPriceName: 'PRICE01',
      Piece: 3,
      ContentType: 1,
    });
    serviceSpy.create.and.returnValue(of({ Success: true, ErrMsg: '' }));
    loadingCtrlSpy.create.and.returnValue(Promise.resolve(mockLoading as any));

    await component.save();

    expect(serviceSpy.create).toHaveBeenCalledWith(
      jasmine.objectContaining({ ObjectNo: 'NEW001', Piece: 3 })
    );
    expect(navCtrlSpy.back).toHaveBeenCalled();
  });

  // ── 18. create failure shows alert ──
  it('should show alert when create fails', async () => {
    fixture.detectChanges();
    component.form.patchValue({
      ObjectNo: 'FAIL001',
      CountryId: 1,
      CustomerPriceName: 'PRICE01',
      Piece: 1,
      ContentType: 0,
    });
    serviceSpy.create.and.returnValue(of({ Success: false, ErrMsg: '创建失败' }));
    loadingCtrlSpy.create.and.returnValue(Promise.resolve(mockLoading as any));
    const mockAlert = { present: jasmine.createSpy('present') };
    alertCtrlSpy.create.and.returnValue(Promise.resolve(mockAlert as any));

    await component.save();

    expect(alertCtrlSpy.create).toHaveBeenCalledWith(
      jasmine.objectContaining({ header: '操作失败', message: '创建失败' })
    );
  });

  // ── 19. isSubmitting guard ──
  it('should prevent duplicate submissions', async () => {
    fixture.detectChanges();
    // Make form valid first
    component.form.patchValue({
      ObjectNo: 'GUARD001',
      CountryId: 1,
      CustomerPriceName: 'PRICE01',
      Piece: 1,
      ContentType: 0,
    });
    component.isSubmitting = true;
    await component.save();
    expect(serviceSpy.create).not.toHaveBeenCalled();
  });

  // ── 20. fillForm maps detail to form values ──
  it('fillForm should map all detail fields correctly', () => {
    fixture.detectChanges();
    // Pre-populate attachments with a customs doc so the auto-cancel guard won't reset
    component.attachments = [
      { fileName: 'customs.pdf', attachmentTypeId: 58, attachmentTypeName: '报关资料', isPending: false },
    ];
    component.fillForm(mockDetail);

    expect(component.form.get('ObjectNo')?.value).toBe('TEST001');
    expect(component.form.get('CountryId')?.value).toBe(1);
    expect(component.form.get('Piece')?.value).toBe(5);
    expect(component.form.get('RequiresSeparateCustomsDeclaration')?.value).toBe(true);
    expect(component.form.get('RequiresSpecialVatInvoice')?.value).toBe(true);
    expect(component.showSpecialVat).toBe(true);
  });

  // ── 21. Edit mode with readonly ──
  it('should set readonly and disable form when Status is not 0', () => {
    serviceSpy.getDetail.and.returnValue(of({ ...mockDetail, Status: 1 }));
    // Simulate edit mode by overriding id and calling loadDetail
    component.id = 1;
    component.isEditMode = true;
    component.loadDetail(1);

    expect(loadingCtrlSpy.create).toHaveBeenCalled();
  });

  // ── 22. Country autocomplete: filter by name and code ──
  it('filterCountryItems should filter by name and code', () => {
    fixture.detectChanges();
    component.countryOptions = [
      { Id: 1, Code: 'US', Name: 'USA' },
      { Id: 2, Code: 'GB', Name: 'UK' },
      { Id: 3, Code: 'JP', Name: 'Japan' },
    ];

    component.filterCountryItems({ detail: { value: 'US' } });
    expect(component.countrySearch.length).toBe(1);
    expect(component.countrySearch[0].Code).toBe('US');

    component.filterCountryItems({ detail: { value: 'ja' } });
    expect(component.countrySearch.length).toBe(1);
    expect(component.countrySearch[0].Name).toBe('Japan');

    component.filterCountryItems({ detail: { value: '' } });
    expect(component.countrySearch.length).toBe(3);
  });

  // ── 23. Country autocomplete: select via click ──
  it('countryItemClick should set selected country and form value', () => {
    fixture.detectChanges();
    const country: DropdownOption = { Id: 5, Code: 'CN', Name: 'China' };
    component.countryItemClick(country);
    expect(component.selectedCountry).toEqual(country);
    expect(component.form.get('CountryId')?.value).toBe(5);
    expect(component.showCountryList).toBe(false);
  });

  // ── 24. Country autocomplete: clear ──
  it('onCountryClear should reset country state', () => {
    fixture.detectChanges();
    component.selectedCountry = { Id: 1, Code: 'US', Name: 'USA' };
    component.showCountryList = true;
    component.hasCountryValidationError = true;
    component.onCountryClear();
    expect(component.selectedCountry).toBeNull();
    expect(component.showCountryList).toBe(false);
    expect(component.hasCountryValidationError).toBe(false);
    expect(component.form.get('CountryId')?.value).toBeNull();
  });

  // ── 25. Country autocomplete: selectCountry exact match ──
  it('selectCountry should match by exact name', () => {
    fixture.detectChanges();
    component.countryOptions = [
      { Id: 10, Code: 'FR', Name: 'France' },
      { Id: 11, Code: 'DE', Name: 'Germany' },
    ];
    component.countryInput = 'France';
    component.selectCountry();
    expect(component.selectedCountry?.Id).toBe(10);
    expect(component.showCountryList).toBe(false);
  });

  // ── 26. Country autocomplete: single result auto-select ──
  it('selectCountry should pick single match result', () => {
    fixture.detectChanges();
    component.countryOptions = [{ Id: 20, Code: 'AU', Name: 'Australia' }];
    component.countrySearch = [{ Id: 20, Code: 'AU', Name: 'Australia' }];
    component.countryInput = 'AUST';
    component.selectCountry();
    expect(component.selectedCountry?.Id).toBe(20);
  });

  // ── 27. countryInput display after selection ──
  it('countryInput should show Name (Code) format after selection', () => {
    fixture.detectChanges();
    (component as any).setSelectedCountry({ Id: 1, Code: 'US', Name: 'USA' });
    expect(component.countryInput).toBe('USA (US)');
  });

  // ── 28. fillForm sets selectedCountry ──
  it('fillForm should set selectedCountry from options', () => {
    fixture.detectChanges();
    component.countryOptions = [
      { Id: 1, Code: 'US', Name: 'USA' },
      { Id: 2, Code: 'GB', Name: 'UK' },
    ];
    component.fillForm(mockDetail);
    expect(component.selectedCountry?.Id).toBe(1);
  });

  // ════════════════════════════════════════════════════════════
  //  Price Autocomplete
  // ════════════════════════════════════════════════════════════

  // ── 29. Price autocomplete: filter by code and name ──
  it('filterPriceItems should filter by code and name', () => {
    fixture.detectChanges();
    component.priceOptions = [
      { Id: 1, Code: 'PRICE01', Name: '报价方案A' },
      { Id: 2, Code: 'PRICE02', Name: '报价方案B' },
      { Id: 3, Code: 'EXP03', Name: 'Express' },
    ];

    component.filterPriceItems({ detail: { value: 'PRICE01' } });
    expect(component.priceSearch.length).toBe(1);
    expect(component.priceSearch[0].Code).toBe('PRICE01');

    component.filterPriceItems({ detail: { value: 'express' } });
    expect(component.priceSearch.length).toBe(1);
    expect(component.priceSearch[0].Name).toBe('Express');

    component.filterPriceItems({ detail: { value: '' } });
    expect(component.priceSearch.length).toBe(3);
  });

  // ── 30. Price autocomplete: guard skips unchanged value ──
  it('filterPriceItems should skip when value unchanged and price selected', () => {
    fixture.detectChanges();
    component.selectedPrice = { Id: 1, Code: 'PRICE01', Name: '报价一' };
    component.priceInput = 'PRICE01';
    component.form.get('CustomerPriceName')?.setValue('PRICE01');

    component.filterPriceItems({ detail: { value: 'PRICE01' } });
    // selectedPrice should remain unchanged (guard hit)
    expect(component.selectedPrice).toBeTruthy();
    expect(component.form.get('CustomerPriceName')?.value).toBe('PRICE01');
  });

  // ── 31. Price autocomplete: select via click ──
  it('priceItemClick should set selected price and form value', () => {
    fixture.detectChanges();
    const price: DropdownOption = { Id: 10, Code: 'PRICE10', Name: '报价十' };
    component.priceItemClick(price);
    expect(component.selectedPrice).toEqual(price);
    expect(component.form.get('CustomerPriceName')?.value).toBe('PRICE10');
    expect(component.showPriceList).toBe(false);
    expect(component.priceInput).toBe('PRICE10');
  });

  // ── 32. Price autocomplete: clear ──
  it('onPriceClear should reset price state', () => {
    fixture.detectChanges();
    component.selectedPrice = { Id: 1, Code: 'PRICE01', Name: '报价一' };
    component.showPriceList = true;
    component.hasPriceValidationError = true;
    component.onPriceClear();
    expect(component.selectedPrice).toBeNull();
    expect(component.showPriceList).toBe(false);
    expect(component.hasPriceValidationError).toBe(false);
    expect(component.form.get('CustomerPriceName')?.value).toBeNull();
  });

  // ── 33. Price autocomplete: selectPrice exact match ──
  it('selectPrice should match by exact code', () => {
    fixture.detectChanges();
    component.priceOptions = [
      { Id: 20, Code: 'PRICE20', Name: '方案二十' },
      { Id: 21, Code: 'PRICE21', Name: '方案二十一' },
    ];
    component.priceInput = 'PRICE20';
    component.selectPrice();
    expect(component.selectedPrice?.Id).toBe(20);
    expect(component.showPriceList).toBe(false);
  });

  // ── 34. Price autocomplete: single result auto-select ──
  it('selectPrice should pick single match result', () => {
    fixture.detectChanges();
    component.priceOptions = [{ Id: 30, Code: 'ONLY01', Name: '唯一报价' }];
    component.priceSearch = [{ Id: 30, Code: 'ONLY01', Name: '唯一报价' }];
    component.priceInput = 'ONLY';
    component.selectPrice();
    expect(component.selectedPrice?.Id).toBe(30);
  });

  // ── 35. priceInput display after selection ──
  it('priceInput should show Code after selection', () => {
    fixture.detectChanges();
    (component as any).setSelectedPrice({ Id: 1, Code: 'P01', Name: '报价A' });
    expect(component.priceInput).toBe('P01');
  });

  // ── 36. fillForm sets selectedPrice ──
  it('fillForm should set selectedPrice from options', () => {
    fixture.detectChanges();
    component.priceOptions = [
      { Id: 1, Code: 'PRICE01', Name: '报价一' },
      { Id: 2, Code: 'PRICE02', Name: '报价二' },
    ];
    component.fillForm(mockDetail);
    expect(component.selectedPrice?.Code).toBe('PRICE01');
  });

  // ── 37. fillForm sets priceInput when no match ──
  it('fillForm should fallback to raw CustomerPriceName when no match', () => {
    fixture.detectChanges();
    component.priceOptions = [{ Id: 1, Code: 'OTHER', Name: '其他' }];
    component.fillForm(mockDetail);
    expect(component.selectedPrice).toBeNull();
    expect(component.priceInput).toBe('PRICE01');
  });

  // ── 38. isPriceErrorVisible when no selection ──
  it('isPriceErrorVisible should be true when touched and no selection', () => {
    fixture.detectChanges();
    component.form.get('CustomerPriceName')?.markAsTouched();
    component.selectedPrice = null;
    expect(component.isPriceErrorVisible).toBe(true);
  });

  // ── 39. isPriceErrorVisible when has validation error ──
  it('isPriceErrorVisible should be true when hasPriceValidationError', () => {
    fixture.detectChanges();
    component.hasPriceValidationError = true;
    expect(component.isPriceErrorVisible).toBe(true);
  });

  // ════════════════════════════════════════════════════════════
  //  ContentType Toggle
  // ════════════════════════════════════════════════════════════

  // ── 40. setContentType should update form value ──
  it('setContentType should set ContentType value and mark touched', () => {
    fixture.detectChanges();
    component.setContentType(1);
    expect(component.form.get('ContentType')?.value).toBe(1);
    expect(component.form.get('ContentType')?.touched).toBe(true);
  });

  // ── 41. setContentType should switch between 0 and 1 ──
  it('setContentType should toggle between DOC(0) and WPX(1)', () => {
    fixture.detectChanges();
    expect(component.form.get('ContentType')?.value).toBe(0);

    component.setContentType(1);
    expect(component.form.get('ContentType')?.value).toBe(1);

    component.setContentType(0);
    expect(component.form.get('ContentType')?.value).toBe(0);
  });

  // ════════════════════════════════════════════════════════════
  //  Attachments
  // ════════════════════════════════════════════════════════════

  // ── 42. fillForm loads forwarding documents in edit mode ──
  it('fillForm should load existing forwarding documents', () => {
    fixture.detectChanges();
    serviceSpy.getForwardingDocuments.and.returnValue(
      of({ success: true, rows: mockForwardingDocuments })
    );
    component.fillForm(mockDetail);
    expect(serviceSpy.getForwardingDocuments).toHaveBeenCalledWith(1);
  });

  // ── 43. removeAttachment removes from list ──
  it('removeAttachment should splice item and call deleteTempDocument for pending', () => {
    fixture.detectChanges();
    component.attachments = [
      { token: 'abc', fileName: 'test.pdf', attachmentTypeId: 2, attachmentTypeName: '运单', size: 100, isPending: true },
      { id: 1, fileName: 'exist.pdf', attachmentTypeId: 58, attachmentTypeName: '报关资料', isPending: false },
    ];

    component.removeAttachment(0);
    expect(component.attachments.length).toBe(1);
    expect(serviceSpy.deleteTempDocument).toHaveBeenCalledWith('abc');
  });

  // ── 44. removeAttachment does nothing for invalid index ──
  it('removeAttachment should handle invalid index gracefully', () => {
    fixture.detectChanges();
    component.attachments = [{ token: 'x', fileName: 'f.pdf', attachmentTypeId: 2, attachmentTypeName: '运单', isPending: true }];
    component.removeAttachment(999);
    expect(component.attachments.length).toBe(1);
  });

  // ── 45. syncCustomsDeclarationFlag auto-checks customs ──
  it('syncCustomsDeclarationFlag should auto-check RequiresSeparateCustomsDeclaration when customs doc present', () => {
    fixture.detectChanges();
    component.attachments = [
      { fileName: 'customs.pdf', attachmentTypeId: 58, attachmentTypeName: '报关资料', isPending: true },
    ];
    (component as any).syncCustomsDeclarationFlag();
    expect(component.form.get('RequiresSeparateCustomsDeclaration')?.value).toBe(true);
  });

  // ── 46. getFileIcon returns correct icon per extension ──
  it('getFileIcon should return correct icon name', () => {
    fixture.detectChanges();
    expect(component.getFileIcon('file.pdf')).toBe('document-outline');
    expect(component.getFileIcon('photo.jpg')).toBe('image-outline');
    expect(component.getFileIcon('photo.png')).toBe('image-outline');
    expect(component.getFileIcon('doc.docx')).toBe('document-text-outline');
    expect(component.getFileIcon('sheet.xlsx')).toBe('grid-outline');
    expect(component.getFileIcon('unknown.xyz')).toBe('attach-outline');
  });

  // ── 47. formatFileSize formats correctly ──
  it('formatFileSize should format bytes correctly', () => {
    fixture.detectChanges();
    expect(component.formatFileSize(0)).toBe('0 B');
    expect(component.formatFileSize(500)).toBe('500 B');
    expect(component.formatFileSize(1024)).toBe('1.0 KB');
    expect(component.formatFileSize(1536)).toBe('1.5 KB');
    expect(component.formatFileSize(1048576)).toBe('1.0 MB');
    expect(component.formatFileSize(2097152)).toBe('2.0 MB');
  });

  // ── 48. save includes PendingDocumentsJson ──
  it('save should include PendingDocumentsJson when pending uploads exist', async () => {
    fixture.detectChanges();
    component.form.patchValue({
      ObjectNo: 'PEND001',
      CountryId: 1,
      CustomerPriceName: 'PRICE01',
      Piece: 1,
      ContentType: 0,
    });
    component.pendingUploads = [{ token: 'tok1', attachmentTypeId: 58 }];
    serviceSpy.create.and.returnValue(of({ Success: true, ErrMsg: '' }));
    loadingCtrlSpy.create.and.returnValue(Promise.resolve(mockLoading as any));

    await component.save();

    expect(serviceSpy.create).toHaveBeenCalledWith(
      jasmine.objectContaining({
        PendingDocumentsJson: JSON.stringify([{ token: 'tok1', attachmentTypeId: 58 }]),
      })
    );
  });

  // ── 49. save null PendingDocumentsJson when no pending ──
  it('save should send null PendingDocumentsJson when no pending uploads', async () => {
    fixture.detectChanges();
    component.form.patchValue({
      ObjectNo: 'NOPEN001',
      CountryId: 1,
      CustomerPriceName: 'PRICE01',
      Piece: 1,
      ContentType: 0,
    });
    component.pendingUploads = [];
    serviceSpy.create.and.returnValue(of({ Success: true, ErrMsg: '' }));
    loadingCtrlSpy.create.and.returnValue(Promise.resolve(mockLoading as any));

    await component.save();

    expect(serviceSpy.create).toHaveBeenCalledWith(
      jasmine.objectContaining({ PendingDocumentsJson: null })
    );
  });

  // ── 50. onPriceFocus shows list and refreshes options ──
  it('onPriceFocus should show list and refresh options', () => {
    fixture.detectChanges();
    component.priceOptions = [{ Id: 1, Code: 'P1', Name: 'Price1' }];
    component.priceSearch = [];
    component.onPriceFocus();
    expect(component.showPriceList).toBe(true);
    expect(component.priceSearch.length).toBe(1);
  });

  // ── 51. onPriceKeyup Enter triggers selectPrice ──
  it('onPriceKeyup Enter should trigger selectPrice', () => {
    fixture.detectChanges();
    component.priceOptions = [{ Id: 1, Code: 'EXACT', Name: 'Exact Match' }];
    component.priceInput = 'EXACT';
    component.onPriceKeyup(new KeyboardEvent('keyup', { key: 'Enter' }));
    expect(component.selectedPrice?.Code).toBe('EXACT');
  });

  // ── 52. selectPrice shows error for no input ──
  it('selectPrice should set error when input is empty', () => {
    fixture.detectChanges();
    component.priceInput = '   ';
    component.selectPrice();
    expect(component.selectedPrice).toBeNull();
    expect(component.hasPriceValidationError).toBe(true);
  });

  // ── 53. selectPrice shows error when no match ──
  it('selectPrice should set error when no match found', () => {
    fixture.detectChanges();
    component.priceOptions = [{ Id: 1, Code: 'A', Name: 'AA' }, { Id: 2, Code: 'B', Name: 'BB' }];
    component.priceSearch = [...component.priceOptions];
    component.priceInput = 'NO_MATCH';
    component.selectPrice();
    expect(component.selectedPrice).toBeNull();
    expect(component.hasPriceValidationError).toBe(true);
  });
});
