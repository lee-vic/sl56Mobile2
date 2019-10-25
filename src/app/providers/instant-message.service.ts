import { Injectable } from '@angular/core';
import { apiUrl } from '../global';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class InstantMessageService {
  constructor(public http: HttpClient) {
    console.log('Hello InstantMessageProvider Provider');
  }
  getUnReadMessage() {
    let seq = this.http.get<any>(apiUrl + "/InstantMessage/GetUnReadMessage", { withCredentials: true });
    return seq;
  }
  /**
   * 单号消息
   */
  getMessages1() {
    let seq = this.http.get<any>(apiUrl + "/InstantMessage/GetMessages1", { withCredentials: true });
    return seq;
  }
  /**
   * 售前咨询消息列表
   */
  getMessages2() {
    let seq = this.http.get<any>(apiUrl + "/InstantMessage/GetMessages2", { withCredentials: true });
    return seq;
  }
  getMessages3(receiveGoodsDetailId) {
    let paras = new HttpParams()
      .set("receiveGoodsDetailId", receiveGoodsDetailId);
    let seq = this.http.get<any>(apiUrl + "/InstantMessage/GetMessages3", { withCredentials: true, params: paras });
    return seq;
  }
}
