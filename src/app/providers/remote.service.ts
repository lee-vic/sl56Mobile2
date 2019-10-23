import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { apiUrl } from '../global';

@Injectable({
  providedIn: 'root'
})
export class RemoteService {

  constructor(private http: HttpClient) {
   
  }
  getModeOfTransportTypeList(){
    let seq= this.http.get(apiUrl + "/common/GetModeOfTransportTypeList",{ withCredentials:true});
    return seq;
  }
  Query(formValue){
    let seq= this.http.post(apiUrl + "/Remote/Query", formValue,{ withCredentials:true});
    return seq;
  }
}
