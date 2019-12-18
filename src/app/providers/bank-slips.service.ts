import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BankSlips } from '../interfaces/bank-slips';
import { ActionResult } from '../interfaces/action-result';
import { apiUrl } from '../global';

@Injectable({
  providedIn: 'root'
})
export class BankSlipsService {

  constructor(public http: HttpClient) {
 
  }

  upload(form){
    let data=JSON.stringify(form);
    let seq=this.http.post<ActionResult>(apiUrl + "/UploadBankSlips/Upload",data,{
      headers:{
        "content-type":"application/json"
      },
      withCredentials:true,
      responseType:"json"
    });
    return seq;
  }
  getList(pageIndex){
    let paras=new HttpParams()
    .set("pageIndex",pageIndex)
    let seq= this.http.get<Array<BankSlips>> (apiUrl+"/UploadBankSlips/GetList",{ withCredentials:true,params:paras});
    return seq;
  }
  delete(id){
    let paras=new HttpParams()
    .set("id",id);
    let seq= this.http.get<ActionResult> (apiUrl+"/UploadBankSlips/Delete",{ withCredentials:true,params:paras});
    return seq;
  }
}
