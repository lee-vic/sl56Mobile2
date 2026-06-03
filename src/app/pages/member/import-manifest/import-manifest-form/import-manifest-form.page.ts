import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, NavController, LoadingController, ToastController } from '@ionic/angular';
import { ImportManifestService } from 'src/app/providers/import-manifest.service';
import { ImportManifestDetail, DropdownOption } from 'src/app/interfaces/import-manifest';
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
  isSubmitting: boolean = false;

  countryOptions: DropdownOption[] = [];
  countrySearch: DropdownOption[] = [];
  selectedCountry: DropdownOption | null = null;
  countryInput: string = '';
  showCountryList: boolean = false;
  hasCountryValidationError: boolean = false;
  priceOptions: DropdownOption[] = [];
  showSpecialVat: boolean = false;

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
    ]).subscribe({
      next: ([countries, prices]) => {
        this.countryOptions = countries || [];
        this.countrySearch = this.countryOptions;
        this.priceOptions = prices || [];

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
    });
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

  // ========== Save ==========

  async save() {
    if (this.form.invalid) {
      const alert = await this.alertCtrl.create({
        header: '信息填写不完善',
        message: '请检查必填字段后重试',
        buttons: ['确定'],
      });
      await alert.present();
      return;
    }

    if (this.isSubmitting) return;
    this.isSubmitting = true;

    const formValue = this.form.getRawValue();
    const request = {
      ObjectId: this.id,
      ObjectNo: formValue.ObjectNo?.trim().toUpperCase(),
      CountryId: formValue.CountryId,
      CustomerPriceName: formValue.CustomerPriceName?.trim().toUpperCase(),
      Piece: formValue.Piece,
      ContentType: formValue.ContentType,
      PostalCode: formValue.PostalCode?.trim() || null,
      DeclaredValue: formValue.DeclaredValue || null,
      CustomerExpressNo: formValue.CustomerExpressNo?.trim() || null,
      RequiresSeparateCustomsDeclaration: formValue.RequiresSeparateCustomsDeclaration || false,
      RequiresDutiesAndTaxesPrepayment: formValue.RequiresDutiesAndTaxesPrepayment || false,
      RequiresSpecialVatInvoice: formValue.RequiresSpecialVatInvoice || false,
    };

    const operation = this.isEditMode
      ? this.service.edit(request)
      : this.service.create(request);

    const loading = await this.loadingCtrl.create({ message: '保存中...' });
    await loading.present();

    operation.subscribe({
      next: (res) => {
        loading.dismiss();
        this.isSubmitting = false;
        if (res.Success) {
          this.showToast(this.isEditMode ? '编辑成功' : '新增成功');
          this.navCtrl.back();
        } else {
          this.showAlert('操作失败', res.ErrMsg);
        }
      },
      error: () => {
        loading.dismiss();
        this.isSubmitting = false;
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
