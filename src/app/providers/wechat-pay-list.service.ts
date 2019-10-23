import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { WechatPay } from '../interfaces/wechat-pay';
import { apiUrl } from '../global';

@Injectable({
  providedIn: 'root'
})
export class WechatPayListService {

  constructor(public http: HttpClient) {
    
  }
  getList(pageIndex){
    let paras=new HttpParams()
    .set("pageIndex",pageIndex)
    let seq= this.http.get<Array<WechatPay>>(apiUrl+"/WeChatPay/History",{ withCredentials:true,params:paras});
    return seq;
  }
}
