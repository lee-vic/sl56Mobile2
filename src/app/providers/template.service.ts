import { Injectable } from '@angular/core';
import { HttpParams, HttpClient } from '@angular/common/http';
import { Template } from '../interfaces/template';
import { apiUrl } from '../global';

@Injectable({
  providedIn: 'root'
})
export class TemplateService {

  constructor(public http: HttpClient) { }
  getList(pageIndex){
    let paras=new HttpParams()
    .set("pageIndex",pageIndex)
    let seq= this.http.get<Array<Template>> (apiUrl+"/Template/GetList",{ withCredentials:true,params:paras});
    return seq;
  }
}
