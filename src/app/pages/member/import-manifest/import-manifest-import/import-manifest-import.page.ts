import { Component, OnInit } from '@angular/core';
import { AlertController, NavController, ToastController } from '@ionic/angular';
import { ImportManifestService } from 'src/app/providers/import-manifest.service';
import { ImportManifestDomainService } from 'src/app/providers/import-manifest-domain.service';
import {
  AvailableCustomerPriceItem,
  BatteryModelOption,
  DropdownOption,
  ImportManifestSaveRequest,
  ImportPreviewRow,
  ImportRowModel,
  ImportRowsValidationResult,
} from 'src/app/interfaces/import-manifest';
import { forkJoin } from 'rxjs';

interface ImportPreviewUiRow extends ImportPreviewRow {
  Selected?: boolean;
  IsEditing?: boolean;
  IsDirty?: boolean;
  EditModel?: Partial<ImportPreviewRow>;
  IsExpanded?: boolean;
}

type ImportFilterMode = 'actionable' | 'valid' | 'modified' | 'all' | 'errors';
type BatchSetMode = 'country' | 'price' | 'contentType' | 'customs' | 'duty' | null;

@Component({
  selector: 'app-import-manifest-import',
  templateUrl: './import-manifest-import.page.html',
  styleUrls: ['./import-manifest-import.page.scss'],
})
export class ImportManifestImportPage implements OnInit {
  currentStep = 1;

  selectedFile: File | null = null;
  selectedFileName = '';
  isParsing = false;
  parseError = '';

  previewRows: ImportPreviewUiRow[] = [];
  filteredRows: ImportPreviewUiRow[] = [];
  activeFilter: ImportFilterMode = 'all';
  activeErrorCategory = '';
  summary = { totalRows: 0, validRows: 0, errorRows: 0, modifiedRows: 0 };
  parseMessage = '';
  errorCategories: { key: string; text: string; count: number; firstIndex: number }[] = [];

  isSaving = false;
  isValidatingRows = false;
  saveResult: { success: boolean; message: string; count: number } | null = null;

  countryOptions: DropdownOption[] = [];
  priceOptions: DropdownOption[] = [];
  batteryModelOptions: BatteryModelOption[] = [];
  isReferenceLoading = false;

  batchMode: BatchSetMode = null;
  isBatchSheetOpen = false;
  batchCountryId: number | null = null;
  batchPriceCode = '';
  batchContentType: number | null = null;
  batchCustomsMode: 'none' | 'common' | 'special' | null = null;
  batchDutyValue: boolean | null = null;

  editingRow: ImportPreviewUiRow | null = null;
  availableEditPrices: DropdownOption[] = [];
  isEditPriceLoading = false;
  editPriceMessage = '';
  editPriceMessageIsError = false;
  private editPriceReloadTimer: any = null;
  private editPriceRequestSeq = 0;
  errorCursor = -1;

  constructor(
    public service: ImportManifestService,
    public domain: ImportManifestDomainService,
    private alertCtrl: AlertController,
    private navCtrl: NavController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.loadReferenceData();
  }

  get contentTypeOptions() {
    return this.domain.contentTypeOptions;
  }

  loadReferenceData() {
    this.isReferenceLoading = true;
    forkJoin([
      this.service.getCountryOptions(),
      this.service.getCustomerPriceOptions(),
      this.service.getBatteryModelOptions(),
    ]).subscribe({
      next: ([countries, prices, batteryModels]) => {
        this.countryOptions = countries || [];
        this.priceOptions = prices || [];
        this.batteryModelOptions = batteryModels || [];
        this.isReferenceLoading = false;
      },
      error: () => {
        this.isReferenceLoading = false;
        this.showAlert('加载失败', '国家、报价等基础数据加载失败，请返回后重试');
      },
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const fileName = file.name.toLowerCase();

      if (!fileName.endsWith('.csv') && !fileName.endsWith('.xls') && !fileName.endsWith('.xlsx')) {
        this.showAlert('文件格式错误', '仅支持 .csv、.xls、.xlsx 格式');
        input.value = '';
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        this.showAlert('文件过大', '文件不能超过 5 MB，请压缩或分批导入');
        input.value = '';
        return;
      }

      this.selectedFile = file;
      this.selectedFileName = file.name;
      this.parseError = '';
      this.parseFile();
    }
  }

  parseFile() {
    if (!this.selectedFile) return;

    this.isParsing = true;
    this.parseError = '';

    const formData = new FormData();
    formData.append('file', this.selectedFile, this.selectedFile.name);

    this.service.parseImport(formData).subscribe({
      next: (res) => {
        this.isParsing = false;
        if (res.Success) {
          this.previewRows = (res.Rows || []).map((r) => ({
            ...r,
            Selected: false,
            IsEditing: false,
            IsDirty: false,
            IsExpanded: false,
            Errors: r.Errors || [],
            HasError: !!r.HasError,
          }));
          this.parseMessage = res.Message || '';
          this.errorCursor = -1;
          this.recalculateSummary();
          this.applyFilter(this.summary.errorRows > 0 ? 'actionable' : 'valid');
          this.currentStep = 2;
        } else {
          this.parseError = res.Message || '文件解析失败';
        }
      },
      error: () => {
        this.isParsing = false;
        this.parseError = '网络错误，文件解析失败，请重试';
      },
    });
  }

  downloadTemplate() {
    this.service.downloadTemplate().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '自助预报清单.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.showAlert('下载失败', '模板下载失败，请稍后重试');
      },
    });
  }

  applyFilter(filter: ImportFilterMode) {
    const normalizedFilter: ImportFilterMode = filter === 'errors' ? 'actionable' : filter;
    this.activeFilter = normalizedFilter;
    this.activeErrorCategory = '';
    if (normalizedFilter === 'actionable') {
      this.filteredRows = this.previewRows.filter((r) => r.HasError);
    } else if (normalizedFilter === 'valid') {
      this.filteredRows = this.previewRows.filter((r) => !r.HasError);
    } else if (normalizedFilter === 'modified') {
      this.filteredRows = this.previewRows.filter((r) => r.IsDirty);
    } else {
      this.filteredRows = [...this.previewRows];
    }
  }

  applyErrorCategory(group: { key: string; firstIndex: number }) {
    this.activeFilter = 'actionable';
    this.activeErrorCategory = group.key;
    this.filteredRows = this.previewRows.filter((row) => row.HasError && this.rowHasErrorCategory(row, group.key));
    this.errorCursor = group.firstIndex - 1;
  }

  jumpToNextError() {
    const errorIndexes = this.previewRows
      .map((row, index) => ({ row, index }))
      .filter((x) => x.row.HasError)
      .map((x) => x.index);

    if (errorIndexes.length === 0) {
      this.showToast('当前没有错误行');
      return;
    }

    const next = errorIndexes.find((idx) => idx > this.errorCursor) ?? errorIndexes[0];
    this.errorCursor = next;
    this.applyFilter('actionable');
    setTimeout(() => {
      document.getElementById(`import-row-${next}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
  }

  private getCurrentPriceOption(code: string): DropdownOption | null {
    const normalizedCode = (code || '').trim().toUpperCase();
    if (!normalizedCode) return null;
    const existing = this.priceOptions.find((p) => (p.Code || '').toUpperCase() === normalizedCode);
    if (existing) return existing;
    return { Id: 0, Code: normalizedCode, Name: normalizedCode };
  }

  private mapAvailablePriceItem(item: AvailableCustomerPriceItem): DropdownOption | null {
    const code = ((item.value || item.Value || '') as string).trim().toUpperCase();
    if (!code) return null;

    const text = ((item.text || item.Text || code) as string).trim();
    const codePrefix = code + '-';
    const name = text.toUpperCase().indexOf(codePrefix) === 0
      ? text.substring(codePrefix.length)
      : text;

    return { Id: 0, Code: code, Name: name || code };
  }

  private hasRequiredEditPriceParams(model: Partial<ImportPreviewRow> | undefined): boolean {
    if (!model) return false;
    const piece = Number(model.Piece);
    const weight = Number(model.Weight);
    const contentType = Number(model.ContentType);
    return !!Number(model.CountryId) && piece > 0 && weight > 0 && (contentType === 0 || contentType === 1);
  }

  private buildEditPriceRequest(): ImportManifestSaveRequest | null {
    const model = this.editingRow?.EditModel;
    if (!model) return null;

    const rawDeclaredValue = model.DeclaredValue as any;
    const declaredValue = rawDeclaredValue === null || rawDeclaredValue === undefined || rawDeclaredValue === ''
      ? undefined
      : Number(rawDeclaredValue);

    return {
      ObjectNo: (model.ObjectNo || '').trim().toUpperCase(),
      CountryId: Number(model.CountryId) || 0,
      CustomerPriceName: (model.CustomerPriceName || '').trim().toUpperCase(),
      Piece: Number(model.Piece) || 0,
      Weight: Number(model.Weight) || 0,
      ContentType: Number(model.ContentType),
      PostalCode: (model.PostalCode || '').trim(),
      DeclaredValue: Number.isFinite(declaredValue as number) ? declaredValue : undefined,
      CustomerExpressNo: (model.CustomerExpressNo || '').trim(),
      RequiresSeparateCustomsDeclaration: !!model.RequiresSeparateCustomsDeclaration || !!model.RequiresSpecialVatInvoice,
      RequiresDutiesAndTaxesPrepayment: !!model.RequiresDutiesAndTaxesPrepayment,
      RequiresSpecialVatInvoice: !!model.RequiresSpecialVatInvoice,
      BatteryModel: (model.BatteryModel || '').trim().toUpperCase(),
    };
  }

  private setEditPriceMessage(message: string, isError = false) {
    this.editPriceMessage = message || '';
    this.editPriceMessageIsError = !!isError;
  }

  private resetEditPriceOptions(message: string, isError = true) {
    this.availableEditPrices = [];
    if (this.editingRow?.EditModel) {
      this.editingRow.EditModel.CustomerPriceName = '';
    }
    this.setEditPriceMessage(message, isError);
  }

  private cancelEditPriceReload() {
    if (this.editPriceReloadTimer) {
      clearTimeout(this.editPriceReloadTimer);
      this.editPriceReloadTimer = null;
    }
    this.editPriceRequestSeq++;
    this.isEditPriceLoading = false;
  }

  scheduleEditPriceReload(delay = 300) {
    if (!this.editingRow?.EditModel) return;
    if (this.editPriceReloadTimer) {
      clearTimeout(this.editPriceReloadTimer);
    }

    if (this.hasRequiredEditPriceParams(this.editingRow.EditModel)) {
      this.isEditPriceLoading = true;
      this.setEditPriceMessage('报价计算中...', false);
    } else {
      this.isEditPriceLoading = false;
    }

    this.editPriceReloadTimer = setTimeout(() => {
      this.editPriceReloadTimer = null;
      this.loadEditAvailablePrices();
    }, delay);
  }

  private loadEditAvailablePrices() {
    const request = this.buildEditPriceRequest();
    if (!request || !this.editingRow?.EditModel) return;

    if (!this.hasRequiredEditPriceParams(this.editingRow.EditModel)) {
      this.editPriceRequestSeq++;
      this.isEditPriceLoading = false;
      this.resetEditPriceOptions('请先填写目的国、件数、重量和货物类型');
      return;
    }

    const requestSeq = ++this.editPriceRequestSeq;
    const previousCode = (this.editingRow.EditModel.CustomerPriceName || '').trim().toUpperCase();
    this.isEditPriceLoading = true;
    this.setEditPriceMessage('报价计算中...', false);

    this.service.getAvailableCustomerPrices(request).subscribe({
      next: (res) => {
        if (requestSeq !== this.editPriceRequestSeq || !this.editingRow?.EditModel) return;

        if (!res || res.success === false || res.Success === false) {
          this.resetEditPriceOptions(res?.message || res?.Message || '报价计算失败，请稍后重试');
          return;
        }

        const rawItems = res.items || res.Items || [];
        const items = rawItems
          .map((item) => this.mapAvailablePriceItem(item))
          .filter((item): item is DropdownOption => !!item);

        if (items.length === 0) {
          this.resetEditPriceOptions(res.message || res.Message || '未计算到可用报价，请调整预报数据');
          return;
        }

        this.availableEditPrices = items;
        const isPreviousAvailable = !!previousCode && items.some((p) => p.Code.toUpperCase() === previousCode);
        if (isPreviousAvailable) {
          this.editingRow.EditModel.CustomerPriceName = previousCode;
          this.setEditPriceMessage('', false);
        } else {
          this.editingRow.EditModel.CustomerPriceName = '';
          this.setEditPriceMessage(previousCode ? '原报价不在当前可用报价中，请重新选择报价' : '', !!previousCode);
        }
      },
      error: () => {
        if (requestSeq !== this.editPriceRequestSeq) return;
        this.resetEditPriceOptions('报价计算失败，请稍后重试');
      },
      complete: () => {
        if (requestSeq === this.editPriceRequestSeq) {
          this.isEditPriceLoading = false;
        }
      },
    });
  }

  startEdit(row: ImportPreviewUiRow) {
    if (this.editingRow && this.editingRow !== row) {
      this.cancelEdit(this.editingRow);
    }
    row.IsEditing = true;
    row.EditModel = { ...row };
    this.editingRow = row;
    const currentPrice = this.getCurrentPriceOption(row.CustomerPriceName);
    this.availableEditPrices = currentPrice ? [currentPrice] : [];
    this.setEditPriceMessage('', false);
    this.scheduleEditPriceReload(0);
  }

  cancelEdit(row: ImportPreviewUiRow) {
    this.cancelEditPriceReload();
    row.IsEditing = false;
    row.EditModel = undefined;
    this.availableEditPrices = [];
    this.setEditPriceMessage('', false);
    if (this.editingRow === row) {
      this.editingRow = null;
    }
  }

  saveRowEdit(row: ImportPreviewUiRow) {
    if (this.isEditPriceLoading) {
      this.showToast('报价仍在计算中，请稍后再保存');
      return;
    }

    Object.assign(row, row.EditModel || row, {
      IsEditing: false,
      IsDirty: true,
      EditModel: undefined,
    });
    row.ContentTypeName = this.domain.getContentTypeName(row.ContentType);
    this.editingRow = null;
    this.availableEditPrices = [];
    this.setEditPriceMessage('', false);
    this.validatePreviewRows();
  }

  toggleRowExpanded(row: ImportPreviewUiRow) {
    row.IsExpanded = !row.IsExpanded;
  }

  selectRows(mode: 'visible' | 'errors' | 'valid') {
    this.clearSelection(false);
    let rows: ImportPreviewUiRow[];
    if (mode === 'visible') {
      rows = this.filteredRows;
    } else if (mode === 'errors') {
      rows = this.previewRows.filter((r) => r.HasError);
    } else {
      rows = this.previewRows.filter((r) => !r.HasError);
    }
    rows.forEach((r) => (r.Selected = true));
    this.showToast(`已选择 ${rows.length} 行`);
  }

  clearSelection(showToast = true) {
    this.previewRows.forEach((r) => (r.Selected = false));
    if (showToast) {
      this.showToast('已清空选择');
    }
  }

  getSelectedCount(): number {
    return this.previewRows.filter((r) => r.Selected).length;
  }

  openBatchPanel(mode: BatchSetMode) {
    if (this.getSelectedCount() === 0) {
      this.showToast('请先选择要批量修改的行');
      return;
    }
    this.isBatchSheetOpen = true;
    this.batchMode = mode;
    this.batchCountryId = null;
    this.batchPriceCode = '';
    this.batchContentType = null;
    this.batchCustomsMode = null;
    this.batchDutyValue = null;
  }

  openBatchSheet() {
    this.openBatchPanel('country');
  }

  closeBatchPanel() {
    this.batchMode = null;
    this.isBatchSheetOpen = false;
  }

  applyBatchSet() {
    const selectedRows = this.previewRows.filter((r) => r.Selected);
    if (selectedRows.length === 0 || !this.batchMode) return;

    for (const row of selectedRows) {
      if (this.batchMode === 'country') {
        const country = this.countryOptions.find((c) => c.Id === Number(this.batchCountryId));
        if (!country) {
          this.showToast('请先选择目的国');
          return;
        }
        row.CountryId = country.Id;
        row.CountryName = country.Name;
      } else if (this.batchMode === 'price') {
        const price = this.priceOptions.find((p) => p.Code.toUpperCase() === (this.batchPriceCode || '').toUpperCase());
        if (!price) {
          this.showToast('请先选择报价');
          return;
        }
        row.CustomerPriceName = price.Code;
      } else if (this.batchMode === 'contentType') {
        if (this.batchContentType !== 0 && this.batchContentType !== 1) {
          this.showToast('请先选择货物类型');
          return;
        }
        row.ContentType = this.batchContentType;
        row.ContentTypeName = this.domain.getContentTypeName(this.batchContentType);
      } else if (this.batchMode === 'customs') {
        if (!this.batchCustomsMode) {
          this.showToast('请先选择报关方式');
          return;
        }
        row.RequiresSeparateCustomsDeclaration = this.batchCustomsMode !== 'none';
        row.RequiresSpecialVatInvoice = this.batchCustomsMode === 'special';
      } else if (this.batchMode === 'duty') {
        if (this.batchDutyValue === null) {
          this.showToast('请先选择关税预付');
          return;
        }
        row.RequiresDutiesAndTaxesPrepayment = this.batchDutyValue;
      }

      row.IsDirty = true;
    }

    this.closeBatchPanel();
    this.validatePreviewRows();
    this.showToast(`已批量更新 ${selectedRows.length} 行`);
  }

  confirmImport() {
    const editingCount = this.previewRows.filter((r) => r.IsEditing).length;
    if (editingCount > 0) {
      this.showAlert('仍有行正在编辑', `请先保存或取消 ${editingCount} 条编辑中的记录`);
      return;
    }

    const validRows = this.previewRows.filter((r) => !r.HasError);
    if (validRows.length === 0) {
      this.showAlert('没有可导入数据', '请修正错误行后再导入');
      return;
    }

    const importRows: ImportRowModel[] = validRows.map((r) => this.domain.toImportRowModel(r));
    this.isSaving = true;
    this.service.saveImport(importRows).subscribe({
      next: (res) => {
        this.isSaving = false;
        if (!res.Success) {
          if (res.RowErrors || res.Rows) {
            this.applyServerValidationResult(res, true);
            this.currentStep = 2;
            return;
          }
          this.showAlert('导入失败', res.ErrMsg || res.Message || '导入失败');
          return;
        }
        const count = res.Data?.count || importRows.length;
        this.saveResult = {
          success: true,
          message: `成功导入 ${count} 条预报`,
          count,
        };
        this.service.markListDirty();
        this.currentStep = 3;
      },
      error: () => {
        this.isSaving = false;
        this.showAlert('导入失败', '网络错误，请稍后重试');
      },
    });
  }

  resetImport() {
    this.currentStep = 1;
    this.selectedFile = null;
    this.selectedFileName = '';
    this.previewRows = [];
    this.filteredRows = [];
    this.parseError = '';
    this.saveResult = null;
    this.batchMode = null;
    this.isBatchSheetOpen = false;
    this.cancelEditPriceReload();
    this.editingRow = null;
    this.availableEditPrices = [];
    this.setEditPriceMessage('', false);
    this.activeErrorCategory = '';
    this.errorCursor = -1;
    this.recalculateSummary();
  }

  backToList() {
    this.navCtrl.navigateBack('/member/import-manifest/list');
  }

  getRowStatusIcon(row: ImportPreviewRow): string {
    return row.HasError ? 'close-circle' : 'checkmark-circle';
  }

  getRowStatusColor(row: ImportPreviewRow): string {
    return row.HasError ? 'danger' : 'success';
  }

  getErrorCount(): number {
    return this.previewRows.filter((r) => r.HasError).length;
  }

  getValidCount(): number {
    return this.previewRows.filter((r) => !r.HasError).length;
  }

  canProceed(): boolean {
    return !this.isValidatingRows && this.getValidCount() > 0 && this.previewRows.every((r) => !r.IsEditing);
  }

  getPreviewLeadTitle(): string {
    if (this.summary.errorRows > 0) {
      return `先处理 ${this.summary.errorRows} 条问题`;
    }
    return '全部数据可导入';
  }

  getPreviewLeadText(): string {
    if (this.summary.errorRows > 0) {
      return `当前已有 ${this.summary.validRows} 条可导入，修正问题行后可一起提交。`;
    }
    return `已校验通过 ${this.summary.validRows} 条，确认无误后即可导入。`;
  }

  getConfirmButtonText(): string {
    if (this.isSaving) {
      return '正在导入';
    }
    if (this.isValidatingRows) {
      return '正在校验';
    }
    const editingCount = this.previewRows.filter((r) => r.IsEditing).length;
    if (editingCount > 0) {
      return '请先保存编辑';
    }
    if (this.getValidCount() === 0) {
      return '无可导入行';
    }
    return `确认导入 ${this.summary.validRows} 条`;
  }

  getImportConfirmHint(): string {
    if (this.isSaving) {
      return '正在提交，请勿重复操作';
    }
    if (this.isValidatingRows) {
      return '正在校验修改后的行数据';
    }
    const editingCount = this.previewRows.filter((r) => r.IsEditing).length;
    if (editingCount > 0) {
      return `还有 ${editingCount} 行正在编辑，请先保存或取消`;
    }
    if (this.getValidCount() === 0) {
      return '没有可导入的有效行';
    }
    if (this.summary.errorRows > 0) {
      return `将导入 ${this.summary.validRows} 条有效行，${this.summary.errorRows} 条错误行不会导入`;
    }
    return '';
  }

  trackByIndex(index: number): number {
    return index;
  }

  private recalculateSummary() {
    const totalRows = this.previewRows.length;
    const errorRows = this.previewRows.filter((r) => r.HasError).length;
    const modifiedRows = this.previewRows.filter((r) => r.IsDirty).length;
    this.summary = {
      totalRows,
      validRows: totalRows - errorRows,
      errorRows,
      modifiedRows,
    };
    this.errorCategories = this.domain.getImportErrorCategories(this.previewRows);
  }

  private validatePreviewRows(focusErrors = false): void {
    if (this.previewRows.length === 0 || this.isValidatingRows) return;

    this.isValidatingRows = true;
    const rows = this.previewRows.map((r) => this.domain.toImportRowModel(r));
    this.service.validateImportRows(rows).subscribe({
      next: (res) => {
        this.isValidatingRows = false;
        this.applyServerValidationResult(res, focusErrors);
      },
      error: () => {
        this.isValidatingRows = false;
        this.showAlert('校验失败', '网络错误，行数据校验失败，请稍后重试');
      },
    });
  }

  private applyServerValidationResult(res: ImportRowsValidationResult, focusErrors = false): void {
    const serverRows = res?.Rows || [];
    serverRows.forEach((serverRow) => {
      const target = this.previewRows.find((r) => r.RowIndex === serverRow.RowIndex);
      if (!target) return;

      const uiState = {
        Selected: target.Selected,
        IsEditing: false,
        IsDirty: target.IsDirty,
        EditModel: undefined,
        IsExpanded: target.IsExpanded,
      };
      Object.assign(target, serverRow, uiState);
    });

    (res?.RowErrors || []).forEach((rowError) => {
      const target = this.previewRows.find((r) => r.RowIndex === rowError.RowIndex);
      if (!target) return;
      target.Errors = rowError.Errors || [];
      target.HasError = target.Errors.length > 0;
      target.ObjectNo = rowError.ObjectNo || target.ObjectNo;
    });

    this.recalculateSummary();
    if (this.activeErrorCategory) {
      const activeGroup = this.errorCategories.find((group) => group.key === this.activeErrorCategory);
      if (activeGroup) {
        this.applyErrorCategory(activeGroup);
      } else {
        this.applyFilter(this.summary.errorRows > 0 ? 'actionable' : 'valid');
      }
    } else {
      this.applyFilter(this.activeFilter);
    }

    if (focusErrors && this.summary.errorRows > 0) {
      this.errorCursor = -1;
      this.jumpToNextError();
    }
  }

  private async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({ header, message, buttons: ['确定'] });
    await alert.present();
  }

  private async showToast(message: string) {
    const toast = await this.toastCtrl.create({ message, duration: 1800, position: 'top', color: 'dark' });
    await toast.present();
  }

  private rowHasErrorCategory(row: ImportPreviewRow, categoryKey: string): boolean {
    return (row.Errors || []).some((error) => this.getErrorCategoryKey(error.Message || '') === categoryKey);
  }

  private getErrorCategoryKey(message: string): string {
    if (message.includes('单号')) return 'objectNo';
    if (message.includes('国家') || message.includes('目的国')) return 'country';
    if (message.includes('报价')) return 'price';
    if (message.includes('件数')) return 'piece';
    if (message.includes('类型')) return 'contentType';
    if (message.includes('邮编')) return 'postalCode';
    if (message.includes('申报价值')) return 'declaredValue';
    return 'other';
  }
}
