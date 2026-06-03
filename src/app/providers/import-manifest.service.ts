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
  ImportManifestActionResult,
  BulkDeleteRequest,
  BulkDeleteResult,
  DropdownOption,
} from '../interfaces/import-manifest';

@Injectable({
  providedIn: 'root',
})
export class ImportManifestService {
  private baseUrl = apiUrl + '/ImportManifest';

  constructor(public http: HttpClient) {}

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
    return this.http.post<ImportManifestActionResult>(
      this.baseUrl + '/SaveImport',
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
}
