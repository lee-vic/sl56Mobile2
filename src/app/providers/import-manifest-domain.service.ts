import { Injectable } from '@angular/core';
import {
  AttachmentTypeOption,
  BatteryModelOption,
  DropdownOption,
  ForwardingDocumentItem,
  ImportPreviewRow,
  ImportRowModel,
  ImportValidationError,
} from '../interfaces/import-manifest';

export interface NormalizationResult {
  ok: boolean;
  value: string;
  error?: string;
}

export interface AttachmentValidationResult {
  ok: boolean;
  message?: string;
}

export interface CustomsStateResult {
  requiresSeparateCustomsDeclaration: boolean;
  requiresSpecialVatInvoice: boolean;
  showSpecialVat: boolean;
  message?: string;
}

export interface ImportRowValidationResult {
  row: ImportPreviewRow;
  errors: ImportValidationError[];
}

@Injectable({ providedIn: 'root' })
export class ImportManifestDomainService {
  readonly customsAttachmentTypeId = 58;
  private readonly objectNoPattern = /^[A-Z0-9\-]+$/;
  private readonly expressSeparators = /[,;，；\r\n\t]+/;
  private readonly printAttachmentMaxBytes = 2 * 1024 * 1024;
  private readonly baseAttachmentExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx'];
  private readonly archiveExtensions = ['.zip', '.rar', '.7z'];

  normalizeObjectNo(value: string): string {
    return (value || '').trim().toUpperCase();
  }

  validateObjectNo(value: string): NormalizationResult {
    const objectNo = this.normalizeObjectNo(value);
    if (!objectNo) {
      return { ok: false, value: objectNo, error: '单号不能为空' };
    }
    if (objectNo.length > 32) {
      return { ok: false, value: objectNo, error: '单号长度不能超过32' };
    }
    if (!this.objectNoPattern.test(objectNo)) {
      return { ok: false, value: objectNo, error: '单号只能包含大写字母、数字和英文横线' };
    }
    return { ok: true, value: objectNo };
  }

  normalizeCustomerExpressNo(raw: string): NormalizationResult {
    const text = (raw || '').trim();
    if (!text) {
      return { ok: true, value: '' };
    }

    const parts = text
      .split(this.expressSeparators)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    const seen = new Set<string>();
    const normalized: string[] = [];

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (part.length > 32) {
        return { ok: false, value: '', error: `第 ${i + 1} 个快递单号长度不能超过 32 个字符` };
      }
      const key = part.toUpperCase();
      if (!seen.has(key)) {
        seen.add(key);
        normalized.push(part);
      }
    }

    const value = normalized.join(',');
    if (value.length > 512) {
      return { ok: false, value: '', error: '快递单号总长度不能超过 512 个字符' };
    }

    return { ok: true, value };
  }

  getStatusColor(statusCode: number | null | undefined): string {
    switch (statusCode) {
      case 0:
        return 'warning';
      case 1:
        return 'success';
      case 2:
        return 'danger';
      default:
        return 'medium';
    }
  }

  getCustomerStatusName(statusName?: string): string {
    if (!statusName) {
      return '未知';
    }
    return statusName === '已收货' ? '已交货' : statusName;
  }

  canDelete(statusCode: number | null | undefined): boolean {
    return statusCode === 0;
  }

  getFileIcon(fileName: string): string {
    const ext = this.getExtension(fileName).replace('.', '');
    switch (ext) {
      case 'pdf':
        return 'document-outline';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return 'image-outline';
      case 'doc':
      case 'docx':
        return 'document-text-outline';
      case 'xls':
      case 'xlsx':
        return 'grid-outline';
      case 'zip':
      case 'rar':
      case '7z':
        return 'archive-outline';
      default:
        return 'attach-outline';
    }
  }

  formatFileSize(bytes: number): string {
    if (!bytes || bytes <= 0) {
      return '0 B';
    }
    if (bytes < 1024) {
      return bytes + ' B';
    }
    if (bytes < 1048576) {
      return (bytes / 1024).toFixed(1) + ' KB';
    }
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  validateAttachment(
    file: File,
    attachmentTypeId: number,
    attachmentTypes: AttachmentTypeOption[],
    attachments: ForwardingDocumentItem[]
  ): AttachmentValidationResult {
    if (!attachmentTypeId) {
      return { ok: false, message: '请先选择附件类型' };
    }
    if (!file) {
      return { ok: false, message: '请选择要上传的文件' };
    }

    const type = attachmentTypes.find((t) => t.id === attachmentTypeId);
    const isPrint = !!type?.isPrint;
    if (isPrint && attachments.some((d) => d.attachmentTypeId === attachmentTypeId)) {
      return { ok: false, message: `"${type?.name || '该附件类型'}" 类型不允许重复上传` };
    }

    const allowed = isPrint ? this.baseAttachmentExtensions : [...this.baseAttachmentExtensions, ...this.archiveExtensions];
    const ext = this.getExtension(file.name);
    if (!allowed.includes(ext)) {
      return {
        ok: false,
        message: isPrint
          ? '不支持的文件格式，仅支持 PDF/图片/Office 文档'
          : '不支持的文件格式，仅支持 PDF/图片/Office 文档，或 zip/rar/7z 压缩包',
      };
    }

    if (isPrint && file.size > this.printAttachmentMaxBytes) {
      return { ok: false, message: '文件大小超过限制（最大 2MB）' };
    }

    return { ok: true };
  }

  resolveCustomsState(
    attachments: ForwardingDocumentItem[],
    requestedSeparate: boolean,
    requestedSpecialVat: boolean
  ): CustomsStateResult {
    const hasCustomsDoc = attachments.some((d) => d.attachmentTypeId === this.customsAttachmentTypeId);
    if (hasCustomsDoc) {
      return {
        requiresSeparateCustomsDeclaration: true,
        requiresSpecialVatInvoice: !!requestedSpecialVat,
        showSpecialVat: true,
        message: requestedSeparate ? undefined : '已存在报关资料，系统已自动勾选“是否单独报关”',
      };
    }

    return {
      requiresSeparateCustomsDeclaration: false,
      requiresSpecialVatInvoice: false,
      showSpecialVat: false,
      message: requestedSeparate ? '勾选“是否单独报关”前，请先上传报关资料' : undefined,
    };
  }

  validateImportRow(
    raw: Partial<ImportPreviewRow>,
    countries: DropdownOption[],
    prices: DropdownOption[],
    rowIndex: number,
    allRows: Partial<ImportPreviewRow>[] = [],
    batteryModels: BatteryModelOption[] = []
  ): ImportRowValidationResult {
    const errors: ImportValidationError[] = [];
    const objectNoResult = this.validateObjectNo(raw.ObjectNo || '');
    const objectNo = objectNoResult.value;
    if (!objectNoResult.ok) {
      errors.push({ Code: 'INVALID_OBJECT_NO', Message: objectNoResult.error || '单号格式不正确' });
    } else if (this.hasDuplicateImportObjectNo(rowIndex, objectNo, allRows)) {
      errors.push({ Code: 'DUPLICATE_IN_FILE', Message: '单号在当前导入列表中重复' });
    }

    const countryId = this.toNumber(raw.CountryId);
    const country = countries.find((c) => c.Id === countryId);
    if (!country) {
      errors.push({ Code: 'COUNTRY_INVALID', Message: '请选择有效目的国' });
    }

    const priceCode = (raw.CustomerPriceName || '').trim().toUpperCase();
    const price = prices.find((p) => p.Code.toUpperCase() === priceCode);
    if (!priceCode) {
      errors.push({ Code: 'PRICE_REQUIRED', Message: '报价代码不能为空' });
    } else if (!price) {
      errors.push({ Code: 'PRICE_INVALID', Message: '报价代码无效，请重新选择' });
    }

    const piece = this.toNumber(raw.Piece);
    if (!Number.isInteger(piece) || piece < 1) {
      errors.push({ Code: 'PIECE_INVALID', Message: '件数必须为正整数' });
    }

    const contentType = this.toNumber(raw.ContentType);
    if (contentType !== 0 && contentType !== 1) {
      errors.push({ Code: 'CONTENT_TYPE_INVALID', Message: '类型必须是文件或包裹' });
    }

    const postalCode = (raw.PostalCode || '').trim();
    if (postalCode.length > 16) {
      errors.push({ Code: 'POSTAL_CODE_INVALID', Message: '邮编长度不能超过16' });
    }

    const expressResult = this.normalizeCustomerExpressNo(raw.CustomerExpressNo || '');
    if (!expressResult.ok) {
      errors.push({ Code: 'CUSTOMER_EXPRESS_NO_INVALID', Message: expressResult.error || '快递单号格式错误' });
    }

    const declaredValue = this.parseNullableNumber(raw.DeclaredValue);
    if ((raw.DeclaredValue as any) !== '' && raw.DeclaredValue !== null && raw.DeclaredValue !== undefined && declaredValue === null) {
      errors.push({ Code: 'DECLARED_VALUE_INVALID', Message: '申报价值格式不正确' });
    }

    const batteryModel = (raw.BatteryModel || '').trim().toUpperCase();
    const allowedBatteryModels = batteryModels.map((p) => (p.Value || '').trim().toUpperCase()).filter((p) => p.length > 0);
    if (batteryModel && allowedBatteryModels.length > 0 && !allowedBatteryModels.includes(batteryModel)) {
      errors.push({ Code: 'BATTERY_MODEL_INVALID', Message: '电池型号填写错误' });
    }

    const requiresSpecialVatInvoice = !!raw.RequiresSpecialVatInvoice;
    const requiresSeparateCustomsDeclaration = !!raw.RequiresSeparateCustomsDeclaration || requiresSpecialVatInvoice;

    const row: ImportPreviewRow = {
      RowIndex: raw.RowIndex || rowIndex + 1,
      ObjectNo: objectNo,
      CountryId: country ? country.Id : countryId,
      CountryName: country ? country.Name : (raw.CountryName || ''),
      CustomerPriceName: priceCode,
      Piece: piece,
      ContentType: contentType,
      ContentTypeName: contentType === 1 ? '包裹' : '文件',
      PostalCode: postalCode,
      CustomerExpressNo: expressResult.value,
      DeclaredValue: declaredValue,
      RequiresSeparateCustomsDeclaration: requiresSeparateCustomsDeclaration,
      RequiresDutiesAndTaxesPrepayment: !!raw.RequiresDutiesAndTaxesPrepayment,
      RequiresSpecialVatInvoice: requiresSpecialVatInvoice,
      BatteryModel: batteryModel,
      Errors: errors,
      HasError: errors.length > 0,
    };

    return { row, errors };
  }

  getImportErrorCategories(rows: ImportPreviewRow[]) {
    const groups: { key: string; text: string; count: number; firstIndex: number }[] = [];
    rows.forEach((row, rowIndex) => {
      (row.Errors || []).forEach((err) => {
        const category = this.getImportErrorCategory(err.Message || '');
        let group = groups.find((g) => g.key === category.key);
        if (!group) {
          group = { ...category, count: 0, firstIndex: rowIndex };
          groups.push(group);
        }
        group.count++;
        group.firstIndex = Math.min(group.firstIndex, rowIndex);
      });
    });
    return groups.sort((a, b) => b.count - a.count);
  }

  toImportRowModel(row: ImportPreviewRow): ImportRowModel {
    return {
      RowIndex: row.RowIndex,
      ObjectNo: this.normalizeObjectNo(row.ObjectNo),
      CountryId: row.CountryId,
      CustomerPriceName: (row.CustomerPriceName || '').trim().toUpperCase(),
      Piece: row.Piece,
      ContentType: row.ContentType,
      PostalCode: row.PostalCode || '',
      CustomerExpressNo: row.CustomerExpressNo || '',
      DeclaredValue: row.DeclaredValue || null,
      RequiresSeparateCustomsDeclaration: !!row.RequiresSeparateCustomsDeclaration,
      RequiresDutiesAndTaxesPrepayment: !!row.RequiresDutiesAndTaxesPrepayment,
      RequiresSpecialVatInvoice: !!row.RequiresSpecialVatInvoice,
      BatteryModel: row.BatteryModel || '',
    };
  }

  private getExtension(fileName: string): string {
    const value = fileName || '';
    const lastDot = value.lastIndexOf('.');
    return lastDot >= 0 ? value.substring(lastDot).toLowerCase() : '';
  }

  private hasDuplicateImportObjectNo(rowIndex: number, objectNo: string, allRows: Partial<ImportPreviewRow>[]): boolean {
    if (!objectNo || !allRows.length) {
      return false;
    }
    return allRows.some((row, index) => index !== rowIndex && this.normalizeObjectNo(row.ObjectNo || '') === objectNo);
  }

  private getImportErrorCategory(message: string) {
    if (message.includes('单号')) return { key: 'objectNo', text: '单号问题' };
    if (message.includes('国家') || message.includes('目的国')) return { key: 'country', text: '国家问题' };
    if (message.includes('报价')) return { key: 'price', text: '报价问题' };
    if (message.includes('件数')) return { key: 'piece', text: '件数问题' };
    if (message.includes('类型')) return { key: 'contentType', text: '类型问题' };
    if (message.includes('邮编')) return { key: 'postalCode', text: '邮编问题' };
    if (message.includes('申报价值')) return { key: 'declaredValue', text: '申报价值问题' };
    return { key: 'other', text: '其他问题' };
  }

  private toNumber(value: any): number {
    if (value === null || value === undefined || value === '') {
      return null as any;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? (null as any) : parsed;
  }

  private parseNullableNumber(value: any): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
}
