import { Injectable } from '@angular/core';
import { HttpParams, HttpClient } from '@angular/common/http';
import { DeliveryRecord } from '../interfaces/delivery-record';
import { apiUrl } from '../global';

@Injectable({
  providedIn: 'root'
})
export class DeliveryRecordService {

  constructor(public http: HttpClient) { }
  private getList(pageIndex){
    let paras=new HttpParams()
    .set("pageIndex",pageIndex);
    let seq= this.http.get<Array<DeliveryRecord>>(apiUrl+"/DeliveryRecord/GetList",{ withCredentials:true,params:paras});
    return seq;
  }
  private searchList(pageIndex,key){
    let paras=new HttpParams()
    .set("pageIndex",pageIndex)
    .set("key",key);
    let seq= this.http.get<Array<DeliveryRecord>>(apiUrl+"/DeliveryRecord/SearchList",{ withCredentials:true,params:paras});
    return seq;
  }
  loadList(pageIndex,key:string){

    if(key&&key.trim() != ''){
      return this.searchList(pageIndex,key.toUpperCase());
    }
    else{
      return this.getList(pageIndex);
    }
  }
}
