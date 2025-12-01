import { Injectable } from '@angular/core';
import { HttpClient, HttpParams} from '@angular/common/http'
import { Notice } from '../interfaces/notice';
import { apiUrl } from '../global';
@Injectable({
  providedIn: 'root'
})
export class NoticeService {

  constructor(public http: HttpClient) { }
  getNewsList(categoryId,pageIndex){
    let paras=new HttpParams()
    .set("categoryId",categoryId)
    .set("pageIndex",pageIndex)
    let seq= this.http.get<Array<Notice>> (apiUrl+"/Notice/GetData",{ withCredentials:true,params:paras});
    return seq;
  }
  getNoticeList(pageIndex){
    let paras=new HttpParams()
    .set("pageIndex",pageIndex)
    let seq= this.http.get<Array<Notice>> (apiUrl+"/Notice/GetList",{ withCredentials:true,params:paras});
    return seq;
  }
  getDetail(id){
    let paras=new HttpParams()
    .set("id",id)
    let seq= this.http.get<Notice> (apiUrl+"/Notice/Detail",{ withCredentials:true,params:paras});
    return seq;
  }
  getUnreadCount(){
    let seq= this.http.get<number> (apiUrl+"/Notice/GetUnreadCount",{ withCredentials:true});
    return seq;
  }
}
