import { Injectable } from '@angular/core';
import { ForgotPassword } from '../interfaces/forgot-password';
import { HttpParams, HttpClient } from '@angular/common/http';
import { apiUrl } from '../global';
import { User } from '../interfaces/user';
import { ResetPassword } from '../interfaces/reset-password';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient) { }
  auth(form: any) {
    let data = JSON.stringify(form);
    console.log(data);
    let seq = this.http.post(apiUrl + "/account/logon", data, {
      headers: {
        "content-type": "application/json"
      },
      withCredentials: true,
      responseType: "text"
    })
    return seq;
  }
  isAuthenticated() {
    let seq = this.http.get(apiUrl + "/Account/IsAuthenticated", { withCredentials: true });
    return seq;
  }
  logOff(){
    let seq = this.http.get(apiUrl + "/Account/LogOff", { withCredentials: true, responseType: "text" });
    return seq;
  }
  forgotPassword(account:string){
    let paras=new HttpParams()
    .set("account",account)
    let seq = this.http.get<ForgotPassword>(apiUrl + "/Account/ForgotPassword", { withCredentials: true,params:paras});
    return seq;
  }
  getCode(form:ForgotPassword){
    let data = JSON.stringify(form);
    let seq = this.http.post<ForgotPassword>(apiUrl + "/account/SendCode", data, {
      headers: {
        "content-type": "application/json"
      },
      withCredentials: true
    })
    return seq;
  }
  forgotPassword1(form:ForgotPassword){
    let data = JSON.stringify(form);
    let seq = this.http.post<ForgotPassword>(apiUrl + "/account/ForgotPassword1", data, {
      headers: {
        "content-type": "application/json"
      },
      withCredentials: true
    })
    return seq;
  }
  forgotPassword2(form:ForgotPassword){
    let data = JSON.stringify(form);
    let seq = this.http.post<ForgotPassword>(apiUrl + "/account/ForgotPassword2", data, {
      headers: {
        "content-type": "application/json"
      },
      withCredentials: true
    })
    return seq;
  }
  resetPassword(form:ResetPassword){
    let data = JSON.stringify(form);
    let seq = this.http.post<ResetPassword>(apiUrl + "/account/ResetPassword", data, {
      headers: {
        "content-type": "application/json"
      },
      withCredentials: true
    })
    return seq;
  }
  getHomeInfo(){
    let seq = this.http.get<User>(apiUrl + "/UserHome/Load", { withCredentials: true });
    return seq;
  }
  logined(registrationId:string,platform:string){
    let data = JSON.stringify({RegistrationId:registrationId,Platform:platform});
    let seq = this.http.post<ResetPassword>(apiUrl + "/JPush/Logined", data, {
      headers: {
        "content-type": "application/json"
      },
      withCredentials: true
    })
    return seq;
  }
}
