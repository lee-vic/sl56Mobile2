import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { SubAccount } from '../interfaces/sub-account';
import { apiUrl } from '../global';

@Injectable({
  providedIn: 'root'
})
export class SubAccountService {

  constructor(public http: HttpClient) {
    console.log('Hello SubAccountProvider Provider');
  }
  getList(){
    let seq= this.http.get<Array<SubAccount>>(apiUrl+"/SubAccount/GetList",{ withCredentials:true});
    return seq;
  }
  detail(id){
    let paras=new HttpParams()
    .set("id",id);
    let seq= this.http.get<SubAccount>(apiUrl+"/SubAccount/Detail",{ withCredentials:true,params:paras});
    return seq;
  }
  edit(data:SubAccount){
   
    let seq= this.http.post(apiUrl+"/SubAccount/Edit",data,{ withCredentials:true});
    return seq;
  }
  create(data:SubAccount){
    let seq= this.http.post<SubAccount>(apiUrl+"/SubAccount/Create",data,{ withCredentials:true});
    return seq;
  }
  delete(id){
    let paras=new HttpParams()
    .set("id",id);
    let seq= this.http.get(apiUrl+"/SubAccount/Delete",{ withCredentials:true,params:paras});
    return seq;
  }
}
