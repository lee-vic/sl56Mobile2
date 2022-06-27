import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Register } from '../interfaces/register';
import { apiUrl } from '../global';

@Injectable({
  providedIn: 'root'
})
export class DistributeRegisterService {

  constructor(public http: HttpClient) { }
  sendcode(phone:string){
    let seq = this.http.post<string>(apiUrl+"/Distribute/SendCode?phone="+phone,null,{ withCredentials:true});
    return seq;
  }
  register(form:Register){
    let data = JSON.stringify(form);
    let seq = this.http.post<string>(apiUrl + "/Distribute/Register", data, {
      headers: {
        "content-type": "application/json"
      },
      withCredentials: true
    })
    console.log("seq:",seq);
    return seq;
  }
}
