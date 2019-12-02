import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { PriceInfoList } from '../interfaces/price';
import { apiUrl } from '../global';

@Injectable({
  providedIn: 'root'
})
export class PriceService {

  constructor(public http: HttpClient) {
    console.log('Hello PriceProvider Provider');
  }
  getList(pageIndex){
    let paras=new HttpParams()
    .set("pageIndex",pageIndex)
    let seq= this.http.get<PriceInfoList> (apiUrl+"/Price/GetList",{ withCredentials:true,params:paras});
    return seq;
  }
}
