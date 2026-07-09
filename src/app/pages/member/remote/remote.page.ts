import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize, takeUntil } from 'rxjs/operators';
import { Country } from 'src/app/interfaces/country';
import { CountryService } from 'src/app/providers/country.service';
import { RemoteService } from 'src/app/providers/remote.service';
import { UiFeedbackService } from 'src/app/providers/ui-feedback.service';

interface RemoteQueryResponse {
  Status: number;
  IsRemote: boolean;
  Message: string;
  Results?: Array<RemoteQueryItemResponse>;
}

interface RemoteQueryItemResponse {
  ModeOfTransportTypeId: number;
  ModeOfTransportTypeName: string;
  Status: number;
  IsRemote: boolean;
  Message: string;
}

interface RemoteQueryResultView {
  title: string;
  message: string;
  success: boolean;
  isRemote: boolean;
  items: Array<RemoteQueryItemView>;
}

interface RemoteQueryItemView {
  name: string;
  statusText: string;
  message: string;
  success: boolean;
  isRemote: boolean;
}

interface RemoteEsdOption {
  ObjectId: number;
  City: string;
  PostcodeLow: string;
  PostcodeHigh: string;
  DisplayText: string;
}

@Component({
  selector: 'app-remote',
  templateUrl: './remote.page.html',
  styleUrls: ['./remote.page.scss'],
})
export class RemotePage implements OnInit, OnDestroy {
  countryList: Array<Country> = [];
  countrySearch: Array<Country> = [];

  myForm: FormGroup;
  selectedCountry: Country | null = null;
  showCountryList = false;
  postcodeEnabled = false;
  isCheckingPostcode = false;
  esdOptions: Array<RemoteEsdOption> = [];
  esdLookupMode: 'postalCode' | 'city' | '' = '';

  isInitializing = false;
  isLoaded = false;
  hasLoadError = false;
  isQuerying = false;
  hasSubmitted = false;

  queryResult: RemoteQueryResultView | null = null;
  queryErrorMessage = '';
  private readonly destroy$ = new Subject<void>();

  constructor(
    public service: RemoteService,
    public countryService: CountryService,
    public formBuilder: FormBuilder,
    private readonly uiFeedback: UiFeedbackService,
  ) {
    this.myForm = this.formBuilder.group({
      countryId: ['', Validators.required],
      postalCode: [''],
      city: [''],
    });
  }

  ngOnInit(): void {
    this.loadInitialOptions();
    this.bindEsdLookup();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get countryControl() {
    return this.myForm.get('countryId');
  }

  get isCountryInvalid(): boolean {
    return (this.hasSubmitted || !!this.countryControl?.touched) && !this.selectedCountry;
  }

  get shouldShowPostalCode(): boolean {
    return this.postcodeEnabled;
  }

  get canSubmit(): boolean {
    return this.myForm.valid && !!this.selectedCountry && !this.isQuerying;
  }

  loadInitialOptions(refresher?: CustomEvent): void {
    this.isInitializing = true;
    this.hasLoadError = false;

    this.countryService.getCoutryList()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isInitializing = false;
          this.isLoaded = true;
          if (refresher?.target) {
            (refresher.target as HTMLIonRefresherElement).complete();
          }
        })
      )
      .subscribe({
        next: (countryList) => {
          this.countryList = Array.isArray(countryList) ? countryList : [];
          this.countrySearch = this.countryList.slice(0, 20);
        },
        error: () => {
          this.hasLoadError = true;
          this.countryList = [];
          this.countrySearch = [];
        },
      });
  }

  onRefresh(event: CustomEvent): void {
    this.loadInitialOptions(event);
  }

  onCountryFocus(): void {
    this.showCountryList = true;
    this.countrySearch = this.countryList.slice(0, 20);
  }

  filterCountryItems(ev: any): void {
    const val = (ev?.detail?.value || '').trim();

    this.countryControl?.markAsTouched();
    this.showCountryList = true;
    this.selectedCountry = null;

    if (val && val.trim() !== '') {
      this.countrySearch = this.countryList
        .filter((item) => item.Name.toLowerCase().includes(val.toLowerCase()))
        .slice(0, 20);
      return;
    }

    this.countrySearch = this.countryList.slice(0, 20);
  }

  countryItemClick(item: Country): void {
    if (!item) {
      return;
    }

    this.showCountryList = false;
    this.myForm.get('countryId')?.setValue(item.Name, { emitEvent: false });
    this.selectedCountry = item;
    this.myForm.get('city')?.setValue('', { emitEvent: false });
    this.clearAllEsdOptions();
    this.refreshPostcodeAvailability(item.Id);
  }

  onCountryKeyup(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.selectCountry();
      this.showCountryList = false;
    }
  }

  onCountryBlur(): void {
    setTimeout(() => {
      this.selectCountry();
      this.showCountryList = false;
    }, 140);
  }

  onCountryClear(): void {
    this.selectedCountry = null;
    this.countrySearch = this.countryList.slice(0, 20);
    this.postcodeEnabled = false;
    this.clearAllEsdOptions();
    this.myForm.get('postalCode')?.setValue('', { emitEvent: false });
    this.myForm.get('city')?.setValue('', { emitEvent: false });
  }

  selectCountry(): void {
    const inputValue = ((this.myForm.get('countryId')?.value || '') as string).trim();
    if (!inputValue) {
      this.selectedCountry = null;
      return;
    }

    const exactMatch = this.countryList.find((item) => item.Name.toLowerCase() === inputValue.toLowerCase());
    if (exactMatch) {
      this.countryItemClick(exactMatch);
      return;
    }

    if (this.countrySearch.length === 1) {
      this.countryItemClick(this.countrySearch[0]);
      return;
    }

    this.selectedCountry = null;
  }

  resetResult(): void {
    this.queryResult = null;
    this.queryErrorMessage = '';
  }

  retryQuery(): void {
    this.doQuery(this.myForm.value);
  }

  doQuery(formValue: any): void {
    this.hasSubmitted = true;
    this.selectCountry();

    if (!this.canSubmit) {
      this.showValidationToast('请选择有效国家后再查询');
      return;
    }

    const postalCode = this.postcodeEnabled ? (formValue?.postalCode || '').trim() : '';
    const city = (formValue?.city || '').trim();

    if (!postalCode && !city) {
      this.showValidationToast('请输入邮编或城市后再查询');
      return;
    }

    const requestBody = {
      ...formValue,
      countryId: this.selectedCountry?.Id,
      postalCode,
      city,
    };

    this.queryErrorMessage = '';
    this.queryResult = null;
    this.isQuerying = true;

    this.uiFeedback.presentLoading('正在查询...').then(loading => {
      this.service
        .Query(requestBody)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.isQuerying = false;
            this.uiFeedback.dismissLoading(loading);
          })
        )
        .subscribe({
          next: (res: RemoteQueryResponse) => {
            const items = this.mapResultItems(res?.Results || []);
            if (items.length > 0) {
              this.queryResult = {
                title: items.some(item => item.success && item.isRemote) ? '存在偏远运输方式' : '各运输方式结果',
                message: '当前查询仅供参考',
                success: true,
                isRemote: items.some(item => item.success && item.isRemote),
                items,
              };
              return;
            }

            this.queryResult = {
              title: '查询失败',
              message: res?.Message || '系统繁忙，请稍后重试。',
              success: false,
              isRemote: false,
              items: [],
            };
          },
          error: () => {
            this.queryErrorMessage = '网络异常，暂时无法完成查询，请稍后重试。';
          },
        });
    });
  }

  selectEsdOption(item: RemoteEsdOption): void {
    if (!item) {
      return;
    }

    if (item.City) {
      this.myForm.get('city')?.setValue(item.City, { emitEvent: false });
    }

    const currentPostcode = ((this.myForm.get('postalCode')?.value || '') as string).trim();
    if (this.postcodeEnabled && !currentPostcode && item.PostcodeLow) {
      this.myForm.get('postalCode')?.setValue(item.PostcodeLow, { emitEvent: false });
    }

    this.esdOptions = [];
    this.esdLookupMode = '';
  }

  private mapResultItems(results: Array<RemoteQueryItemResponse>): Array<RemoteQueryItemView> {
    return results.map((item) => {
      if (item.Status === 0 && item.IsRemote) {
        return {
          name: item.ModeOfTransportTypeName,
          statusText: '偏远',
          message: item.Message || '当前查询仅供参考',
          success: true,
          isRemote: true,
        };
      }

      if (item.Status === 0) {
        return {
          name: item.ModeOfTransportTypeName,
          statusText: '不偏远',
          message: item.Message || '当前查询仅供参考',
          success: true,
          isRemote: false,
        };
      }

      return {
        name: item.ModeOfTransportTypeName,
        statusText: '查询失败',
        message: item.Message || '系统繁忙，请稍后重试。',
        success: false,
        isRemote: false,
      };
    });
  }

  private bindEsdLookup(): void {
    this.myForm.get('postalCode')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((value) => {
        this.lookupEsdByPostcode(value);
      });

    this.myForm.get('city')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((value) => {
        this.lookupEsdByCity(value);
      });
  }

  private refreshPostcodeAvailability(countryId: number): void {
    this.postcodeEnabled = false;
    this.isCheckingPostcode = true;
    this.myForm.get('postalCode')?.setValue('', { emitEvent: false });

    this.service.CountryHasPostcode(countryId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isCheckingPostcode = false;
        })
      )
      .subscribe({
        next: (res) => {
          this.postcodeEnabled = !!(res && res.hasPostcode);
          if (!this.postcodeEnabled) {
            this.myForm.get('postalCode')?.setValue('', { emitEvent: false });
          }
        },
        error: () => {
          this.postcodeEnabled = true;
        },
      });
  }

  private lookupEsdByPostcode(value: string): void {
    const postcode = ((value || '') as string).trim();
    if (!this.selectedCountry || !this.postcodeEnabled || postcode.length < 3) {
      this.clearEsdOptions('postalCode');
      return;
    }

    this.service.GetESD({ CountryId: this.selectedCountry.Id, Postcode: postcode, City: '' })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const options = this.normalizeEsdOptions(res);
          this.esdLookupMode = 'postalCode';
          this.esdOptions = options;
          const cityList = Array.from(new Set(options.map(item => item.City).filter(city => !!city)));
          const currentCity = ((this.myForm.get('city')?.value || '') as string).trim();
          if (!currentCity && cityList.length === 1) {
            this.myForm.get('city')?.setValue(cityList[0], { emitEvent: false });
          }
        },
        error: () => {
          this.clearEsdOptions('postalCode');
        },
      });
  }

  private lookupEsdByCity(value: string): void {
    const city = ((value || '') as string).trim();
    if (!this.selectedCountry || city.length < 3) {
      this.clearEsdOptions('city');
      return;
    }

    const currentPostcode = this.postcodeEnabled ? ((this.myForm.get('postalCode')?.value || '') as string).trim() : '';
    const postcode = currentPostcode.length >= 3 ? currentPostcode : '';
    this.service.GetESD({ CountryId: this.selectedCountry.Id, City: city, Postcode: postcode })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.esdLookupMode = 'city';
          this.esdOptions = this.normalizeEsdOptions(res);
        },
        error: () => {
          this.clearEsdOptions('city');
        },
      });
  }

  private normalizeEsdOptions(res: any): Array<RemoteEsdOption> {
    return Array.isArray(res?.data) ? res.data.slice(0, 50) : [];
  }

  private clearEsdOptions(mode: 'postalCode' | 'city'): void {
    if (this.esdLookupMode === mode) {
      this.esdOptions = [];
      this.esdLookupMode = '';
    }
  }

  private clearAllEsdOptions(): void {
    this.esdOptions = [];
    this.esdLookupMode = '';
  }

  private async showValidationToast(msg: string): Promise<void> {
    await this.uiFeedback.presentToast(msg, 1800, 'top');
  }
}
