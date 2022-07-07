import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { apiUrl } from '../global';
import { SubAccount } from '../interfaces/sub-account';

@Injectable({
  providedIn: 'root'
})
export class DistributeService {

  constructor(public http: HttpClient) { }

  oneKeyRegister() {
    let req = this.http.post<string>(apiUrl + "/Distribute/OneKeyRegister", null, { withCredentials: true });
    return req;
  }

  getPartners() {
    let req = this.http.get<any>(apiUrl + "/Distribute/GetDistributeCustomers", { withCredentials: true });
    return req;
  }

  getProfits(dateType) {
    let req = this.http.get<any>(apiUrl + "/Distribute/LoadData?dateType=" + dateType, { withCredentials: true });
    return req;
  }

  getShareCode() {
    let req = this.http.get<any>(apiUrl + "/Distribute/GetShareQRCode", { withCredentials: true });
    return req;
  }

  getUserInfo() {
    let req = this.http.get<any>(apiUrl + "/Distribute/GetUserInfo", { withCredentials: true });
    return req;
  }

  updateUserInfo(userInfo: SubAccount) {
    let data = JSON.stringify(userInfo);
    let req = this.http.post<any>(apiUrl + "/Distribute/UpdateUserInfo", data, { headers: { "content-type": "application/json" }, withCredentials: true });
    return req;
  }

  doWithdrawal(amount){
    let req = this.http.post<any>(apiUrl + "/Distribute/DoWithdrawal?amount="+amount, null, { withCredentials: true });
    return req;
  }

  getWithdrawalRecords(){
    let req = this.http.get<any>(apiUrl + "/Distribute/GetWithdrawalRecords", { withCredentials: true });
    return req;
  }
  getDistributionAmountWithdrawal(){
    let req = this.http.get<any>(apiUrl + "/Distribute/GetDistributionAmountWithdrawal", { withCredentials: true });
    return req;
  }
}
