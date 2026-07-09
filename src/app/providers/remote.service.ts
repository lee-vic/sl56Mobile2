import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { apiUrl } from '../global';

@Injectable({
  providedIn: 'root'
})
export class RemoteService {

  constructor(private http: HttpClient) {
   
  }
  Query(formValue){
    let seq= this.http.post<any>(apiUrl + "/Remote/Query", formValue,{ withCredentials:true});
    return seq;
  }
  GetESD(formValue){
    let seq = this.http.post<any>(apiUrl + "/Remote/GetESD", formValue, { withCredentials:true });
    return seq;
  }
  CountryHasPostcode(countryId: number){
    let seq = this.http.post<any>(apiUrl + "/Remote/CountryHasPostcode", { CountryId: countryId }, { withCredentials:true });
    return seq;
  }
}
