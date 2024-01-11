import { HttpParams, HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { apiUrl } from '../global';

@Injectable({
  providedIn: "root",
})
export class CommonService {
  constructor(public httpClient: HttpClient) {}
  getJsSdkConfig(url, jsApiList, openTagList) {
    let params = new HttpParams()
      .set("url", url)
      .set("jsApiList", jsApiList)
      .set("openTagList", openTagList);
    let req = this.httpClient.get<any>(apiUrl + "/common/GetWxSdkConfigInfo", {
      params: params,
      withCredentials: true,
    });
    return req;
  }
}
