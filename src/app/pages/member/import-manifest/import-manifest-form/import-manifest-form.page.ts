import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, NavController, LoadingController, ToastController } from '@ionic/angular';
import { ImportManifestService } from 'src/app/providers/import-manifest.service';
import { ImportManifestDetail, DropdownOption, AttachmentTypeOption, BatteryModelOption, ForwardingDocumentItem } from 'src/app/interfaces/import-manifest';
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
  isUploading: boolean = false;

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
  showSpecialVat: boolean = false;

  // Attachments
  attachmentTypes: AttachmentTypeOption[] = [];
  selectedAttachmentTypeId: number | null = null;
  attachments: ForwardingDocumentItem[] = [];
  pendingUploads: { filePath: string; fileName: string; attachmentTypeId: number; size: number }[] = [];
  deletedDocumentIds: number[] = [];

  // Battery model options (fetched from API, single source of truth)
  batteryModelOptions: BatteryModelOption[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    public service: ImportManifestService,
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
      ContentType: [0, [Validators.required]],
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
      this.service.getCustomerPriceOptions(),
      this.service.getAttachmentTypes(),
      this.service.getBatteryModelOptions(),
    ]).subscribe({
      next: ([countries, prices, attachTypes, batteryModels]) => {
        this.countryOptions = countries || [];
        this.countrySearch = this.countryOptions;
        this.priceOptions = prices || [];
        this.priceSearch = this.priceOptions;
        this.attachmentTypes = attachTypes || [];
        this.batteryModelOptions = batteryModels || [];
        // Default to first attachment type
        if (this.attachmentTypes.length > 0) {
          this.selectedAttachmentTypeId = this.attachmentTypes[0].id;
        }

        if (this.id) {
          this.loadDetail(this.id);
        }
      },
    });

    // Auto uppercase ObjectNo
    this.form.get('ObjectNo')?.valueChanges.subscribe((val) => {
      if (val && val !== val.toUpperCase()) {
        this.form.get('ObjectNo')?.setValue(val.toUpperCase(), { emitEvent: false });
      }
    });

    // Show/hide special VAT invoice when separate customs changes
    this.form.get('RequiresSeparateCustomsDeclaration')?.valueChanges.subscribe((val) => {
      this.showSpecialVat = val;
      if (!val) {
        this.form.get('RequiresSpecialVatInvoice')?.setValue(false);
      }

      // 勾选"单独报关"但无报关资料附件时，自动取消勾选并提示
      if (val) {
        const hasCustomsDoc = this.attachments.some((d) => d.attachmentTypeId === 58);
        if (!hasCustomsDoc) {
          this.form.get('RequiresSeparateCustomsDeclaration')?.setValue(false, { emitEvent: false });
          this.showSpecialVat = false;
          this.showToast('勾选"是否单独报关"前，请先上传报关资料');
        }
      }
    });
  }

  loadDetail(id: number) {
    this.loadingCtrl.create({ message: '加载中...' }).then((loading) => {
      loading.present();
      this.service.getDetail(id).subscribe({
        next: (detail) => {
          loading.dismiss();
          this.fillForm(detail);
          if (detail.Status !== 0) {
            this.isReadonly = true;
            this.form.disable();
          }
        },
        error: () => {
          loading.dismiss();
          this.showToast('加载失败，请重试');
        },
      });
    });
  }

  fillForm(detail: ImportManifestDetail) {
    this.showSpecialVat = detail.RequiresSeparateCustomsDeclaration;
    // Set selected country for autocomplete display
    const matched = this.countryOptions.find((c) => c.Id === detail.CountryId) || null;
    this.selectedCountry = matched;
    this.countryInput = matched ? `${matched.Name} (${matched.Code})` : '';
    // Set selected price for autocomplete display
    const matchedPrice = this.priceOptions.find((p) => p.Code === detail.CustomerPriceName) || null;
    this.selectedPrice = matchedPrice;
    this.priceInput = matchedPrice ? matchedPrice.Code : (detail.CustomerPriceName || '');
    this.form.patchValue({
      ObjectNo: detail.ObjectNo,
      CountryId: detail.CountryId,
      CustomerPriceName: detail.CustomerPriceName,
      Piece: detail.Piece,
      ContentType: detail.ContentType,
      PostalCode: detail.PostalCode || '',
      DeclaredValue: detail.DeclaredValue,
      CustomerExpressNo: detail.CustomerExpressNo || '',
      RequiresSeparateCustomsDeclaration: detail.RequiresSeparateCustomsDeclaration,
      RequiresDutiesAndTaxesPrepayment: detail.RequiresDutiesAndTaxesPrepayment,
      RequiresSpecialVatInvoice: detail.RequiresSpecialVatInvoice,
      BatteryModel: detail.BatteryModel || '',
    });

    // Load existing forwarding documents
    if (detail.ObjectId) {
      this.pendingUploads = [];
      this.deletedDocumentIds = [];
      this.service.getForwardingDocuments(detail.ObjectId).subscribe({
        next: (res) => {
          if (res.success) {
            this.attachments = (res.rows || []).map((d) => ({ ...d, isPending: false }));
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

  // ========== ContentType Toggle ==========

  setContentType(value: number) {
    this.form.get('ContentType')?.setValue(value);
    this.form.get('ContentType')?.markAsTouched();
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

    // Validate file type
    const isPrintAttachment = this.isPrintAttachmentType(attachTypeId);
    const allowedExts = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx'];
    if (!isPrintAttachment) {
      allowedExts.push('.zip', '.rar', '.7z');
    }
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedExts.includes(ext)) {
      this.showToast(isPrintAttachment
        ? '不支持的文件格式，仅支持 PDF/图片/Office 文档'
        : '不支持的文件格式，仅支持 PDF/图片/Office 文档，或 zip/rar/7z 压缩包');
      input.value = '';
      return;
    }

    // Validate file size (2MB limit for printed attachment types)
    const maxSize = isPrintAttachment ? 2 * 1024 * 1024 : Infinity;
    if (file.size > maxSize) {
      this.showToast('文件大小超过限制（最大 2MB）');
      input.value = '';
      return;
    }

    const loadingPromise = this.loadingCtrl.create({ message: '上传中...' });
    loadingPromise.then((loading) => {
      loading.present();
      this.isUploading = true;
      this.service.uploadTempDocument(file, attachTypeId).subscribe({
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
    const hasCustomsDoc = this.attachments.some((d) => d.attachmentTypeId === 58);
    const isChecked = this.form.get('RequiresSeparateCustomsDeclaration')?.value;

    if (hasCustomsDoc && !isChecked) {
      // 有报关资料但未勾选→自动勾选
      this.form.get('RequiresSeparateCustomsDeclaration')?.setValue(true);
    } else if (!hasCustomsDoc && isChecked) {
      // 无报关资料但已勾选→自动取消
      this.form.get('RequiresSeparateCustomsDeclaration')?.setValue(false);
    }
  }

  getFileIcon(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return 'document-outline';
      case 'jpg': case 'jpeg': case 'png': return 'image-outline';
      case 'doc': case 'docx': return 'document-text-outline';
      case 'xls': case 'xlsx': return 'grid-outline';
      case 'zip': case 'rar': case '7z': return 'archive-outline';
      default: return 'attach-outline';
    }
  }

  previewDocument(doc: ForwardingDocumentItem) {
    if (!doc || !doc.id) return;
    this.service.openForwardingDocumentPreview(doc.id);
  }

  formatFileSize(bytes: number): string {
    if (!bytes || bytes <= 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
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

    // 快递单号：校验单个长度 + 去重
    const rawExpressNo = this.form.get('CustomerExpressNo')?.value?.trim() || '';
    if (rawExpressNo) {
      const parts = rawExpressNo
        .split(/[,;，；]/)
        .map((p: string) => p.trim())
        .filter((p: string) => p.length > 0);
      for (let i = 0; i < parts.length; i++) {
        if (parts[i].length > 32) {
          const alert = await this.alertCtrl.create({
            header: '快递单号格式错误',
            message: `第 ${i + 1} 个快递单号长度不能超过 32 个字符`,
            buttons: ['确定'],
          });
          await alert.present();
          return;
        }
      }
      // 去重后重新写入
      const uniqueParts = [...new Set(parts.map((p: string) => p.toLowerCase()))];
      const deduped = uniqueParts.join(',');
      if (deduped !== rawExpressNo.replace(/[,;，；]/g, ',').replace(/,,+/g, ',').replace(/^,|,$/g, '')) {
        this.form.get('CustomerExpressNo')?.setValue(deduped);
      }
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
      ContentType: formValue.ContentType,
      PostalCode: formValue.PostalCode?.trim() || null,
      DeclaredValue: formValue.DeclaredValue || null,
      CustomerExpressNo: formValue.CustomerExpressNo?.trim() || null,
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

    operation.subscribe({
      next: (res) => {
        loading.dismiss();
        if (res.Success) {
          this.showToast(this.isEditMode ? '编辑成功' : '新增成功');
          this.navCtrl.back();
        } else {
          this.showAlert('操作失败', res.ErrMsg);
        }
      },
      error: () => {
        loading.dismiss();
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
}
