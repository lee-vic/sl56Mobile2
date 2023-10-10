import { Injectable } from '@angular/core';
import { apiUrl } from '../global';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: "root",
})
export class InterviewService {
  constructor(private httpClient: HttpClient) {}
  scanQRCode(id) {
    let params = new HttpParams().set("interviewQRCodeId", id);
    let req = this.httpClient.get<any>(apiUrl + "/Interview/ScanQRCode", {
      params: params,
    });
    return req;
  }
  getVerificationCode(id, phone) {
    let params = new HttpParams()
      .set("interviewQRCodeId", id)
      .set("phone", phone);
    let req = this.httpClient.get<any>(
      apiUrl + "/Interview/GetVerificationCode",
      {
        params: params,
      }
    );
    return req;
  }
  saveInterview(data) {
    let postData = JSON.stringify(data);
    let req = this.httpClient.post<any>(apiUrl + "/Interview/SaveInterview", postData, {
      headers: { "content-type": "application/json" },
      withCredentials: true,
    });
    return req;
  }
  config(url, jsApiList) {
    let params = new HttpParams()
      .set("url", url)
      .set("jsApiList", jsApiList);
    let req = this.httpClient.get<any>(
      apiUrl + "/Interview/GetWxSdkConfigInfo",
      {
        params: params,
      }
    );
    return req;
  }
}
