import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { apiUrl } from '../global';
import { WeightBill } from '../interfaces/weight-bill';
import { UnifiedOrderResult } from '../interfaces/unified-order-result';
import { timeout } from 'rxjs/operators';

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
  start(data:WeightBill) {
    let seq =  this.http.post<boolean>(apiUrl+"/Measure/Start",data,{ withCredentials:true}).pipe(timeout(5000));
    return seq;
  }

  save(data) {
    let seq = this.http.post<string>(
      apiUrl + "/Measure/Save",
      data,
      { withCredentials: true }
    );
    return seq;
  }
  getHistoryVehicleNo(openId) {
    let paras = new HttpParams().set("openid", openId);
    let seq = this.http.get<Array<string>>(
      apiUrl + "/Measure/HistoryVehicleNo",
      {
        withCredentials: true,
        params: paras,
      }
    );
    return seq;
  }
  getWeightBillDefaultValue(openId: string, vehicleNo: string) {
    let paras = new HttpParams().set("vehicleNo", vehicleNo).set("openId", openId);
    let seq = this.http.get<WeightBill>(
      apiUrl + "/Measure/GetWeightBillDefaultValue",
      {
        withCredentials: true,
        params: paras,
      }
    );
    return seq;
  }
  getInParkVehicleNo() {
    let seq = this.http.get<Array<string>>(
      apiUrl + "/Measure/InParkVehicleNo",
      {
        withCredentials: true
      }
    );
    return seq;
  }
}
