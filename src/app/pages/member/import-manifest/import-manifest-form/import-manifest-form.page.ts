import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, NavController, LoadingController, ToastController } from '@ionic/angular';
import { ImportManifestService } from 'src/app/providers/import-manifest.service';
import { AvailableCustomerPriceItem, ImportManifestDetail, DropdownOption, AttachmentTypeOption, BatteryModelOption, ForwardingDocumentItem, ImportManifestSaveRequest } from 'src/app/interfaces/import-manifest';
import { ImportManifestDomainService } from 'src/app/providers/import-manifest-domain.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-import-manifest-form',
  templateUrl: './import-manifest-form.page.html',
  styleUrls: ['./import-manifest-form.page.scss'],
})
export class ImportManifestFormPage implements OnInit {
  form: FormGroup;
  id: number | null = null;
  isEditMode: boolean = false;
  isReadonly: boolean = false;
  isInitializing: boolean = true;
  isUploading: boolean = false;
  isSaving: boolean = false;
  readonly skeletonFormCards = [
    { fields: ['input', 'input', 'input', 'contentType', 'input', 'input', 'input', 'toggle', 'toggle', 'toggle', 'input'], attachments: false },
    { fields: ['textarea'], attachments: false },
    { fields: ['attachmentUpload'], attachments: true },
  ];

  countryOptions: DropdownOption[] = [];
  countrySearch: DropdownOption[] = [];
  selectedCountry: DropdownOption | null = null;
  countryInput: string = '';
  showCountryList: boolean = false;
  hasCountryValidationError: boolean = false;
  priceOptions: DropdownOption[] = [];
  priceSearch: DropdownOption[] = [];
  selectedPrice: DropdownOption | null = null;
  priceInput: string = '';
  showPriceList: boolean = false;
  hasPriceValidationError: boolean = false;
  isPriceLoading: boolean = false;
  priceMessage: string = '';
  priceMessageIsError: boolean = false;
  showSpecialVat: boolean = false;
  private appliedRequiresSeparateCustomsDeclaration: boolean = false;
  private appliedRequiresSpecialVatInvoice: boolean = false;
  private initialPriceCode: string = '';
  private originalPriceCode: string = '';
  private priceCalculationTimer: ReturnType<typeof setTimeout> | null = null;
  private priceCalculationRequestNo: number = 0;

  // Attachments
  attachmentTypes: AttachmentTypeOption[] = [];
  selectedAttachmentTypeId: number | null = null;
  attachments: ForwardingDocumentItem[] = [];
  pendingUploads: { filePath: string; fileName: string; attachmentTypeId: number; size: number }[] = [];
  deletedDocumentIds: number[] = [];

  // Battery model options (fetched from API, single source of truth)
  batteryModelOptions: BatteryModelOption[] = [];
  readonlyStatusName = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    public service: ImportManifestService,
    public domain: ImportManifestDomainService,
    private alertCtrl: AlertController,
    private navCtrl: NavController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {
    this.form = this.fb.group({
      ObjectNo: ['', [Validators.required, Validators.maxLength(32), Validators.pattern('^[A-Z0-9\\-]+$')]],
      CountryId: [null, [Validators.required]],
      CustomerPriceName: ['', [Validators.required]],
      Piece: [null, [Validators.required, Validators.min(1), Validators.max(9999)]],
      Weight: [null, [Validators.required, Validators.min(0.01)]],
      ContentType: [1, [Validators.required]],
      PostalCode: ['', [Validators.maxLength(16)]],
      DeclaredValue: [null],
      CustomerExpressNo: ['', [Validators.maxLength(512)]],
      RequiresSeparateCustomsDeclaration: [false],
      RequiresDutiesAndTaxesPrepayment: [false],
      RequiresSpecialVatInvoice: [false],
      BatteryModel: [''],
    });
  }

  ngOnInit(): void {
    const paramId = this.route.snapshot.paramMap.get('id');
    if (paramId) {
      this.id = +paramId;
      this.isEditMode = true;
    }

    // Load dropdowns first, then detail (so countryOptions is available for fillForm)
    forkJoin([
      this.service.getCountryOptions(),
      this.service.getAttachmentTypes(),
      this.service.getBatteryModelOptions(),
    ]).subscribe({
      next: ([countries, attachTypes, batteryModels]) => {
        this.countryOptions = countries || [];
        this.countrySearch = this.countryOptions;
        this.priceOptions = [];
        this.priceSearch = [];
        this.attachmentTypes = attachTypes || [];
        this.batteryModelOptions = batteryModels || [];
        // Default to first attachment type
        if (this.attachmentTypes.length > 0) {
          this.selectedAttachmentTypeId = this.attachmentTypes[0].id;
        }

        if (this.id) {
          this.loadDetail(this.id);
        } else {
          this.isInitializing = false;
          this.resetCustomerPriceOptions('请先填写目的国、件数、重量和货物类型', true);
          this.scheduleAvailablePriceReload(0);
        }
      },
      error: () => {
        this.isInitializing = false;
        this.showToast('加载失败，请重试');
      },
    });

    // Auto uppercase ObjectNo
    this.form.get('ObjectNo')?.valueChanges.subscribe((val) => {
      const normalized = this.domain.normalizeObjectNo(val || '');
      if (val && val !== normalized) {
        this.form.get('ObjectNo')?.setValue(normalized, { emitEvent: false });
      }
    });

    // Show/hide special VAT invoice when separate customs changes
    this.form.get('RequiresSeparateCustomsDeclaration')?.valueChanges.subscribe((val) => {
      if (this.applyCustomsState(!!val, !!this.form.get('RequiresSpecialVatInvoice')?.value, true)) {
        this.scheduleAvailablePriceReload();
      }
    });

    this.form.get('RequiresSpecialVatInvoice')?.valueChanges.subscribe((val) => {
      if (this.applyCustomsState(!!this.form.get('RequiresSeparateCustomsDeclaration')?.value, !!val, false)) {
        this.scheduleAvailablePriceReload();
      }
    });

    this.watchPriceCalculationInputs();
  }

  loadDetail(id: number) {
    this.service.getDetail(id).subscribe({
      next: (detail) => {
        this.fillForm(detail);
        if (detail.Status !== 0) {
          this.isReadonly = true;
          this.readonlyStatusName = this.domain.getCustomerStatusNameByCode(detail.Status, detail.StatusName);
          this.form.disable();
        } else {
          this.scheduleAvailablePriceReload(0);
        }
        this.isInitializing = false;
      },
      error: () => {
        this.isInitializing = false;
        this.showToast('加载失败，请重试');
      },
    });
  }

  fillForm(detail: ImportManifestDetail) {
    this.showSpecialVat = detail.RequiresSeparateCustomsDeclaration;
    // Set selected country for autocomplete display
    const matched = this.countryOptions.find((c) => c.Id === detail.CountryId) || null;
    this.selectedCountry = matched;
    this.countryInput = matched ? `${matched.Name} (${matched.Code})` : '';
    this.initialPriceCode = detail.CustomerPriceName || '';
    this.originalPriceCode = this.initialPriceCode;
    this.selectedPrice = this.initialPriceCode
      ? { Id: 0, Code: this.initialPriceCode, Name: this.initialPriceCode }
      : null;
    this.priceOptions = this.selectedPrice ? [this.selectedPrice] : [];
    this.priceSearch = this.priceOptions;
    this.priceInput = this.initialPriceCode;
    this.form.patchValue({
      ObjectNo: detail.ObjectNo,
      CountryId: detail.CountryId,
      CustomerPriceName: detail.CustomerPriceName,
      Piece: detail.Piece,
      Weight: detail.Weight,
      ContentType: detail.ContentType,
      PostalCode: detail.PostalCode || '',
      DeclaredValue: detail.DeclaredValue,
      CustomerExpressNo: detail.CustomerExpressNo || '',
      RequiresSeparateCustomsDeclaration: detail.RequiresSeparateCustomsDeclaration,
      RequiresDutiesAndTaxesPrepayment: detail.RequiresDutiesAndTaxesPrepayment,
      RequiresSpecialVatInvoice: detail.RequiresSpecialVatInvoice,
      BatteryModel: detail.BatteryModel || '',
    }, { emitEvent: false });
    this.appliedRequiresSeparateCustomsDeclaration = !!detail.RequiresSeparateCustomsDeclaration;
    this.appliedRequiresSpecialVatInvoice = !!detail.RequiresSpecialVatInvoice;

    // Load existing forwarding documents
    if (detail.ObjectId) {
      this.pendingUploads = [];
      this.deletedDocumentIds = [];
      this.service.getForwardingDocuments(detail.ObjectId).subscribe({
        next: (res) => {
          if (res.success) {
            this.attachments = (res.rows || []).map((d) => ({ ...d, isPending: false }));
            this.syncCustomsDeclarationFlag();
          }
        },
      });
    }
  }

  async validateObjectNo() {
    const objectNo = this.form.get('ObjectNo')?.value?.trim();
    if (!objectNo) return;

    const excludeId = this.isEditMode ? this.id ?? undefined : undefined;
    this.service.validateObjectNo(objectNo, excludeId).subscribe({
      next: (res) => {
        if (!res.Success) {
          this.showToast(res.ErrMsg);
          this.form.get('ObjectNo')?.setErrors({ duplicate: true });
        }
      },
    });
  }

  async validateCustomerPriceName() {
    const priceCode = this.form.get('CustomerPriceName')?.value?.trim();
    if (!priceCode) return;

    this.service.validateCustomerPriceName(priceCode).subscribe({
      next: (res) => {
        if (!res.Success) {
          this.showToast(res.ErrMsg);
          this.form.get('CustomerPriceName')?.setErrors({ invalid: true });
        }
      },
    });
  }

  private watchPriceCalculationInputs() {
    [
      'Piece',
      'Weight',
      'ContentType',
      'PostalCode',
      'DeclaredValue',
      'RequiresDutiesAndTaxesPrepayment',
      'BatteryModel',
    ].forEach((controlName) => {
      this.form.get(controlName)?.valueChanges.subscribe(() => {
        this.scheduleAvailablePriceReload();
      });
    });
  }

  private scheduleAvailablePriceReload(delay: number = 300) {
    if (this.isReadonly) {
      return;
    }

    if (this.priceCalculationTimer) {
      clearTimeout(this.priceCalculationTimer);
    }

    if (this.hasRequiredPriceCalculationParams()) {
      this.isPriceLoading = true;
      this.setPriceMessage('报价计算中...', false);
    } else {
      this.isPriceLoading = false;
    }

    this.priceCalculationTimer = setTimeout(() => {
      this.loadAvailableCustomerPrices();
    }, delay);
  }

  private hasRequiredPriceCalculationParams(): boolean {
    const countryId = this.form.get('CountryId')?.value;
    const piece = Number(this.form.get('Piece')?.value || 0);
    const weight = Number(this.form.get('Weight')?.value || 0);
    const contentType = this.form.get('ContentType')?.value;
    return !!countryId && piece > 0 && weight > 0 && contentType !== null && contentType !== undefined && contentType !== '';
  }

  private getPriceCalculationPayload(): ImportManifestSaveRequest {
    const formValue = this.form.getRawValue();
    return {
      ObjectNo: formValue.ObjectNo || '',
      CountryId: formValue.CountryId,
      CustomerPriceName: formValue.CustomerPriceName || '',
      Piece: formValue.Piece,
      Weight: formValue.Weight,
      ContentType: formValue.ContentType,
      PostalCode: formValue.PostalCode || '',
      DeclaredValue: formValue.DeclaredValue || null,
      CustomerExpressNo: formValue.CustomerExpressNo || '',
      RequiresSeparateCustomsDeclaration: formValue.RequiresSeparateCustomsDeclaration || false,
      RequiresDutiesAndTaxesPrepayment: formValue.RequiresDutiesAndTaxesPrepayment || false,
      RequiresSpecialVatInvoice: formValue.RequiresSpecialVatInvoice || false,
      BatteryModel: formValue.BatteryModel || '',
    };
  }

  private loadAvailableCustomerPrices() {
    if (this.isReadonly) {
      return;
    }

    if (!this.hasRequiredPriceCalculationParams()) {
      this.priceCalculationRequestNo++;
      this.isPriceLoading = false;
      this.resetCustomerPriceOptions('请先填写目的国、件数、重量和货物类型', true);
      return;
    }

    const requestNo = ++this.priceCalculationRequestNo;
    const previousCode = this.selectedPrice?.Code || this.form.get('CustomerPriceName')?.value || this.initialPriceCode || this.originalPriceCode || '';
    this.isPriceLoading = true;
    this.setPriceMessage('报价计算中...', false);

    this.service.getAvailableCustomerPrices(this.getPriceCalculationPayload()).subscribe({
      next: (res) => {
        if (requestNo !== this.priceCalculationRequestNo) {
          return;
        }

        const success = res && res.success !== false && res.Success !== false;
        const items = (res && (res.items || res.Items)) || [];

        if (!success) {
          this.resetCustomerPriceOptions((res && (res.message || res.Message)) || '报价计算失败，请稍后重试', true);
          return;
        }

        if (items.length === 0) {
          this.resetCustomerPriceOptions((res && (res.message || res.Message)) || '未计算到可用报价，请调整预报数据', true);
          return;
        }

        this.renderAvailablePriceOptions(items, previousCode);
        this.initialPriceCode = '';
      },
      error: () => {
        if (requestNo !== this.priceCalculationRequestNo) {
          return;
        }
        this.isPriceLoading = false;
        this.resetCustomerPriceOptions('报价计算失败，请稍后重试', true);
      },
      complete: () => {
        if (requestNo === this.priceCalculationRequestNo) {
          this.isPriceLoading = false;
        }
      },
    });
  }

  private renderAvailablePriceOptions(items: AvailableCustomerPriceItem[], previousCode: string) {
    const selectedCode = (previousCode || '').trim().toUpperCase();
    const originalCode = (this.originalPriceCode || '').trim().toUpperCase();
    const candidateCodes = [selectedCode];
    if (originalCode && originalCode !== selectedCode) {
      candidateCodes.push(originalCode);
    }

    this.priceOptions = items
      .map((item, index) => this.toDropdownOption(item, index))
      .filter((item) => !!item.Code);
    this.priceSearch = this.priceOptions;

    const selected = candidateCodes
      .filter((code) => !!code)
      .map((code) => this.priceOptions.find((item) => item.Code.toUpperCase() === code) || null)
      .find((item) => !!item) || null;

    if (selected) {
      this.setSelectedPrice(selected);
      this.setPriceMessage('', false);
      return;
    }

    this.clearSelectedPrice();
    if (originalCode && !this.priceOptions.some((item) => item.Code.toUpperCase() === originalCode)) {
      this.setPriceMessage('原报价不在当前可用报价中，请重新选择报价', true);
    } else {
      this.setPriceMessage('', false);
    }
  }

  private toDropdownOption(item: AvailableCustomerPriceItem, index: number): DropdownOption {
    const code = (item.value || item.Value || '').trim();
    const text = (item.text || item.Text || code).trim();
    const prefix = code + '-';
    const name = code && text.toUpperCase().startsWith(prefix.toUpperCase())
      ? text.substring(prefix.length)
      : text;

    return {
      Id: index + 1,
      Code: code,
      Name: name || code,
    };
  }

  private resetCustomerPriceOptions(message: string, isError: boolean) {
    this.priceOptions = [];
    this.priceSearch = [];
    this.clearSelectedPrice();
    this.setPriceMessage(message, isError);
  }

  private clearSelectedPrice() {
    this.priceInput = '';
    this.selectedPrice = null;
    this.showPriceList = false;
    this.hasPriceValidationError = false;
    this.form.get('CustomerPriceName')?.setValue(null, { emitEvent: false });
  }

  private setPriceMessage(message: string, isError: boolean) {
    this.priceMessage = message || '';
    this.priceMessageIsError = !!isError;
  }

  // ========== ContentType Toggle ==========

  setContentType(value: number) {
    this.form.get('ContentType')?.setValue(value);
    this.form.get('ContentType')?.markAsTouched();
  }

  get contentTypeOptions() {
    return this.domain.contentTypeOptions;
  }

  getReadonlyNoticeText(): string {
    return `该预报${this.readonlyStatusName || this.domain.getCustomerStatusNameByCode(1)}，禁止编辑`;
  }

  // ========== Attachments ==========

  onAttachmentFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;

    const attachTypeId = this.selectedAttachmentTypeId;
    if (!attachTypeId) {
      this.showToast('请先选择附件类型');
      input.value = '';
      return;
    }

    // 该附件类型不允许重复，检查已上传 + 待上传
    const typeName = this.attachmentTypes.find((t) => t.id === attachTypeId)?.name || '';
    if (this.isPrintAttachmentType(attachTypeId)) {
      const duplicate = this.attachments.some((d) => d.attachmentTypeId === attachTypeId);
      if (duplicate) {
        this.showToast(`"${typeName}" 类型不允许重复上传`);
        input.value = '';
        return;
      }
    }

    const validation = this.domain.validateAttachment(file, attachTypeId, this.attachmentTypes, this.attachments);
    if (!validation.ok) {
      this.showToast(validation.message || '附件不符合上传规则');
      input.value = '';
      return;
    }

    const loadingPromise = this.loadingCtrl.create({ message: '上传中...' });
    loadingPromise.then((loading) => {
      loading.present();
      this.isUploading = true;
      this.service.uploadPendingDocument(file, attachTypeId).subscribe({
        next: (res) => {
          loading.dismiss();
          this.isUploading = false;
          input.value = '';
          if (res.success && res.filePath) {
            const typeName = this.attachmentTypes.find((t) => t.id === attachTypeId)?.name || '';
            this.attachments.push({
              filePath: res.filePath,
              fileName: res.fileName || file.name,
              attachmentTypeId: attachTypeId,
              attachmentTypeName: typeName,
              size: file.size,
              isPending: true,
            });
            this.pendingUploads.push({ filePath: res.filePath, fileName: res.fileName || file.name, attachmentTypeId: attachTypeId, size: file.size });
            this.syncCustomsDeclarationFlag();
          } else {
            this.showToast(res.message || '上传失败，请重试');
          }
        },
        error: () => {
          loading.dismiss();
          this.isUploading = false;
          input.value = '';
          this.showToast('上传失败，网络错误');
        },
      });
    });
  }

  removeAttachment(index: number) {
    const doc = this.attachments[index];
    if (!doc) return;

    if (doc.isPending && doc.filePath) {
      this.pendingUploads = this.pendingUploads.filter((p) => p.filePath !== doc.filePath);
    } else if (doc.id) {
      // Already saved document - mark for deletion on save
      this.deletedDocumentIds.push(doc.id);
    }

    this.attachments.splice(index, 1);
    this.syncCustomsDeclarationFlag();
  }

  /** Check if the given attachment type ID is a printed (IsPrint) type */
  private isPrintAttachmentType(typeId: number): boolean {
    const att = this.attachmentTypes.find((t) => t.id === typeId);
    return att ? att.isPrint : false;
  }

  /** Auto-sync customs declaration flag with attachment type 58 (bidirectional) */
  private syncCustomsDeclarationFlag() {
    if (this.applyCustomsState(
      !!this.form.get('RequiresSeparateCustomsDeclaration')?.value,
      !!this.form.get('RequiresSpecialVatInvoice')?.value,
      true
    )) {
      this.scheduleAvailablePriceReload();
    }
  }

  getFileIcon(fileName: string): string {
    return this.domain.getFileIcon(fileName);
  }

  previewDocument(doc: ForwardingDocumentItem) {
    if (!doc || !doc.id) return;
    this.service.openForwardingDocumentPreview(doc.id);
  }

  downloadDocument(doc: ForwardingDocumentItem) {
    if (!doc || !doc.id) return;
    this.service.downloadForwardingDocument(doc.id);
  }

  formatFileSize(bytes: number): string {
    return this.domain.formatFileSize(bytes);
  }

  // ========== Country Autocomplete ==========

  onCountryFocus() {
    this.showCountryList = true;
    if (!this.selectedCountry) {
      this.countrySearch = this.countryOptions;
    }
  }

  onCountryBlur() {
    this.form.get('CountryId')?.markAsTouched();
    setTimeout(() => this.selectCountry(), 120);
  }

  filterCountryItems(ev: any) {
    const val = (ev?.detail?.value ?? ev?.target?.value ?? '').toString();
    this.countryInput = val;
    this.showCountryList = true;
    this.selectedCountry = null;
    this.hasCountryValidationError = false;
    this.form.get('CountryId')?.setValue(null, { emitEvent: false });

    if (val && val.trim() !== '') {
      const lower = val.toLowerCase();
      this.countrySearch = this.countryOptions.filter(
        (item) => item.Name.toLowerCase().includes(lower) || item.Code.toLowerCase().includes(lower)
      );
    } else {
      this.countrySearch = this.countryOptions;
    }
  }

  countryItemClick(item: DropdownOption) {
    this.setSelectedCountry(item);
  }

  onCountryKeyup(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.selectCountry();
    }
  }

  onCountryClear() {
    this.countryInput = '';
    this.countrySearch = this.countryOptions;
    this.selectedCountry = null;
    this.showCountryList = false;
    this.hasCountryValidationError = false;
    this.form.get('CountryId')?.setValue(null, { emitEvent: false });
    this.scheduleAvailablePriceReload(0);
  }

  selectCountry() {
    const inputValue = this.countryInput.trim();
    if (!inputValue) {
      this.selectedCountry = null;
      this.showCountryList = false;
      this.hasCountryValidationError = true;
      return;
    }

    const exactMatch = this.countryOptions.find(
      (item) => item.Name.toLowerCase() === inputValue.toLowerCase()
    );

    if (exactMatch) {
      this.setSelectedCountry(exactMatch);
      return;
    }

    if (this.countrySearch.length === 1) {
      this.setSelectedCountry(this.countrySearch[0]);
      return;
    }

    this.selectedCountry = null;
    this.hasCountryValidationError = true;
  }

  private setSelectedCountry(item: DropdownOption) {
    this.showCountryList = false;
    this.countryInput = `${item.Name} (${item.Code})`;
    this.form.get('CountryId')?.setValue(item.Id, { emitEvent: false });
    this.form.get('CountryId')?.markAsTouched();
    this.selectedCountry = item;
    this.hasCountryValidationError = false;
    this.scheduleAvailablePriceReload(0);
  }

  get isCountryErrorVisible(): boolean {
    return this.hasCountryValidationError ||
      (!!this.form.get('CountryId')?.touched && !this.selectedCountry);
  }

  // ========== Price Autocomplete ==========

  onPriceFocus() {
    this.showPriceList = true;
    this.priceSearch = this.priceOptions;
  }

  onPriceBlur() {
    this.form.get('CustomerPriceName')?.markAsTouched();
    setTimeout(() => this.selectPrice(), 120);
  }

  filterPriceItems(ev: any) {
    const val = (ev?.detail?.value ?? ev?.target?.value ?? '').toString();

    // 若值未变化且已有选中项，跳过以避免程序化赋值触发重置
    if (val === this.priceInput && this.selectedPrice) {
      return;
    }

    this.priceInput = val;
    this.showPriceList = true;
    this.selectedPrice = null;
    this.hasPriceValidationError = false;
    this.form.get('CustomerPriceName')?.setValue(null, { emitEvent: false });

    if (val && val.trim() !== '') {
      const lower = val.toLowerCase();
      this.priceSearch = this.priceOptions.filter(
        (item) => item.Name.toLowerCase().includes(lower) || item.Code.toLowerCase().includes(lower)
      );
    } else {
      this.priceSearch = this.priceOptions;
    }
  }

  priceItemClick(item: DropdownOption) {
    this.setSelectedPrice(item);
  }

  onPriceKeyup(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.selectPrice();
    }
  }

  onPriceClear() {
    this.priceInput = '';
    this.priceSearch = this.priceOptions;
    this.selectedPrice = null;
    this.showPriceList = false;
    this.hasPriceValidationError = false;
    this.form.get('CustomerPriceName')?.setValue(null, { emitEvent: false });
  }

  selectPrice() {
    const inputValue = this.priceInput.trim();
    if (!inputValue) {
      this.selectedPrice = null;
      this.showPriceList = false;
      this.hasPriceValidationError = true;
      return;
    }

    const exactMatch = this.priceOptions.find(
      (item) => item.Code.toLowerCase() === inputValue.toLowerCase()
    );

    if (exactMatch) {
      this.setSelectedPrice(exactMatch);
      return;
    }

    if (this.priceSearch.length === 1) {
      this.setSelectedPrice(this.priceSearch[0]);
      return;
    }

    this.selectedPrice = null;
    this.hasPriceValidationError = true;
  }

  private setSelectedPrice(item: DropdownOption) {
    this.showPriceList = false;
    this.priceInput = item.Code;
    this.form.get('CustomerPriceName')?.setValue(item.Code, { emitEvent: false });
    this.form.get('CustomerPriceName')?.markAsTouched();
    this.selectedPrice = item;
    this.hasPriceValidationError = false;
  }

  get isPriceErrorVisible(): boolean {
    return this.hasPriceValidationError ||
      (!!this.form.get('CustomerPriceName')?.touched && !this.selectedPrice);
  }

  get isPriceSearchDisabled(): boolean {
    return this.isReadonly || this.isPriceLoading || !this.hasRequiredPriceCalculationParams() || this.priceOptions.length === 0;
  }

  // ========== Save ==========

  async save() {
    // 保存前检查是否有文件仍在上传中
    if (this.isUploading) {
      const alert = await this.alertCtrl.create({
        header: '文件上传未完成',
        message: '文件仍在上传中，请等待上传完成后再保存',
        buttons: ['确定'],
      });
      await alert.present();
      return;
    }

    if (this.isPriceLoading) {
      const alert = await this.alertCtrl.create({
        header: '报价仍在计算',
        message: '请稍后再保存',
        buttons: ['确定'],
      });
      await alert.present();
      return;
    }

    // 快递单号：校验单个长度 + 去重
    const expressNoResult = this.domain.normalizeCustomerExpressNo(this.form.get('CustomerExpressNo')?.value || '');
    if (!expressNoResult.ok) {
      const alert = await this.alertCtrl.create({
        header: '快递单号格式错误',
        message: expressNoResult.error,
        buttons: ['确定'],
      });
      await alert.present();
      return;
    }
    if (this.form.get('CustomerExpressNo')?.value !== expressNoResult.value) {
      this.form.get('CustomerExpressNo')?.setValue(expressNoResult.value);
    }

    if (this.form.invalid) {
      const alert = await this.alertCtrl.create({
        header: '信息填写不完善',
        message: '请检查必填字段后重试',
        buttons: ['确定'],
      });
      await alert.present();
      return;
    }

    const formValue = this.form.getRawValue();
    const pendingDocsJson = this.pendingUploads.length > 0
      ? JSON.stringify(this.pendingUploads)
      : null;
    const request = {
      ObjectId: this.id,
      ObjectNo: formValue.ObjectNo?.trim().toUpperCase(),
      CountryId: formValue.CountryId,
      CustomerPriceName: this.selectedPrice?.Code || formValue.CustomerPriceName?.trim().toUpperCase(),
      Piece: formValue.Piece,
      Weight: formValue.Weight,
      ContentType: formValue.ContentType,
      PostalCode: formValue.PostalCode?.trim() || null,
      DeclaredValue: formValue.DeclaredValue || null,
      CustomerExpressNo: expressNoResult.value || null,
      RequiresSeparateCustomsDeclaration: formValue.RequiresSeparateCustomsDeclaration || false,
      RequiresDutiesAndTaxesPrepayment: formValue.RequiresDutiesAndTaxesPrepayment || false,
      RequiresSpecialVatInvoice: formValue.RequiresSpecialVatInvoice || false,
      BatteryModel: formValue.BatteryModel || '',
      PendingDocumentsJson: pendingDocsJson,
      DeletedDocumentIds: this.deletedDocumentIds.length > 0 ? this.deletedDocumentIds : null,
    };

    const operation = this.isEditMode
      ? this.service.edit(request)
      : this.service.create(request);

    const loading = await this.loadingCtrl.create({ message: '保存中...' });
    await loading.present();
    this.isSaving = true;

    operation.subscribe({
      next: (res) => {
        loading.dismiss();
        this.isSaving = false;
        if (res.Success) {
          this.showToast(this.isEditMode ? '编辑成功' : '新增成功');
          this.service.markListDirty();
          this.navCtrl.back();
        } else {
          this.showAlert('操作失败', res.ErrMsg);
        }
      },
      error: () => {
        loading.dismiss();
        this.isSaving = false;
        this.showAlert('错误', '网络错误，请稍后重试');
      },
    });
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({ header, message, buttons: ['确定'] });
    await alert.present();
  }

  async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'top',
      color: 'dark',
    });
    await toast.present();
  }

  private applyCustomsState(requestedSeparate: boolean, requestedSpecialVat: boolean, showMessage: boolean): boolean {
    const previousSeparate = this.appliedRequiresSeparateCustomsDeclaration;
    const previousSpecialVat = this.appliedRequiresSpecialVatInvoice;
    const state = this.domain.resolveCustomsState(this.attachments, requestedSeparate, requestedSpecialVat);
    this.showSpecialVat = state.showSpecialVat;

    if (this.form.get('RequiresSeparateCustomsDeclaration')?.value !== state.requiresSeparateCustomsDeclaration) {
      this.form.get('RequiresSeparateCustomsDeclaration')?.setValue(state.requiresSeparateCustomsDeclaration, { emitEvent: false });
    }
    if (this.form.get('RequiresSpecialVatInvoice')?.value !== state.requiresSpecialVatInvoice) {
      this.form.get('RequiresSpecialVatInvoice')?.setValue(state.requiresSpecialVatInvoice, { emitEvent: false });
    }
    this.appliedRequiresSeparateCustomsDeclaration = state.requiresSeparateCustomsDeclaration;
    this.appliedRequiresSpecialVatInvoice = state.requiresSpecialVatInvoice;

    if (showMessage && state.message) {
      this.showToast(state.message);
    }

    return previousSeparate !== state.requiresSeparateCustomsDeclaration ||
      previousSpecialVat !== state.requiresSpecialVatInvoice;
  }
}
