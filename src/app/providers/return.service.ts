import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../global';
import {
  ReturnActionResult,
  ReturnApplyModel,
  ReturnCompletedItem,
  ReturnInProgressItem,
  ReturnMobileUpdateResponse,
  ReturnWaitingItem
} from '../interfaces/return';

@Injectable({
  providedIn: 'root',
})
export class ReturnService {
  constructor(public http: HttpClient) {}

  getList1(pageIndex: number, key: string): Observable<ReturnCompletedItem[]> {
    return this.get<ReturnCompletedItem[]>('/Return/GetList1', this.params({
      pageIndex,
      key: key || ''
    }));
  }

  getList2(): Observable<ReturnInProgressItem[]> {
    return this.get<ReturnInProgressItem[]>('/Return/GetList2');
  }

  getList3(): Observable<ReturnInProgressItem[]> {
    return this.get<ReturnInProgressItem[]>('/Return/GetList3');
  }

  apply(idList: string): Observable<ReturnApplyModel> {
    return this.get<ReturnApplyModel>('/Return/Apply', this.params({ idList: idList || '' }));
  }

  apply1(data: ReturnApplyModel): Observable<ReturnApplyModel> {
    return this.postJson<ReturnApplyModel>('/Return/Apply', data);
  }

  terminate(id: number): Observable<ReturnActionResult> {
    return this.get<ReturnActionResult>('/Return/Terminate', this.params({ id }));
  }

  fill(id: string): Observable<ReturnApplyModel> {
    return this.get<ReturnApplyModel>('/Return/Fill', this.params({ id: id || '' }));
  }

  fill1(data: ReturnApplyModel): Observable<ReturnApplyModel> {
    return this.postJson<ReturnApplyModel>('/Return/Fill', data);
  }

  applyHistory(): Observable<string[]> {
    return this.get<string[]>('/Return/ApplyHistory');
  }

  addToWaitReturnList(ids: string): Observable<boolean> {
    return this.postEmpty<boolean>('/Return/AddToWaitReturnList', this.params({ ids: ids || '' }));
  }

  removeWaitReturnList(ids: string): Observable<boolean> {
    return this.postEmpty<boolean>('/Return/RemoveWaitReturnList', this.params({ ids: ids || '' }));
  }

  clearWaitReturnList(): Observable<boolean> {
    return this.get<boolean>('/Return/ClearWaitReturnList');
  }

  getWaitReturnList(): Observable<ReturnWaitingItem[]> {
    return this.get<ReturnWaitingItem[]>('/Return/GetWaitReturnList');
  }

  updateMobilePhone(id: number, mobilePhone: string): Observable<ReturnMobileUpdateResponse> {
    return this.postEmpty<ReturnMobileUpdateResponse>('/Return/UpdateMobile', this.params({
      id,
      mobile: mobilePhone || ''
    }));
  }

  resetPickupCode(id: number): Observable<string> {
    return this.postEmpty<string>('/Return/ResetPickupCode', this.params({ id }));
  }

  private get<T>(path: string, params?: HttpParams): Observable<T> {
    return this.http.get<T>(apiUrl + path, {
      withCredentials: true,
      params
    });
  }

  private postJson<T>(path: string, data: unknown): Observable<T> {
    return this.http.post<T>(apiUrl + path, data, {
      withCredentials: true,
    });
  }

  private postEmpty<T>(path: string, params?: HttpParams): Observable<T> {
    return this.http.post<T>(apiUrl + path, null, {
      withCredentials: true,
      params
    });
  }

  private params(values: Record<string, string | number>): HttpParams {
    return Object.keys(values).reduce((params, key) => {
      return params.set(key, String(values[key]));
    }, new HttpParams());
  }
}
