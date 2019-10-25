import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { LoadingController, ToastController, AlertController } from '@ionic/angular';
import { CountryService } from 'src/app/providers/country.service';
import { RemoteService } from 'src/app/providers/remote.service';

@Component({
  selector: 'app-remote',
  templateUrl: './remote.page.html',
  styleUrls: ['./remote.page.scss'],
})
export class RemotePage implements OnInit {

  modeOfTransportTypeList: any;
  countryList: any;
  public myForm: FormGroup;
  countrySearch: any;
  selectedCountry: any;
  countryInput: string;
  showCountryList: boolean = false;

  constructor(
    public service: RemoteService,
    public countryService: CountryService,
    public formBuilder: FormBuilder,
    public loadingCtrl: LoadingController,
    public toastCtrl: ToastController,
    public alertCtrl: AlertController,
 
   
    ) {
    this.myForm = this.formBuilder.group({
      ModeOfTransportTypeId: ['1', Validators.required],
      countryId: ['', Validators.required],
      postalCode: [''],
      city: [''],
    });
  }

  ngOnInit(): void {
    this.service.getModeOfTransportTypeList().subscribe(res => {
      this.modeOfTransportTypeList = res;
    });
    this.countryService.getCoutryList().subscribe(res => {
      this.countryList = this.countrySearch = res;
    })
   
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad RemotePage');
  }
  filterCountryItems(ev: any) {
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
  doQuery(formValue) {
    formValue.countryId = this.selectedCountry.Id;
    console.log(formValue);
    this.service.Query(formValue).subscribe(res => {
      let title;
      if (res)
        title = "偏远";
      else
        title = "不偏远"
      this.alertCtrl.create({
        header: title,
        message: '当前查询仅供参考',
        buttons: ['返回']
      }).then(p=>p.present());
     
    });
  }
 
}
