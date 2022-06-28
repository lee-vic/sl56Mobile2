import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { UnifiedOrderResult } from '../interfaces/unified-order-result';
import { apiUrl } from '../global';

@Injectable({
  providedIn: 'root'
})
export class WechatPayService {

  constructor(public http: HttpClient) { }
  getList(openid){
    let paras=new HttpParams()
    .set("openId",openid);
    let seq= this.http.get(apiUrl+"/WeChatPay/Query",{ withCredentials:true,params:paras});
    return seq;
  }
  pay(data){
    let seq= this.http.post<UnifiedOrderResult>(apiUrl+"/WeChatPay/Pay",data,{ withCredentials:true});
    return seq;
  }
  getProductTypes(){
    let seq= this.http.get(apiUrl+"/WeChatPay/GetPrductTypes",{ withCredentials:true});
    return seq;
  }
}
