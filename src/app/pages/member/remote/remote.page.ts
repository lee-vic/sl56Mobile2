import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin, Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { Country } from 'src/app/interfaces/country';
import { CountryService } from 'src/app/providers/country.service';
import { RemoteService } from 'src/app/providers/remote.service';
import { UiFeedbackService } from 'src/app/providers/ui-feedback.service';

interface ModeOfTransportType {
  Id: number;
  Name: string;
}

interface RemoteQueryResponse {
  Status: number;
  IsRemote: boolean;
  Message: string;
}

interface RemoteQueryResultView {
  title: string;
  message: string;
  success: boolean;
  isRemote: boolean;
}

@Component({
  selector: 'app-remote',
  templateUrl: './remote.page.html',
  styleUrls: ['./remote.page.scss'],
})
export class RemotePage implements OnInit, OnDestroy {
  modeOfTransportTypeList: Array<ModeOfTransportType> = [];
  countryList: Array<Country> = [];
  countrySearch: Array<Country> = [];

  myForm: FormGroup;
  selectedCountry: Country | null = null;
  showCountryList = false;

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
      ModeOfTransportTypeId: ['', Validators.required],
      countryId: ['', Validators.required],
      postalCode: [''],
      city: [''],
    });
  }

  ngOnInit(): void {
    this.loadInitialOptions();
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
    const usePostalCodeRaw = (this.selectedCountry as any)?.UsePostalcode;
    if (!this.selectedCountry || usePostalCodeRaw === undefined || usePostalCodeRaw === null) {
      return true;
    }

    const value = usePostalCodeRaw;
    return value === true || value === 1 || value === '1';
  }

  get canSubmit(): boolean {
    return this.myForm.valid && !!this.selectedCountry && !this.isQuerying;
  }

  loadInitialOptions(refresher?: CustomEvent): void {
    this.isInitializing = true;
    this.hasLoadError = false;

    forkJoin({
      modeList: this.service.getModeOfTransportTypeList(),
      countryList: this.countryService.getCoutryList(),
    })
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
        next: ({ modeList, countryList }) => {
          this.modeOfTransportTypeList = Array.isArray(modeList) ? modeList : [];
          this.countryList = Array.isArray(countryList) ? countryList : [];
          this.countrySearch = this.countryList.slice(0, 20);

          if (!this.myForm.get('ModeOfTransportTypeId')?.value && this.modeOfTransportTypeList.length > 0) {
            this.myForm.get('ModeOfTransportTypeId')?.setValue(this.modeOfTransportTypeList[0].Id);
          }
        },
        error: () => {
          this.hasLoadError = true;
          this.modeOfTransportTypeList = [];
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

    if (!this.shouldShowPostalCode) {
      this.myForm.get('postalCode')?.setValue('');
    }
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

    const requestBody = {
      ...formValue,
      countryId: this.selectedCountry?.Id,
      postalCode: (formValue?.postalCode || '').trim(),
      city: (formValue?.city || '').trim(),
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
            if (res?.Status === 0) {
              this.queryResult = {
                title: res.IsRemote ? '偏远' : '不偏远',
                message: '当前查询仅供参考',
                success: true,
                isRemote: !!res.IsRemote,
              };
              return;
            }

            this.queryResult = {
              title: '查询失败',
              message: res?.Message || '系统繁忙，请稍后重试。',
              success: false,
              isRemote: false,
            };
          },
          error: () => {
            this.queryErrorMessage = '网络异常，暂时无法完成查询，请稍后重试。';
          },
        });
    });
  }

  private async showValidationToast(msg: string): Promise<void> {
    await this.uiFeedback.presentToast(msg, 1800, 'top');
  }
}
