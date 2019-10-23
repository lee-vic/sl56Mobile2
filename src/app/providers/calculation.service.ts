import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { apiUrl } from '../global';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CalculationService {

  constructor(private http: HttpClient) { }
  getModeOfTransportList(){
    
    let seq=this.http.get(apiUrl + "/common/GetModeOfTransportList",{
      withCredentials:true,
      responseType:"json"
    })
    return seq;
  }
  calculate(form):Observable< Array<any>>{
    let data=JSON.stringify(form);
    console.log(data);
    let seq=this.http.post<Array<any>>(apiUrl + "/Calculation/Calculate",data,{
      headers:{
        "content-type":"application/json"
      },
      withCredentials:true,
      responseType:"json"
    });
    return seq;
  }
  getVolumetricDivisorList(){
    let seq= this.http.get(apiUrl + "/common/GetVolumetricDivisorList",{
      withCredentials:true,
      responseType:"json"
    })
    return seq;
  }
}
