import { Injectable } from '@angular/core';
import { HttpParams, HttpClient } from '@angular/common/http';
import { apiUrl } from '../global';
import {
  ImportManifestListItem,
  ImportManifestListResponse,
  ImportManifestDetail,
  ImportManifestSaveRequest,
  ParseImportResponse,
  ImportRowModel,
  ImportRowsValidationResult,
  ImportManifestActionResult,
  BulkDeleteRequest,
  BulkDeleteResult,
  DropdownOption,
  AttachmentTypeOption,
  BatteryModelOption,
  UploadTempDocumentResult,
  ForwardingDocumentItem,
  ForwardingDocumentListResult,
} from '../interfaces/import-manifest';

@Injectable({
  providedIn: 'root',
})
export class ImportManifestService {
  private baseUrl = apiUrl + '/ImportManifest';
  private listDirty = false;

  constructor(public http: HttpClient) {}

  markListDirty() {
    this.listDirty = true;
  }

  consumeListDirty(): boolean {
    const dirty = this.listDirty;
    this.listDirty = false;
    return dirty;
  }

  /**
   * 获取快速预报列表
   */
  getList(
    pageIndex: number,
    search?: string,
    startDate?: string,
    endDate?: string
  ) {
    let params = new HttpParams().set('pageIndex', pageIndex.toString());
    if (search && search.trim() !== '') {
      params = params.set('search', search.trim().toUpperCase());
    }
    if (startDate) {
      params = params.set('startDate', startDate);
    }
    if (endDate) {
      params = params.set('endDate', endDate);
    }
    return this.http.get<ImportManifestListResponse>(this.baseUrl + '/GetList', {
      withCredentials: true,
      params,
    });
  }

  /**
   * 获取单条详情
   */
  getDetail(id: number) {
    return this.http.get<ImportManifestDetail>(
      this.baseUrl + '/GetDetail?id=' + id,
      { withCredentials: true }
    );
  }

  /**
   * 新增快速预报
   */
  create(model: ImportManifestSaveRequest) {
    return this.http.post<ImportManifestActionResult>(
      this.baseUrl + '/Create',
      model,
      { withCredentials: true }
    );
  }

  /**
   * 编辑快速预报
   */
  edit(model: ImportManifestSaveRequest) {
    return this.http.post<ImportManifestActionResult>(
      this.baseUrl + '/Edit',
      model,
      { withCredentials: true }
    );
  }

  /**
   * 删除单条
   */
  delete(id: number) {
    return this.http.post<ImportManifestActionResult>(
      this.baseUrl + '/Delete?id=' + id,
      null,
      { withCredentials: true }
    );
  }

  /**
   * 批量删除
   */
  bulkDelete(ids: number[]) {
    const request: BulkDeleteRequest = { Ids: ids };
    return this.http.post<BulkDeleteResult>(
      this.baseUrl + '/BulkDelete',
      request,
      { withCredentials: true }
    );
  }

  /**
   * 解析导入文件 (Step 1)
   */
  parseImport(formData: FormData) {
    return this.http.post<ParseImportResponse>(
      this.baseUrl + '/ParseImport',
      formData,
      { withCredentials: true }
    );
  }

  /**
   * 确认批量导入 (Step 2)
   */
  saveImport(rows: ImportRowModel[]) {
    return this.http.post<ImportRowsValidationResult>(
      this.baseUrl + '/SaveImport',
      { Rows: rows },
      { withCredentials: true }
    );
  }

  /**
   * 校验导入预览行，业务规则由服务层统一处理。
   */
  validateImportRows(rows: ImportRowModel[]) {
    return this.http.post<ImportRowsValidationResult>(
      this.baseUrl + '/ValidateImportRows',
      { Rows: rows },
      { withCredentials: true }
    );
  }

  /**
   * 获取国家下拉选项
   */
  getCountryOptions() {
    return this.http.get<DropdownOption[]>(
      this.baseUrl + '/GetCountryOptions',
      { withCredentials: true }
    );
  }

  /**
   * 获取报价下拉选项
   */
  getCustomerPriceOptions() {
    return this.http.get<DropdownOption[]>(
      this.baseUrl + '/GetCustomerPriceOptions',
      { withCredentials: true }
    );
  }

  /**
   * 获取电池型号下拉选项
   */
  getBatteryModelOptions() {
    return this.http.get<BatteryModelOption[]>(
      this.baseUrl + '/GetBatteryModelOptions',
      { withCredentials: true }
    );
  }

  /**
   * 校验单号是否可用
   */
  validateObjectNo(objectNo: string, excludeId?: number) {
    return this.http.post<ImportManifestActionResult>(
      this.baseUrl + '/ValidateObjectNo',
      { ObjectNo: objectNo, ExcludeId: excludeId || null },
      { withCredentials: true }
    );
  }

  /**
   * 校验报价代码是否可用
   */
  validateCustomerPriceName(priceCode: string) {
    return this.http.post<ImportManifestActionResult>(
      this.baseUrl + '/ValidateCustomerPriceName',
      { PriceCode: priceCode },
      { withCredentials: true }
    );
  }

  /**
   * 下载导入模板
   */
  downloadTemplate() {
    return this.http.get(this.baseUrl + '/DownloadTemplate', {
      withCredentials: true,
      responseType: 'blob',
    });
  }

  /**
   * 获取附件类型下拉选项
   */
  getAttachmentTypes() {
    return this.http.get<AttachmentTypeOption[]>(
      this.baseUrl + '/GetAttachmentTypes',
      { withCredentials: true }
    );
  }

  /**
   * 上传待绑定随货资料文件。
   * 后端复用 PC 端 UploadTempDocument 入口，实际保存到文件服务器，保存预报时再绑定记录。
   */
  uploadPendingDocument(file: File, attachmentTypeId: number) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('attachmentTypeId', attachmentTypeId.toString());
    return this.http.post<UploadTempDocumentResult>(
      this.baseUrl + '/UploadTempDocument',
      formData,
      { withCredentials: true }
    );
  }

  uploadTempDocument(file: File, attachmentTypeId: number) {
    return this.uploadPendingDocument(file, attachmentTypeId);
  }

  /**
   * 获取预报的随货资料列表
   */
  getForwardingDocuments(detailId: number) {
    return this.http.get<ForwardingDocumentListResult>(
      this.baseUrl + '/GetForwardingDocuments?detailId=' + detailId,
      { withCredentials: true }
    );
  }

  getForwardingDocumentPreviewUrl(documentId: number) {
    return this.baseUrl + '/PreviewDocument?id=' + documentId;
  }

  getForwardingDocumentDownloadUrl(documentId: number) {
    return this.baseUrl + '/DownloadDocument?id=' + documentId;
  }

  getLabelDownloadUrl(detailId: number) {
    return this.baseUrl + '/GetLabel?id=' + detailId;
  }

  openForwardingDocumentPreview(documentId: number) {
    const url = this.getForwardingDocumentPreviewUrl(documentId);
    this.openUrl(url);
  }

  downloadForwardingDocument(documentId: number) {
    const url = this.getForwardingDocumentDownloadUrl(documentId);
    this.openUrl(url);
  }

  downloadLabel(detailId: number) {
    const url = this.getLabelDownloadUrl(detailId);
    this.openUrl(url);
  }

  private openUrl(url: string) {
    if (this.isMicroMessenger()) {
      window.location.href = url;
      return;
    }

    const newWindow = window.open(url, '_blank');
    if (!newWindow) {
      window.location.href = url;
    }
  }

  private isMicroMessenger(): boolean {
    const ua = navigator.userAgent || '';
    return /MicroMessenger/i.test(ua);
  }
}
