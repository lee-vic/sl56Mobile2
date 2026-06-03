import { Component, OnInit } from '@angular/core';
import { AlertController, NavController } from '@ionic/angular';
import { ImportManifestService } from 'src/app/providers/import-manifest.service';
import { ImportPreviewRow, ImportRowModel } from 'src/app/interfaces/import-manifest';

@Component({
  selector: 'app-import-manifest-import',
  templateUrl: './import-manifest-import.page.html',
  styleUrls: ['./import-manifest-import.page.scss'],
})
export class ImportManifestImportPage implements OnInit {
  // Step tracking
  currentStep: number = 1; // 1=select file, 2=preview, 3=result

  // File selection
  selectedFile: File | null = null;
  selectedFileName: string = '';
  isParsing: boolean = false;
  parseError: string = '';

  // Preview data
  previewRows: ImportPreviewRow[] = [];
  filteredRows: ImportPreviewRow[] = [];
  activeFilter: string = 'all'; // all, errors, modified
  summary = { totalRows: 0, validRows: 0, errorRows: 0 };
  parseMessage: string = '';

  // Save state
  isSaving: boolean = false;
  saveResult: { success: boolean; message: string; count: number } | null = null;

  constructor(
    public service: ImportManifestService,
    private alertCtrl: AlertController,
    private navCtrl: NavController
  ) {}

  ngOnInit() {}

  // ========== Step 1: File Selection ==========

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const fileName = file.name.toLowerCase();

      // Validate file type
      if (!fileName.endsWith('.csv') && !fileName.endsWith('.xls') && !fileName.endsWith('.xlsx')) {
        this.showAlert('文件格式错误', '仅支持 .csv、.xls、.xlsx 格式');
        return;
      }

      // Validate file size (5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        this.showAlert('文件过大', '文件不能超过 5 MB，请压缩或分批导入');
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
          this.previewRows = res.Rows || [];
          this.summary = res.Summary
            ? { totalRows: res.Summary.TotalRows, validRows: res.Summary.ValidRows, errorRows: res.Summary.ErrorRows }
            : { totalRows: 0, validRows: 0, errorRows: 0 };
          this.parseMessage = res.Message || '';
          this.applyFilter('all');
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
        a.download = '导入交货清单模板.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.showAlert('下载失败', '模板下载失败，请稍后重试');
      },
    });
  }

  // ========== Step 2: Preview ==========

  applyFilter(filter: string) {
    this.activeFilter = filter;
    if (filter === 'errors') {
      this.filteredRows = this.previewRows.filter((r) => r.HasError);
    } else if (filter === 'modified') {
      this.filteredRows = this.previewRows.filter((r) => !r.HasError);
    } else {
      this.filteredRows = [...this.previewRows];
    }
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
    return this.getValidCount() > 0;
  }

  // ========== Step 3: Save ==========

  confirmImport() {
    if (!this.canProceed()) return;

    const validRows = this.previewRows.filter((r) => !r.HasError);
    const importRows: ImportRowModel[] = validRows.map((r) => ({
      ObjectNo: r.ObjectNo,
      CountryId: r.CountryId,
      CustomerPriceName: r.CustomerPriceName,
      Piece: r.Piece,
      ContentType: r.ContentType,
      PostalCode: r.PostalCode || '',
      CustomerExpressNo: r.CustomerExpressNo || '',
      DeclaredValue: r.DeclaredValue || null,
      RequiresSeparateCustomsDeclaration: r.RequiresSeparateCustomsDeclaration,
      RequiresDutiesAndTaxesPrepayment: r.RequiresDutiesAndTaxesPrepayment,
      RequiresSpecialVatInvoice: r.RequiresSpecialVatInvoice,
    }));

    this.isSaving = true;
    this.service.saveImport(importRows).subscribe({
      next: (res) => {
        this.isSaving = false;
        this.saveResult = {
          success: res.Success,
          message: res.ErrMsg || `成功导入 ${importRows.length} 条预报`,
          count: importRows.length,
        };
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
  }

  backToList() {
    this.navCtrl.navigateBack('/member/import-manifest/list');
  }

  // ========== Helpers ==========

  async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({ header, message, buttons: ['确定'] });
    await alert.present();
  }
}
