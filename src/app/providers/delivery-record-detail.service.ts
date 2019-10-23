import { Injectable } from '@angular/core';

import { HttpParams, HttpClient } from '@angular/common/http';
import { apiUrl } from '../global';

@Injectable({
  providedIn: 'root'
})
export class DeliveryRecordDetailService {

  constructor(public http: HttpClient) { }
  getDetail(isLink:boolean, id){
    if(isLink)
      return this.getDetail2(id);
    else
      return this.getDetail1(id);
  }
  private getDetail1(id){
    let paras=new HttpParams()
    .set("id",id);
    let seq= this.http.get(apiUrl+"/DeliveryRecord/Detail",{ withCredentials:true,params:paras});
    return seq;
  }
  private getDetail2(id){
    let paras=new HttpParams()
    .set("id",id);
    let seq= this.http.get(apiUrl+"/DeliveryRecord/Detail1",{ withCredentials:true,params:paras});
    return seq;
  }
}
