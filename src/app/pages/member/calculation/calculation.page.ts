import { Component, OnInit } from '@angular/core';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { ModalController, LoadingController, ToastController } from '@ionic/angular';
import { CalculationService } from 'src/app/providers/calculation.service';
import { CountryService } from 'src/app/providers/country.service';
import { CountryAutoCompleteService } from 'src/app/providers/country-auto-complete.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-calculation',
  templateUrl: './calculation.page.html',
  styleUrls: ['./calculation.page.scss'],
})
export class CalculationPage implements OnInit {
  calculateMode = "1";
  countryList: any;
  modeOfTransportList: any;
  volumetricDivisorList: any;
  priceRuleTemplateInfoList: any;
  countrySearch: any;
  modeOfTransportId: number;
  selectedCountry: any;
  countryInput: string;
  showCountryList: boolean = false;
  selectRuleIds: Array<number> = [];
  public myForm: FormGroup;
  public loading: any;



  constructor(
    public countryProvider: CountryService,
    public modalCtrl: ModalController,
    public formBuilder: FormBuilder,
    public loadingCtrl: LoadingController,
    public toastCtrl: ToastController,
    private router: Router,
    public countryAutoCompleteService: CountryAutoCompleteService,

    public service: CalculationService) {
    this.myForm = this.formBuilder.group({
      ModeOfTransportId: ['0', Validators.required],
      productType: ['1', Validators.required],
      countryId: ['', Validators.required],
      actualWeight: ['', Validators.required],
      volumeWeight: [],
      declaredValue: [],
      postalCode: [],
      city: [],
      volumetric: ['1']
    });
  }
  ngOnInit(): void {
    this.service.getModeOfTransportList().subscribe(res => {
      this.modeOfTransportList = res;
    });
    this.service.getVolumetricDivisorList().subscribe(res => {
      this.volumetricDivisorList = res;
    });
    this.service.getPriceRuleTemplateInfoList().subscribe(res => {
      this.priceRuleTemplateInfoList = res;
    });
    this.countryProvider.getCoutryList()
      .subscribe((res) => {
        this.countryList = this.countrySearch = res;
      });
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad CalculationPage');
  }



  filterCountryItems(ev) {
    let val = ev.srcElement["value"];
    this.showCountryList = true;
    this.selectedCountry = null;
    if (val && val.trim() !== '') {
      this.countrySearch = this.countryList.filter(function (item) {
        return item.Name.toLowerCase().includes(val.toLowerCase());
      });
    }
    else {
      this.countrySearch = this.countryList;
    }
  }

  countryItemClick(item) {
    this.showCountryList = false;
    this.countryInput = item.Name;
    this.selectedCountry = item;
  }

  onCountryKeyup($event) {
    let val = this.countryInput;
    if ($event.keyCode == 13) {
      this.selectCountry();
    }

  }
  onCountryBlur() {
    this.selectCountry();
  }
  selectCountry() {
    if (this.countrySearch.length == 1) {
      this.showCountryList = false;
      this.countryInput = this.countrySearch[0].Name;
      this.selectedCountry = this.countrySearch[0];
    }
  }
  ruleChanged(item: any, e: CustomEvent) {
    let checked = e.detail.checked;
    if (checked == true) {
      this.selectRuleIds.push(item.Id);
    }
    else {
      this.selectRuleIds = this.selectRuleIds.filter(p => p !== item.Id);
    }

    console.log(this.selectRuleIds);
  }
  doCalculate(formValue) {
    if (this.selectedCountry == null)
      return;
    this.loadingCtrl.create({
      message: '请稍后...',


    }).then((res) => res.present());

    formValue.countryId = this.selectedCountry.Id;
    formValue.selectRuleIds = this.selectRuleIds;
    console.log(formValue);
    this.service.calculate(formValue).subscribe((res) => {
      this.loadingCtrl.dismiss();


      if (res.length > 0) {
        localStorage.setItem("CalculationResult", JSON.stringify(res));
        this.router.navigateByUrl("/member/calculation/calculation-list");
        // this.navCtrl.push(UserCalculationListPage, {
        //   list: res
        // })
      }
      else {
        this.toastCtrl.create({
          message: '当前条件未能找到合适报价，请修改条件重试',
          position: 'middle',
          duration: 1500
        }).then((res => res.present()))

      }
    });
  }
  segmentChanged(ev) {
    this.selectRuleIds = []
  }


}
