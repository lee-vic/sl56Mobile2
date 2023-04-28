import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, JsonpClientBackend } from '@angular/common/http';
import { apiUrl } from '../global';

@Injectable({
  providedIn: "root",
})
export class ReturnService {
  constructor(public http: HttpClient) {
    console.log("Hello ReturnProvider Provider");
  }
  getList1(pageIndex, key) {
    let paras = new HttpParams().set("pageIndex", pageIndex).set("key", key);
    let seq = this.http.get<Array<any>>(apiUrl + "/Return/GetList1", {
      withCredentials: true,
      params: paras,
    });
    return seq;
  }
  getList2() {
    let seq = this.http.get<Array<any>>(apiUrl + "/Return/GetList2", {
      withCredentials: true,
    });
    return seq;
  }
  getList3() {
    let seq = this.http.get<Array<any>>(apiUrl + "/Return/GetList3", {
      withCredentials: true,
    });
    return seq;
  }
  apply(idList) {
    let paras = new HttpParams().set("idList", idList);
    let seq = this.http.get<any>(apiUrl + "/Return/Apply", {
      withCredentials: true,
      params: paras,
    });
    return seq;
  }
  apply1(data) {
    let seq = this.http.post<any>(apiUrl + "/Return/Apply", data, {
      withCredentials: true,
    });
    return seq;
  }
  terminate(id) {
    let paras = new HttpParams().set("id", id);
    let seq = this.http.get<any>(apiUrl + "/Return/Terminate", {
      withCredentials: true,
      params: paras,
    });
    return seq;
  }
  fill(id) {
    let paras = new HttpParams().set("id", id);
    let seq = this.http.get<any>(apiUrl + "/Return/Fill", {
      withCredentials: true,
      params: paras,
    });
    return seq;
  }
  fill1(data) {
    let seq = this.http.post<any>(apiUrl + "/Return/Fill", data, {
      withCredentials: true,
    });
    return seq;
  }
  applyHistory() {
    let seq = this.http.get<Array<string>>(apiUrl + "/Return/ApplyHistory", {
      withCredentials: true,
    });
    return seq;
  }
  addToWaitReturnList(ids) {
    let paras = new HttpParams().set("ids", ids);
    let seq = this.http.post<any>(
      apiUrl + "/Return/AddToWaitReturnList",
      null,
      { withCredentials: true, params: paras }
    );
    return seq;
  }
  removeWaitReturnList(ids) {
    let paras = new HttpParams().set("ids", ids);
    let seq = this.http.post<any>(
      apiUrl + "/Return/RemoveWaitReturnList",
      null,
      { withCredentials: true, params: paras }
    );
    return seq;
  }
  clearWaitReturnList() {
    let seq = this.http.get<any>(apiUrl + "/Return/ClearWaitReturnList", {
      withCredentials: true,
    });
    return seq;
  }
  getWaitReturnList() {
    let seq = this.http.get<Array<any>>(apiUrl + "/Return/GetWaitReturnList", {
      withCredentials: true,
    });
    return seq;
  }
  updateMobilePhone(id, mobilePhone) {
    let paras = new HttpParams().set("id", id).set("mobile", mobilePhone);
    console.log(paras);
    let seq = this.http.post<any>(apiUrl + "/Return/UpdateMobile", null, {
      withCredentials: true,
      params: paras,
    });
    return seq;
  }
  resetPickupCode(id) {
    let paras = new HttpParams().set("id", id);
    let seq = this.http.post<any>(apiUrl + "/Return/ResetPickupCode", null, {
      withCredentials: true,
      params: paras,
    });
    return seq;
  }
}
