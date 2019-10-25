import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { apiUrl } from '../global';

@Injectable({
  providedIn: 'root'
})
export class WechatBindingService {

  constructor(public http: HttpClient) {
    console.log('Hello WechatBindingProvider Provider');
  }
  getList(){
    let seq= this.http.get(apiUrl+"/WeChatBind/GetData",{ withCredentials:true});
    return seq;
  }
  delete(id){
    let paras=new HttpParams()
    .set("id",id);
    let seq= this.http.get(apiUrl+"/WeChatBind/Delete",{ withCredentials:true,params:paras});
    return seq;
  }

}
