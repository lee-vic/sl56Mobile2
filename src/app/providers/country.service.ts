import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { apiUrl } from '../global';
import { Country } from '../interfaces/country';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CountryService {

  constructor(private http: HttpClient) {
   
  }
  getCoutryList():Observable<Array<Country>>{
    let seq= this.http.get<Array<Country>>(apiUrl + "/common/GetCountryList",{
      withCredentials:true,
      responseType:"json"
    });
    return seq;
  }

}
