import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, Validators, FormBuilder, FormArray } from '@angular/forms';
import { AlertController } from '@ionic/angular';
import { CalculationService } from 'src/app/providers/calculation.service';
import { CountryService } from 'src/app/providers/country.service';
import { CountryAutoCompleteService } from 'src/app/providers/country-auto-complete.service';
import { Router } from '@angular/router';
import { PieceRule } from 'src/app/interfaces/size';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { CalculationStateService } from 'src/app/providers/calculation-state.service';
import { UiFeedbackService } from 'src/app/providers/ui-feedback.service';

@Component({
  selector: "app-calculation",
  templateUrl: "./calculation.page.html",
  styleUrls: ["./calculation.page.scss"],
})
export class CalculationPage implements OnInit, OnDestroy {
  private readonly unlimitedTransportName = "不限";
  calculateMode = "1";
  countryList: Array<any> = [];
  pieceTemplateRules: Array<any> = [];
  modeOfTransportList: Array<any> = [];
  volumetricDivisorList: Array<any> = [];
  priceRuleTemplateInfoList: Array<any> = [];
  countrySearch: Array<any> = [];
  selectedCountry: any;
  countryInput = "";
  showCountryList: boolean = false;
  hasCountryValidationError: boolean = false;
  selectRuleIds: Array<number> = [];
  public myForm: FormGroup;
  public isSubmitting = false;
  private readonly destroy$ = new Subject<void>();

  constructor(
    public countryProvider: CountryService,
    public formBuilder: FormBuilder,
    private router: Router,
    private alertController: AlertController,
    public countryAutoCompleteService: CountryAutoCompleteService,
    private calculationState: CalculationStateService,
    private readonly uiFeedback: UiFeedbackService,

    public service: CalculationService
  ) {
    this.myForm = this.formBuilder.group({
      ModeOfTransportIdList: [""],
      ProductContentType: ["1", Validators.required],
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
    this.service.getModeOfTransportList().pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      this.modeOfTransportList = Array.isArray(res) ? res : [];
      this.applyDefaultTransportForFullMode();
    });
    this.service.getVolumetricDivisorList().pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      this.volumetricDivisorList = Array.isArray(res) ? res : [];
    });
    this.service.getPriceRuleTemplateInfoList().pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      this.priceRuleTemplateInfoList = Array.isArray(res) ? res : [];
    });
    this.service.GetPieceRuleTemplates().pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      this.pieceTemplateRules = Array.isArray(res) ? res : [];
      this.initializePieceRules();
    });
    this.countryProvider.getCoutryList().pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      const list = Array.isArray(res) ? res : [];
      this.countryList = list;
      this.countrySearch = list;
    });
    this.myForm.get("piece")?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((piece: number) => {
      if (piece == null || piece <= 0) {
        return;
      }

      if (piece < this.sizes.length) {
        for (let i = this.sizes.length; i > piece; i--) {
          this.sizes.removeAt(i - 1);
        }
      } else if (piece > this.sizes.length) {
        const diff = piece - this.sizes.length;
        for (let i = 0; i < diff; i++) {
          this.addSizeRow();
        }
      }
    });
    this.myForm.get("isEditSize")?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((isEditSize: boolean) => {
      this.applyWeightMode(!!isEditSize);
    });

    this.applyModeRules();
    this.applyWeightMode(false);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
      SeletedTemplateRules: [[]]
    });
  }

  private initializePieceRules() {
    this.sizes.controls.forEach((ctrl) => {
      ctrl.get("PieceRules")?.setValue(this.mapNewPieceRules, { emitEvent: false });
      ctrl.get("SeletedTemplateRules")?.setValue([], { emitEvent: false });
    });
  }

  private applyModeRules() {
    const transportControl = this.myForm.get("ModeOfTransportIdList");
    const isEditSizeControl = this.myForm.get("isEditSize");

    if (this.calculateMode === "2") {
      transportControl?.setValidators([Validators.required]);
      this.applyDefaultTransportForFullMode();
      isEditSizeControl?.enable({ emitEvent: false });
    } else {
      transportControl?.clearValidators();
      transportControl?.setValue("", { emitEvent: false });
      isEditSizeControl?.setValue(false, { emitEvent: false });
      isEditSizeControl?.disable({ emitEvent: false });
    }

    transportControl?.updateValueAndValidity({ emitEvent: false });
    this.applyWeightMode(!!isEditSizeControl?.value);
  }

  private applyDefaultTransportForFullMode() {
    if (this.calculateMode !== "2") {
      return;
    }

    const transportControl = this.myForm.get("ModeOfTransportIdList");
    const currentValue = transportControl?.value;
    const hasValue = currentValue !== null && currentValue !== undefined && currentValue !== "";
    if (hasValue) {
      return;
    }

    const unlimitedOption = this.modeOfTransportList.find((item) => item?.Name === this.unlimitedTransportName);
    if (unlimitedOption?.Id !== null && unlimitedOption?.Id !== undefined) {
      transportControl?.setValue(unlimitedOption.Id, { emitEvent: false });
    }
  }

  private applyWeightMode(isEditSize: boolean) {
    const actualWeightControl = this.myForm.get("actualWeight");
    const sizeMode = this.calculateMode === "2" && !!isEditSize;

    if (sizeMode) {
      this.sizes.enable({ emitEvent: false });
      actualWeightControl?.clearValidators();
      actualWeightControl?.setValue("", { emitEvent: false });
      actualWeightControl?.disable({ emitEvent: false });
    } else {
      this.sizes.disable({ emitEvent: false });
      actualWeightControl?.setValidators([Validators.required, Validators.min(0.01)]);
      actualWeightControl?.enable({ emitEvent: false });
    }

    actualWeightControl?.updateValueAndValidity({ emitEvent: false });
    this.sizes.updateValueAndValidity({ emitEvent: false });
  }

  get sizes() {
    return this.myForm.get("sizes") as FormArray;
  }

  get countryControl() {
    return this.myForm.get("countryId");
  }

  get actualWeightControl() {
    return this.myForm.get("actualWeight");
  }

  get isCountryErrorVisible() {
    return this.hasCountryValidationError || (!!this.countryControl && this.countryControl.touched && !this.selectedCountry);
  }

  get isWeightErrorVisible() {
    return !!this.actualWeightControl && this.actualWeightControl.touched && this.actualWeightControl.invalid;
  }

  get canSubmit() {
    return !this.isSubmitting && !this.submitHint;
  }

  get formProgress() {
    const requiredSteps = this.calculateMode === "2" ? 4 : 3;
    let completedSteps = 0;

    if (this.myForm.get("ProductContentType")?.valid) {
      completedSteps += 1;
    }
    if (this.selectedCountry) {
      completedSteps += 1;
    }
    if (this.isSizeMode ? this.sizes.valid : this.actualWeightControl?.valid) {
      completedSteps += 1;
    }
    if (this.calculateMode === "2" && this.myForm.get("ModeOfTransportIdList")?.valid) {
      completedSteps += 1;
    }

    return Math.min(completedSteps / requiredSteps, 1);
  }

  get formProgressLabel() {
    const percentage = Math.round(this.formProgress * 100);
    return `资料完成度 ${percentage}%`;
  }

  get isSizeMode() {
    return this.calculateMode === "2" && !!this.myForm.get("isEditSize")?.value;
  }

  get submitHint() {
    if (!this.selectedCountry) {
      return "请先选择有效国家";
    }
    if (this.isSizeMode && this.sizes.invalid) {
      return "请完善规格尺寸信息";
    }
    if (this.actualWeightControl?.enabled && this.actualWeightControl.invalid) {
      return "请输入有效重量";
    }
    if (this.myForm.invalid) {
      return "请完善必填信息后再计算";
    }
    return "";
  }

  private setSelectedCountry(item: any) {
    this.showCountryList = false;
    this.countryInput = item.Name;
    this.myForm.get("countryId")?.setValue(item.Name, { emitEvent: false });
    this.myForm.get("countryId")?.markAsTouched();
    this.selectedCountry = item;
    this.hasCountryValidationError = false;
  }

  onCountryFocus() {
    this.showCountryList = true;
  }

  filterCountryItems(ev: any) {
    const val = (
      ev?.detail?.value ??
      ev?.target?.value ??
      ev?.srcElement?.value ??
      ""
    ).toString();
    this.showCountryList = true;
    this.selectedCountry = null;
    this.hasCountryValidationError = false;
    if (val && val.trim() !== "") {
      this.countrySearch = this.countryList.filter(function (item) {
        return item.Name.toLowerCase().includes(val.toLowerCase());
      });
    } else {
      this.countrySearch = this.countryList;
    }
  }

  countryItemClick(item: any) {
    this.setSelectedCountry(item);
  }

  onCountryKeyup(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.selectCountry();
    }
  }
  onCountryBlur() {
    this.myForm.get("countryId")?.markAsTouched();
    setTimeout(() => this.selectCountry(), 120);
  }

  onCountryClear() {
    this.countrySearch = this.countryList;
    this.selectedCountry = null;
    this.showCountryList = false;
    this.hasCountryValidationError = false;
    this.myForm.get("countryId")?.setValue("", { emitEvent: false });
  }

  selectCountry() {
    const inputCountry = (this.myForm.get("countryId")?.value || "").toString().trim();
    if (!inputCountry) {
      this.selectedCountry = null;
      this.showCountryList = false;
      this.hasCountryValidationError = true;
      return;
    }

    const exactMatch = this.countryList?.find(
      (item) => item.Name.toLowerCase() === inputCountry.toLowerCase()
    );

    if (exactMatch) {
      this.setSelectedCountry(exactMatch);
      return;
    }

    if (this.countrySearch?.length === 1) {
      this.setSelectedCountry(this.countrySearch[0]);
      return;
    }

    this.selectedCountry = null;
    this.hasCountryValidationError = true;
  }

  private setRuleChecked(item: any, checked: boolean) {
    if (checked) {
      if (!this.selectRuleIds.includes(item.Id)) {
        this.selectRuleIds = [...this.selectRuleIds, item.Id];
      }
      return;
    }

    this.selectRuleIds = this.selectRuleIds.filter((p) => p !== item.Id);
  }

  toggleRule(item: any) {
    this.setRuleChecked(item, !this.isRuleChecked(item.Id));
  }

  isRuleChecked(ruleId: number) {
    return this.selectRuleIds.includes(ruleId);
  }

  private buildPayload() {
    const formValue = this.myForm.getRawValue();
    const payload: any = {
      ...formValue,
      countryId: this.selectedCountry?.Id,
      SeletedTemplateRules: this.selectRuleIds,
    };

    if (!this.isSizeMode || this.calculateMode === "1") {
      payload.sizes = [];
    }

    if (this.calculateMode === "1") {
      payload.ModeOfTransportIdList = "";
      payload.postalCode = "";
      payload.city = "";
      payload.declaredValue = "";
      payload.volumeWeight = "";
      payload.volumetric = "1";
    }

    return payload;
  }

  async doCalculate() {
    if (this.isSubmitting) {
      return;
    }

    if (!this.selectedCountry) {
      this.hasCountryValidationError = true;
      this.myForm.get("countryId")?.markAsTouched();
      const alert = await this.alertController.create({
        header: '信息不完整',
        message: '您输入的国家不正确，请重新输入',
        backdropDismiss: false,
        keyboardClose: false,
        buttons: [{ text: '确定', role: 'cancel' }],
      });
      await alert.present();
      return;
    }

    this.isSubmitting = true;
    const loading = await this.uiFeedback.presentLoading('正在计算报价，请稍候...');

    this.service
      .calculate(this.buildPayload())
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSubmitting = false;
          this.uiFeedback.dismissLoading(loading);
        })
      )
      .subscribe({
        next: async (res) => {
          if (Array.isArray(res) && res.length > 0) {
            this.calculationState.setCalculationResults(res);
            this.calculationState.clearCurrentDetail();
            this.router.navigateByUrl('/member/calculation/calculation-list');
            return;
          }

          await this.uiFeedback.presentToast('当前条件未能找到合适报价，请修改条件重试', 1800, 'middle', 'member-theme-toast');
        },
        error: async () => {
          await this.uiFeedback.presentToast('计算请求失败，请检查网络后重试', 1800, 'middle', 'member-theme-toast', 'danger');
        },
      });
  }

  submitFromFooter() {
    this.myForm.markAllAsTouched();
    this.selectCountry();
    if (!this.canSubmit) {
      return;
    }
    this.doCalculate();
  }

  private updatePieceRules(pieceIndex: number, ruleIndex: number, checked: boolean) {
    const sizeControl = this.sizes.at(pieceIndex);
    const pieceRules = ((sizeControl.get("PieceRules")?.value || []) as Array<any>).map((rule, index) => {
      if (index === ruleIndex) {
        return { ...rule, Checked: checked };
      }
      return rule;
    });
    const selectedTemplateRules = pieceRules
      .filter((rule) => !!rule.Checked)
      .map((rule) => rule.ObjectId);

    sizeControl.get("PieceRules")?.setValue(pieceRules);
    sizeControl.get("SeletedTemplateRules")?.setValue(selectedTemplateRules);
  }

  togglePieceRule(pieceIndex: number, ruleIndex: number) {
    const checked = !this.sizes.value[pieceIndex].PieceRules[ruleIndex].Checked;
    this.updatePieceRules(pieceIndex, ruleIndex, checked);
  }

  copyPreviousSize(pieceIndex: number) {
    if (pieceIndex <= 0) {
      return;
    }

    const previous = this.sizes.at(pieceIndex - 1);
    const current = this.sizes.at(pieceIndex);
    const valueFields = ["Piece", "Weight", "Length", "Width", "Height"];

    valueFields.forEach((field) => {
      current.get(field)?.setValue(previous.get(field)?.value);
    });

    const prevRules = (previous.get("PieceRules")?.value || []) as Array<any>;
    const clonedRules = prevRules.map((rule) => ({ ...rule }));
    const selectedIds = clonedRules.filter((rule) => rule.Checked).map((rule) => rule.ObjectId);

    current.get("PieceRules")?.setValue(clonedRules);
    current.get("SeletedTemplateRules")?.setValue(selectedIds);
  }

  sizePreview(pieceIndex: number) {
    const sizeGroup = this.sizes.at(pieceIndex);
    const weight = sizeGroup.get("Weight")?.value || "-";
    const length = sizeGroup.get("Length")?.value || "-";
    const width = sizeGroup.get("Width")?.value || "-";
    const height = sizeGroup.get("Height")?.value || "-";

    return `${weight}kg / ${length}x${width}x${height}cm`;
  }

  addSizeRow() {
    this.sizes.push(this.createSizeForm());
  }

  addSize() {
    const nextPiece = this.sizes.length + 1;
    this.myForm.get("piece")?.setValue(nextPiece);
  }

  removeSize() {
    const nextPiece = Math.max(1, this.sizes.length - 1);
    this.myForm.get("piece")?.setValue(nextPiece);
  }

  segmentChanged(ev: CustomEvent) {
    this.selectRuleIds = [];
    this.showCountryList = false;
    this.hasCountryValidationError = false;
    this.calculateMode = ev.detail.value as string;
    this.applyModeRules();
  }
}
