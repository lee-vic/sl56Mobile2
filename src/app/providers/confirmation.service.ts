import { Injectable } from '@angular/core';
import { apiUrl } from '../global';
import { DeliveryRecord } from '../interfaces/delivery-record';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ConfirmationService {

  constructor(private http: HttpClient) { }
  getReceiveGoodsDetailList(){
    let seq= this.http.get<Array<DeliveryRecord>>(apiUrl + "/Confirmation/GetReceiveGoodsDetailList",{
      headers:{
        "content-type":"application/json"
      },
      withCredentials:true,
      responseType:"json"
    });
    return seq;
  }
  confirm(selectIdList:string){
   
   let data={"SelectIdList":selectIdList};
    let seq= this.http.post<Array<DeliveryRecord>>(apiUrl + "/Confirmation/Confirm",data,{
      headers:{
        "content-type":"application/json"
      },
      withCredentials:true,
      responseType:"json"
    });
    return seq;
  }
}
