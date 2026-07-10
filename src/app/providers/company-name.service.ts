import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { apiUrl } from '../global';
import {
  CompanyNameActionResult,
  CompanyNameDetail,
  CompanyNameListItem,
  CompanyNameQueryRequest,
  CompanyNameQueryResult,
  CompanyNameSaveRequest,
} from '../interfaces/company-name';

@Injectable({
  providedIn: 'root',
})
export class CompanyNameService {
  private readonly baseUrl = apiUrl + '/CompanyName';
  private listDirty = false;

  constructor(private readonly http: HttpClient) {}

  markListDirty(): void {
    this.listDirty = true;
  }

  consumeListDirty(): boolean {
    const dirty = this.listDirty;
    this.listDirty = false;
    return dirty;
  }

  getList() {
    return this.http.get<CompanyNameListItem[]>(this.baseUrl + '/List', {
      withCredentials: true,
    });
  }

  getDetail(id: number) {
    const params = new HttpParams().set('id', id.toString());
    return this.http.get<CompanyNameDetail>(this.baseUrl + '/Detail', {
      params,
      withCredentials: true,
    });
  }

  queryGlobal(model: CompanyNameQueryRequest) {
    return this.http.post<CompanyNameQueryResult>(
      this.baseUrl + '/QueryGlobal',
      model,
      { withCredentials: true }
    );
  }

  create(model: CompanyNameSaveRequest, file: File) {
    return this.http.post<CompanyNameActionResult>(
      this.baseUrl + '/Create',
      this.buildFormData(model, file),
      { withCredentials: true }
    );
  }

  edit(model: CompanyNameSaveRequest, file?: File | null) {
    return this.http.post<CompanyNameActionResult>(
      this.baseUrl + '/Edit',
      this.buildFormData(model, file || null),
      { withCredentials: true }
    );
  }

  getImageUrl(id: number): string {
    return this.baseUrl + '/Image?id=' + id;
  }

  private buildFormData(model: CompanyNameSaveRequest, file: File | null): FormData {
    const formData = new FormData();
    formData.append('ObjectId', (model.ObjectId || 0).toString());
    formData.append('CompanyName', model.CompanyName || '');
    formData.append('ChineseCompanyName', model.ChineseCompanyName || '');
    formData.append('PersonName', model.PersonName || '');
    formData.append('Phone', model.Phone || '');
    formData.append('Address1', model.Address1 || '');
    formData.append('Address2', model.Address2 || '');
    formData.append('Address3', model.Address3 || '');
    formData.append('NameType', model.NameType.toString());
    formData.append('SocialCreditCode', model.SocialCreditCode || '');

    if (file) {
      formData.append('FileAttach', file, file.name);
    }

    return formData;
  }
}
