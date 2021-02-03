import { Injectable } from '@angular/core';
import { HttpClient,HttpParams } from '@angular/common/http';
import { apiUrl } from '../global';

@Injectable({
  providedIn: 'root'
})
export class MessageSubscriptionService {

  constructor(public http:HttpClient) { }

  getOfficialAccountMessageSubscription(){
    let res = this.http.get<any>(apiUrl + '/MessageSubscription/GetOfficialAccountMessageSubscriptions', { withCredentials: true });
    return res;
  }

  getSMSMessageSubscription(){
    let res = this.http.get<any>(apiUrl + '/MessageSubscription/GetSMSMessageSubscriptions', { withCredentials: true });
    return res;
  }

  getEmailMessageSubscription(){
    let res = this.http.get<any>(apiUrl + '/MessageSubscription/GetEmailMessageSubscriptions', { withCredentials: true });
    return res;
  }

  getMessageTypes(type){
    let params = new HttpParams()
                .set("subscriptionType",type);
    let res = this.http.get<any>(apiUrl + '/MessageSubscription/GetMessageTypes', { withCredentials: true ,params:params});
    return res;
  }

  subscribeWechatMessageType(type,data){
    let params = new HttpParams()
                .set("type",type);
    let res = this.http.post<any>(apiUrl + '/MessageSubscription/SubscribeWechatMessageType',data, { withCredentials: true ,params:params});
    return res;
  }
}
