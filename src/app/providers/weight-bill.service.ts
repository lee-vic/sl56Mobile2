import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { apiUrl } from '../global';
import { WeightBill } from '../interfaces/weight-bill';
import { UnifiedOrderResult } from '../interfaces/unified-order-result';

@Injectable({
  providedIn: "root",
})
export class WeightBillService {
  constructor(public http: HttpClient) { }

  getWeightBill(objectId) {
    let paras = new HttpParams().set("objectId", objectId);
    let seq = this.http.get<WeightBill>(apiUrl + "/Measure/GetWeightBill", {
      withCredentials: true,
      params: paras,
    });
    return seq;
  }

  getList(openId) {
    let paras = new HttpParams().set("openId", openId);
    let seq = this.http.get<Array<WeightBill>>(
      apiUrl + "/Measure/GetWeightBillList",
      {
        withCredentials: true,
        params: paras,
      }
    );
    return seq;
  }

  payWeighingFee(data) {
    let seq = this.http.post<UnifiedOrderResult>(
      apiUrl + "/Measure/PayWeighingFee",
      data,
      { withCredentials: true }
    );
    return seq;
  }

  download(id) {
    let paras = new HttpParams().set("objectId", id);
    let seq = this.http.get<Array<WeightBill>>(
      apiUrl + "/Measure/GetWeightBillFile",
      {
        withCredentials: true,
        params: paras,
      }
    );
    return seq;
  }
  start(openid,vehicleNo) {
    var request = new XMLHttpRequest();
    request.withCredentials = true;
    request.open('GET', apiUrl + "/Measure/Start?vehicleNo=" + vehicleNo+"&openid="+openid, false);
    request.send(null);
    return request.responseText;
  }
  
  save(data) {
    let seq = this.http.post<string>(
      apiUrl + "/Measure/Save",
      data,
      { withCredentials: true }
    );
    return seq;
  }
}
