import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Problem } from '../interfaces/problem';
import { apiUrl } from '../global';

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
    return seq;
  }
  complete(model) {
    let data = JSON.stringify(model);
    console.log(data);
    let seq = this.http.post<any>(apiUrl + "/Problem/Complete", data, {
      headers: {
        "content-type": "application/json",
      },
      withCredentials: true,
      responseType: "json",
    });
    return seq;
  }
  invoicePretreatment(model) {
    let seq = this.http.post<any>(
      apiUrl + "/Problem/InvoicePretreatment",
      model,
      { withCredentials: true }
    );
    return seq;
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
}