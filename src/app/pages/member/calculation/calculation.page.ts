import { Component, OnInit } from '@angular/core';
import { FormGroup, Validators, FormBuilder, FormArray } from '@angular/forms';
import { ModalController, LoadingController, ToastController, AlertController } from '@ionic/angular';
import { CalculationService } from 'src/app/providers/calculation.service';
import { CountryService } from 'src/app/providers/country.service';
import { CountryAutoCompleteService } from 'src/app/providers/country-auto-complete.service';
import { Router } from '@angular/router';
import { PieceRule, Size } from 'src/app/interfaces/size';

@Component({
  selector: "app-calculation",
  templateUrl: "./calculation.page.html",
  styleUrls: ["./calculation.page.scss"],
})
export class CalculationPage implements OnInit {
  calculateMode = "1";
  countryList: any;
  pieceTemplateRules: Array<any> = [];
  modeOfTransportList: any;
  volumetricDivisorList: any;
  priceRuleTemplateInfoList: any;
  countrySearch: any;
  modeOfTransportId: number;
  selectedCountry: any;
  countryInput: string;
  showCountryList: boolean = false;
  selectRuleIds: Array<number> = [];
  // sizes: Array<Size> = [];
  public myForm: FormGroup;
  public sizeForm: FormGroup;
  public loading: any;

  constructor(
    public countryProvider: CountryService,
    public modalCtrl: ModalController,
    public formBuilder: FormBuilder,
    public loadingCtrl: LoadingController,
    public toastCtrl: ToastController,
    private router: Router,
    private alertController: AlertController,
    public countryAutoCompleteService: CountryAutoCompleteService,

    public service: CalculationService
  ) {
    this.myForm = this.formBuilder.group({
      ModeOfTransportId: ["0", Validators.required],
      productType: ["1", Validators.required],
      countryId: ["", Validators.required],
      actualWeight: ["", Validators.required],
      volumeWeight: [],
      declaredValue: [],
      postalCode: [],
      city: [],
      volumetric: ["1"],
      isEditSize: [false],
      sizes: this.formBuilder.array([this.createSizeForm()]),
      piece: [1, [Validators.required, Validators.min(1)]],
    });
  }
  ngOnInit(): void {
    this.service.getModeOfTransportList().subscribe((res) => {
      this.modeOfTransportList = res;
    });
    this.service.getVolumetricDivisorList().subscribe((res) => {
      this.volumetricDivisorList = res;
    });
    this.service.getPriceRuleTemplateInfoList().subscribe((res) => {
      this.priceRuleTemplateInfoList = res;
    });
    this.service.GetPieceRuleTemplates().subscribe((res) => {
      this.pieceTemplateRules = res;
      this.mapNewPieceRules.forEach((p) => {
        this.sizes.value[0].PieceRules.push(p);
      });
    });
    this.countryProvider.getCoutryList().subscribe((res) => {
      this.countryList = this.countrySearch = res;
    });
    this.myForm.get("piece").valueChanges.subscribe((piece) => {
      if (piece < 0) {
        return;
      }
      if (piece == null || piece == 0) {
        return;
      } else if (piece < this.sizes.length) {
        for (let i = this.sizes.length; i > piece; i--) {
          this.sizes.removeAt(i - 1);
        }
      } else if (piece > this.sizes.length) {
        let diff = piece - this.sizes.length;
        for (let i = 0; i < diff; i++) {
          this.addSize();
        }
      }
    });
    this.myForm.get("isEditSize").valueChanges.subscribe((isEditSize) => {
      //不输入尺寸时，跳过验证sizeform
      if (!isEditSize) {
        this.sizes.disable();
        this.myForm.get("actualWeight").enable();
      } else {
        //输入尺寸时，跳过实重验证
        this.sizes.enable();
        this.myForm.get("actualWeight").disable();
      }
    });
    //初始化时，默认不输入尺寸
    this.sizes.disable();
  }

  get mapNewPieceRules() {
    let templateRules = this.pieceTemplateRules.map(function (p) {
      let obj = new PieceRule();
      obj.ObjectName = p.ObjectName;
      obj.ObjectId = p.ObjectId;
      obj.Checked = p.Checked;
      return obj;
    });
    return templateRules;
  }

  private createSizeForm() {
    return this.formBuilder.group({
      Piece: [1, [Validators.required, Validators.min(1)]],
      Weight: [1, [Validators.required, Validators.min(1)]],
      Length: [1, [Validators.required, Validators.min(1)]],
      Width: [1, [Validators.required, Validators.min(1)]],
      Height: [1, [Validators.required, Validators.min(1)]],
      PieceRules: [this.mapNewPieceRules],
      SelectedPriceRuleTemplateIds: [[]]
    });
  }
  ionViewDidLoad() {
    console.log("ionViewDidLoad CalculationPage");
  }

  get sizes() {
    console.log("getSizes:", this.myForm.get("sizes"));
    return this.myForm.get("sizes") as FormArray;
  }

  filterCountryItems(ev) {
    let val = ev.srcElement["value"];
    this.showCountryList = true;
    this.selectedCountry = null;
    if (val && val.trim() !== "") {
      this.countrySearch = this.countryList.filter(function (item) {
        return item.Name.toLowerCase().includes(val.toLowerCase());
      });
    } else {
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
    } else {
      this.selectRuleIds = this.selectRuleIds.filter((p) => p !== item.Id);
    }

    console.log(this.selectRuleIds);
  }
  doCalculate(formValue) {
    console.log("calculateMode", this.calculateMode);
    console.log(formValue);
    if (this.selectedCountry == null) {
      this.alertController.create({
        header: '信息不完整',
        message: "您输入的国家不正确，请重新输入",
        backdropDismiss: false,
        keyboardClose: false,
        buttons: [
          {
            text: '确定',
            role: 'cancel'
          }
        ]
      }).then(p => p.present());
    }
    else {
      this.loadingCtrl
        .create({
          message: "请稍后...",
        })
        .then((res) => res.present());
      if (this.sizes.status == "DISABLED" || this.calculateMode == "1") {
        formValue.sizes = [];
      }
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
        } else {
          this.toastCtrl
            .create({
              message: "当前条件未能找到合适报价，请修改条件重试",
              position: "middle",
              duration: 1500,
            })
            .then((res) => res.present());
        }
      });
    }
  }
  checkPieceRule(pieceIndex, ruleIndex) {
    this.sizes.value[pieceIndex].PieceRules[ruleIndex].Checked = !this.sizes.value[pieceIndex].PieceRules[ruleIndex].Checked;
    //清空已选择的id
    this.sizes.value[pieceIndex].SelectedPriceRuleTemplateIds.splice(0, this.sizes.value[pieceIndex].SelectedPriceRuleTemplateIds.length);
    //重新添加已选择的id
    this.sizes.value[pieceIndex].PieceRules.filter(p => p.Checked).map(p => p.ObjectId).forEach(p => {
      this.sizes.value[pieceIndex].SelectedPriceRuleTemplateIds.push(p);
    });
  }
  addSize() {
    this.sizes.push(this.createSizeForm());
  }
  removeSize() {
    let lastSizeIndex = this.sizes.length - 1;
    this.sizes.removeAt(lastSizeIndex);
  }
  segmentChanged(ev) {
    this.selectRuleIds = [];
    if (ev.detail.value == "1") this.myForm.get("actualWeight").enable();
    else if (this.myForm.value.isEditSize)
      this.myForm.get("actualWeight").disable();
  }
}
