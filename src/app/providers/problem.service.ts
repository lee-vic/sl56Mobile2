import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Problem, ProblemCompleteResponse } from '../interfaces/problem';
import { apiUrl } from '../global';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: "root",
})
export class ProblemService {
  constructor(public http: HttpClient) {}
  getList(pageIndex, key) {
    let paras = new HttpParams().set("pageIndex", pageIndex).set("key", key);
    let seq = this.http.get<Array<Problem>>(apiUrl + "/Problem/GetList", {
      withCredentials: true,
      params: paras,
    });
    return seq;
  }
  getProblemDetail(problemId) {
    let paras = new HttpParams().set("problemId", problemId);
    let seq = this.http.get(apiUrl + "/Problem/GetProblemDetail", {
      withCredentials: true,
      params: paras,
    });
    return seq;
  }
  addProblem(rgdId) {
    let data = { rgdId: rgdId, isMobileSite: true };
    let seq = this.http.post<any>(apiUrl + "/Problem/AddProblem1", data, {
      withCredentials: true,
    });
    return seq;
  }
  upload(form) {
    console.log(form);
    let seq = this.http.post<any>(
      apiUrl + "/DeliveryRecord/UploadAttachment",
      form,
      { withCredentials: true }
    );
    return seq;
  }
  upload1(form) {
    console.log(form);
    let seq = this.http.post<any>(
      apiUrl + "/DeliveryRecord/UploadChatFile",
      form,
      { withCredentials: true }
    );
    return seq;
  }
  confirm(problemId) {
    let paras = new HttpParams().set("problemId", problemId);
    let seq = this.http.post<any>(apiUrl + "/Problem/Confirm", null, {
      withCredentials: true,
      params: paras,
    });
    return seq.pipe(map(response => this.normalizeFailure(response)));
  }
  complete(model) {
    let data = JSON.stringify(model);
    console.log(data);
    let seq = this.http.post<ProblemCompleteResponse>(apiUrl + "/Problem/Complete", data, {
      headers: {
        "content-type": "application/json",
      },
      withCredentials: true,
      responseType: "json",
    });
    return seq.pipe(map(response => this.normalizeFailure(response)));
  }
  invoicePretreatment(model) {
    let seq = this.http.post<any>(
      apiUrl + "/Problem/InvoicePretreatment",
      model,
      { withCredentials: true }
    );
    return seq.pipe(map(response => this.normalizeFailure(response)));
  }
  isWeAppUploadFile(problemId) {
    let paras = new HttpParams().set("problemId", problemId);
    let seq = this.http.get<boolean>(apiUrl + "/Problem/IsWeAppUploadFile", {
      withCredentials: true,
      params: paras,
    });
    return seq;
  }
  deleteProblemTempFile(problemId) {
    let paras = new HttpParams().set("problemId", problemId);
    let seq = this.http.post<any>(apiUrl + "/Problem/DeleteProblemTempFile", null, {
      withCredentials: true,
      params: paras,
    });
    return seq;
  }

  private normalizeFailure<T extends ProblemCompleteResponse>(response: T): T & { IsSuccess?: boolean } {
    if (!response || response.Success !== false) return response;
    // 全局 API 异常仍可能返回 HTTP 200 + Messages，不能让旧页面将它视为成功或显示空白提示。
    const message = response.Message || response.message || response.Messages?.join('；') || '操作失败，请刷新页面后重试';
    return { ...response, Result: false, IsSuccess: false, Message: message };
  }
}
