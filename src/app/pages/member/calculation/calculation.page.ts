import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators, FormBuilder, FormArray } from '@angular/forms';
import { AlertController } from '@ionic/angular';
import { CalculationService } from 'src/app/providers/calculation.service';
import { CountryService } from 'src/app/providers/country.service';
import { CountryAutoCompleteService } from 'src/app/providers/country-auto-complete.service';
import { Router } from '@angular/router';
import { PieceRule } from 'src/app/interfaces/size';
import { InquiryResult, InquirySize } from 'src/app/interfaces/quote-inquiry';
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
  private viewRevision = 0;
  private readonly leavePage$ = new Subject<void>();
  private readonly destroy$ = new Subject<void>();

  readonly inquiryText = new FormControl('', { nonNullable: true });
  inquiryOpen = false;
  parsing = false;
  calculating = false;
  inquiryError = '';
  inquiryNotice = '';
  advancedOpen = true;
  expressProductId: number | null = null;
  private inquiryPieceCount: number | null = null;
  private expressTransports: InquiryResult['Transports'] = [];
  private pendingInquiry: InquiryResult | null = null;
  private readonly cancelParsing$ = new Subject<void>();

  get visibleTransports() {
    return this.expressProductId === null ? this.modeOfTransportList : this.expressTransports;
  }

  openInquiry() {
    this.inquiryError = '';
    this.inquiryText.reset();
    this.inquiryOpen = true;
  }

  closeInquiry() {
    this.cancelParsing$.next();
    this.inquiryOpen = false;
  }

  finishInquiryDismissal() {
    const result = this.pendingInquiry;
    this.pendingInquiry = null;
    // 等输入弹层完全关闭再显示计价加载层，避免两个弹层同时管理页面焦点。
    if (result) this.applyInquiry(result);
  }

  ionViewWillLeave() {
    this.viewRevision++;
    this.leavePage$.next();
    this.pendingInquiry = null;
    this.closeInquiry();
  }

  inquiryKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing && event.keyCode !== 229) {
      event.preventDefault();
      if (!event.repeat) this.parseInquiry();
    }
  }

  parseInquiry() {
    const text = this.inquiryText.value.trim();
    if (!text || text.length > 4000 || this.parsing || this.calculating) return;
    this.parsing = true;
    this.inquiryError = '';
    this.service.parseInquiry(text).pipe(takeUntil(this.cancelParsing$), takeUntil(this.destroy$),
      finalize(() => this.parsing = false)).subscribe({
      next: result => {
        // 国际快递的产品编号为 0，也是有效的计价条件。
        if (!result?.Draft || !Array.isArray(result.Draft.Sizes) || !Number.isInteger(result.ProductId) || !Array.isArray(result.Transports)) {
          this.inquiryError = '未能读取询价信息，请重试或手动填写。';
          return;
        }
        this.pendingInquiry = result;
        this.inquiryOpen = false;
      },
      error: err => this.inquiryError = err.error?.Message || '未能识别这票询价，请重试或手动填写。'
    });
  }

  private applyInquiry({ Draft: draft, ProductId, Transports }: InquiryResult) {
    const issues = [...(draft.ReviewMessages || [])];
    const text = (value: string) => (value || '').trim().toUpperCase();
    const country = text(draft.CountryName);
    const matches = this.countryList.filter(item => {
      const name = text(item.Name);
      const space = name.indexOf(' ');
      return country && (name === country || text(item.Code) === country ||
        (space >= 0 && (name.slice(0, space) === country || name.slice(space + 1) === country)));
    });
    this.onCountryClear();
    if (matches.length === 1) this.setSelectedCountry(matches[0]);
    else issues.push('请选择目的国家');

    this.calculationState.clearAll();
    this.expressProductId = ProductId;
    this.inquiryPieceCount = Number.isInteger(draft.Piece) && draft.Piece > 0 ? draft.Piece : null;
    this.expressTransports = Transports;
    const previous = this.myForm.get('ModeOfTransportIdList').value;
    const requested = [...new Set((draft.ModeOfTransportNames || []).map(text).filter(n => n && n !== '不限'))];
    const channels = requested.length ? Transports.filter(t => requested.includes(text(t.Name))) :
      Transports.filter(t => String(t.Id) === String(previous || 0));
    const channel = requested.length <= 1 && channels.length === 1 ? channels[0] : null;
    if (!channel) issues.push('请在运输方式中选择本票使用的渠道');
    if (draft.ProductTypeNames?.some(n => n !== '不限' && n !== '国际快递')) issues.push('请确认这票货物适用国际快递');

    const sizes = this.inquirySizes(draft.Sizes, draft.ActualWeight, draft.Piece, issues);
    const hasExtras = !!(draft.PostalCode || draft.City || draft.DeclaredValue != null || draft.Sizes.length);
    if (hasExtras || requested.length || !channel) this.calculateMode = '2';
    this.applyModeRules();
    this.advancedOpen = hasExtras;
    let dollars: number | null = null;
    if (draft.DeclaredValue != null) {
      if (text(draft.DeclaredCurrency) === 'USD' && draft.DeclaredValue >= 0) dollars = draft.DeclaredValue;
      else issues.push('请核对申报价值 ' + draft.DeclaredValue + ' ' + (draft.DeclaredCurrency || '（币种未知）') + '，按美元填写');
    }
    // 移动表单的 piece 控件决定规格行数，每行 Piece 才是该规格的实际件数。
    this.sizes.clear();
    this.addSizeRow();
    this.myForm.patchValue({ piece: Math.max(1, sizes.length), isEditSize: !!sizes.length,
      postalCode: draft.PostalCode || '', city: draft.City || '', declaredValue: dollars,
      volumeWeight: '', volumetric: '1', ModeOfTransportIdList: channel?.Id ?? '' });
    sizes.forEach((row, index) => {
      const group = this.sizes.at(index);
      group.get('Weight').setValidators([Validators.required, Validators.min(0.0001)]);
      const dimension = (value: number) => Number.isInteger(value) && value > 0 && value <= 999 ? value : null;
      group.patchValue({ Piece: Number.isInteger(row.Piece) && row.Piece > 0 && row.Piece <= 2147483647 ? row.Piece : null,
        Weight: row.Weight > 0 ? row.Weight : null, Length: dimension(row.Length), Width: dimension(row.Width), Height: dimension(row.Height) });
    });
    // 规格模式下也保存本票实重，客户切回按实重时可以继续使用。
    this.actualWeightControl.setValue(draft.ActualWeight > 0 ? draft.ActualWeight : '');
    const cargo = text(draft.ProductContentTypeName);
    if (cargo === 'DOC' || cargo === 'WPX') this.myForm.get('ProductContentType').setValue(cargo === 'DOC' ? '0' : '1');
    const prepaid = draft.ExcludesDutyPrepayment && this.priceRuleTemplateInfoList.find(
      rule => rule.Name === '关税预付' && this.isRuleChecked(rule.Id));
    if (prepaid) issues.push('原文说明不用关税预付，当前已勾选，请核对后查询');
    if (draft.CargoAttributeNames?.length) {
      this.selectRuleIds = prepaid ? [prepaid.Id] : [];
      issues.push('请核对整票属性并按需勾选：' + draft.CargoAttributeNames.join('、'));
    }
    const note = !draft.Sizes.length && draft.Piece > 1 ? '共 ' + draft.Piece + ' 件，按整票实重查询。' : '';
    this.inquiryNotice = issues.join('；') + (issues.length ? '。' : '') + note;
    if (!issues.length && this.canSubmit) {
      void this.doCalculate(note);
    }
  }

  private inquirySizes(rows: InquirySize[], weight: number, count: number, issues: string[]) {
    let totalWeight = 0;
    let totalPieces = 0;
    let complete = true;
    rows.forEach((row, index) => {
      if (row.CargoAttributeNames?.length) issues.push('请核对第 ' + (index + 1) + ' 行单件属性：' + row.CargoAttributeNames.join('、'));
      complete = complete && Number.isInteger(row.Piece) && row.Piece > 0 && row.Piece <= 2147483647 && row.Weight > 0 &&
        [row.Length, row.Width, row.Height].every(n => Number.isInteger(n) && n > 0 && n <= 999);
      totalPieces += row.Piece;
      totalWeight += row.Weight * row.Piece;
    });
    if (!complete) issues.push('请核对每行的件数、实重和长宽高');
    else if (rows.length && ((weight > 0 && Math.round(weight * 10000) !== Math.round(totalWeight * 10000)) ||
      (count != null && totalPieces !== count))) {
      issues.push('按件合计与整票重量或件数不一致，请核对后重填规格或仅按实重查询');
      return [];
    }
    return rows;
  }

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

    const unlimitedOption = this.visibleTransports.find((item) => item?.Name === this.unlimitedTransportName);
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
      if (this.expressProductId === null) actualWeightControl?.setValue("", { emitEvent: false });
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
    return !this.submitHint;
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

    if (this.expressProductId !== null) payload.ProductTypeIdList = String(this.expressProductId);

    if (!this.isSizeMode || this.calculateMode === "1") {
      payload.sizes = [];
    } else {
      // 按件计价只提交明细重量，暂存的整票实重留给界面切换。
      payload.actualWeight = "";
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

  async doCalculate(pieceNotice = '') {
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

    if (this.calculating) return;
    this.calculating = true;
    const revision = this.viewRevision;
    const loading = await this.uiFeedback.presentLoading('正在计算报价，请稍候...');
    // Ionic 会缓存查价页，离开后到达的报价不能把客户带回结果页。
    if (revision !== this.viewRevision) {
      this.calculating = false;
      await this.uiFeedback.dismissLoading(loading);
      return;
    }

    const payload = this.buildPayload();
    // 规格模式统计本次提交的明细，按实重时优先采用该票识别出的总件数。
    const forecastPieces = payload.sizes.length
      ? payload.sizes.reduce((sum, row) => sum + Number(row.Piece), 0)
      : this.inquiryPieceCount ?? (payload.piece || 1);
    this.service
      .calculate(payload)
      .pipe(
        takeUntil(this.leavePage$),
        takeUntil(this.destroy$),
        finalize(() => {
          this.calculating = false;
          this.uiFeedback.dismissLoading(loading);
        })
      )
      .subscribe({
        next: async (res) => {
          if (Array.isArray(res) && res.length > 0) {
            const selectedRules = this.priceRuleTemplateInfoList.filter(rule => payload.SeletedTemplateRules.includes(rule.Id))
              .map(rule => rule.Name as string);
            this.calculationState.forecastParameters = { country: payload.countryId, type: payload.ProductContentType,
              weight: payload.actualWeight || (payload.sizes || []).reduce((sum, row) => sum + Number(row.Piece) * Number(row.Weight), 0),
              piece: forecastPieces, postal: payload.postalCode || '',
              value: payload.declaredValue ?? '', prepaid: Number(selectedRules.includes('关税预付')),
              separate: Number(selectedRules.includes('单独报关')), vat: Number(selectedRules.includes('开专票')),
              battery: selectedRules.find(code => ['PI966', 'PI967', 'PI969', 'PI970'].includes(code)) || '' };
            this.calculationState.setCalculationResults(res);
            this.calculationState.clearCurrentDetail();
            this.router.navigateByUrl('/member/calculation/calculation-list');
            if (pieceNotice) void this.uiFeedback.presentToast(pieceNotice);
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

  restoreManualScope() {
    this.expressProductId = null;
    this.inquiryPieceCount = null;
    this.advancedOpen = true;
    this.inquiryNotice = '';
  }

  segmentChanged(ev: CustomEvent) {
    this.restoreManualScope();
    this.selectRuleIds = [];
    this.showCountryList = false;
    this.hasCountryValidationError = false;
    this.calculateMode = ev.detail.value as string;
    this.applyModeRules();
  }
}
