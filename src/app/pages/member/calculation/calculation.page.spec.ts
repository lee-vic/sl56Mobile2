import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CookieService } from 'ngx-cookie-service';

import { CalculationPage } from './calculation.page';

describe('CalculationPage', () => {
  let component: CalculationPage;
  let fixture: ComponentFixture<CalculationPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule, FormsModule, ReactiveFormsModule, IonicModule.forRoot()],
      providers: [CookieService],
      declarations: [ CalculationPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CalculationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to 不限 when switching to full mode', () => {
    component.modeOfTransportList = [
      { Id: 0, Name: '不限' },
      { Id: 1, Name: 'DHL' },
    ];

    component.segmentChanged({ detail: { value: '2' } } as any);

    expect(component.myForm.get('ModeOfTransportIdList')?.value).toBe(0);
  });

  it('should keep selected transport when switching to full mode', () => {
    component.modeOfTransportList = [
      { Id: 0, Name: '不限' },
      { Id: 2, Name: 'FEDEX' },
    ];
    component.myForm.get('ModeOfTransportIdList')?.setValue(2);

    component.segmentChanged({ detail: { value: '2' } } as any);

    expect(component.myForm.get('ModeOfTransportIdList')?.value).toBe(2);
  });

  it('should update selected template rules when toggling piece rule', () => {
    component.pieceTemplateRules = [{ ObjectName: '电池', ObjectId: 8, Checked: false }];
    component.sizes.at(0).get('PieceRules')?.setValue([
      { ObjectName: '电池', ObjectId: 8, Checked: false }
    ]);

    component.togglePieceRule(0, 0);

    const selected = component.sizes.at(0).get('SeletedTemplateRules')?.value;
    expect(selected).toEqual([8]);
  });

  it('should show country hint before selection', () => {
    component.selectedCountry = null;
    component.myForm.get('actualWeight')?.setValue('2');

    expect(component.submitHint).toBe('请先选择有效国家');
  });

  it('should stop reacting to piece changes after destroy', () => {
    component.myForm.get('piece')?.setValue(3);
    expect(component.sizes.length).toBe(3);

    component.ngOnDestroy();
    component.myForm.get('piece')?.setValue(5);

    expect(component.sizes.length).toBe(3);
  });

  // ── Country autocomplete ──

  it('should set selected country on exact name match', () => {
    component.countryList = [
      { Id: 1, Name: 'China', Code: 'CN' },
      { Id: 2, Name: 'United States', Code: 'US' },
    ];
    component.countrySearch = component.countryList;
    component.myForm.get('countryId')?.setValue('China');

    component.selectCountry();

    expect(component.selectedCountry).toEqual({ Id: 1, Name: 'China', Code: 'CN' });
    expect(component.showCountryList).toBe(false);
  });

  it('should auto-select when only one country matches', () => {
    component.countryList = [
      { Id: 1, Name: 'China', Code: 'CN' },
      { Id: 2, Name: 'Chile', Code: 'CL' },
    ];
    component.countrySearch = [{ Id: 1, Name: 'China', Code: 'CN' }];
    component.myForm.get('countryId')?.setValue('Chin');

    component.selectCountry();

    expect(component.selectedCountry).toEqual({ Id: 1, Name: 'China', Code: 'CN' });
  });

  it('should show validation error when no country matches', () => {
    component.countryList = [
      { Id: 1, Name: 'China', Code: 'CN' },
      { Id: 2, Name: 'Chile', Code: 'CL' },
    ];
    component.countrySearch = component.countryList;
    component.myForm.get('countryId')?.setValue('Mars');

    component.selectCountry();

    expect(component.selectedCountry).toBeNull();
    expect(component.hasCountryValidationError).toBe(true);
  });

  it('should filter country items on input', () => {
    component.countryList = [
      { Id: 1, Name: 'China', Code: 'CN' },
      { Id: 2, Name: 'United States', Code: 'US' },
      { Id: 3, Name: 'Chile', Code: 'CL' },
    ];

    component.filterCountryItems({ detail: { value: 'chi' } });

    expect(component.countrySearch.length).toBe(2);
    expect(component.countrySearch[0].Name).toBe('China');
    expect(component.selectedCountry).toBeNull();
    expect(component.showCountryList).toBe(true);
  });

  it('should reset country search on clear', () => {
    component.countryList = [
      { Id: 1, Name: 'China', Code: 'CN' },
      { Id: 2, Name: 'United States', Code: 'US' },
    ];

    component.onCountryClear();

    expect(component.countryInput).toBe('');
    expect(component.countrySearch).toEqual(component.countryList);
    expect(component.selectedCountry).toBeNull();
    expect(component.showCountryList).toBe(false);
    expect(component.hasCountryValidationError).toBe(false);
  });

  it('should set selected country on item click', () => {
    component.countryList = [{ Id: 1, Name: 'China', Code: 'CN' }];

    component.countryItemClick({ Id: 1, Name: 'China', Code: 'CN' });

    expect(component.selectedCountry).toEqual({ Id: 1, Name: 'China', Code: 'CN' });
    expect(component.showCountryList).toBe(false);
    expect(component.hasCountryValidationError).toBe(false);
  });

  it('should show "请先选择有效国家" when no country selected', () => {
    component.selectedCountry = null;
    component.myForm.get('actualWeight')?.setValue('2');
    component.myForm.get('countryId')?.setValue('');

    expect(component.submitHint).toBe('请先选择有效国家');
  });

  it('should show weight hint when country is valid but weight is missing', () => {
    component.selectedCountry = { Id: 1, Name: 'China', Code: 'CN' };
    component.myForm.get('countryId')?.setValue('China');
    component.myForm.get('actualWeight')?.setValue('');

    expect(component.submitHint).toBe('请输入有效重量');
  });

  it('should return empty submit hint when form is valid', () => {
    component.selectedCountry = { Id: 1, Name: 'China', Code: 'CN' };
    component.myForm.get('countryId')?.setValue('China');
    component.myForm.get('actualWeight')?.setValue('5');

    expect(component.submitHint).toBe('');
  });

  it('should show country list on focus', () => {
    component.countryList = [
      { Id: 1, Name: 'China', Code: 'CN' },
    ];
    component.countrySearch = component.countryList;
    component.showCountryList = false;

    component.onCountryFocus();

    expect(component.showCountryList).toBe(true);
  });

  it('should mark country as touched and select on blur', (done) => {
    component.countryList = [{ Id: 1, Name: 'China', Code: 'CN' }];
    component.countrySearch = component.countryList;
    component.myForm.get('countryId')?.setValue('China');

    component.onCountryBlur();

    expect(component.myForm.get('countryId')?.touched).toBe(true);

    setTimeout(() => {
      expect(component.selectedCountry).toEqual({ Id: 1, Name: 'China', Code: 'CN' });
      done();
    }, 150);
  });

  it('should select country on Enter key', () => {
    component.countryList = [{ Id: 1, Name: 'China', Code: 'CN' }];
    component.countrySearch = component.countryList;
    component.myForm.get('countryId')?.setValue('China');

    component.onCountryKeyup({ key: 'Enter' } as KeyboardEvent);

    expect(component.selectedCountry).toEqual({ Id: 1, Name: 'China', Code: 'CN' });
  });

  it('should not select country on non-Enter key', () => {
    component.countryList = [{ Id: 1, Name: 'China', Code: 'CN' }];
    component.myForm.get('countryId')?.setValue('China');

    component.onCountryKeyup({ key: 'a' } as KeyboardEvent);

    expect(component.selectedCountry).toBeUndefined();
  });
});
