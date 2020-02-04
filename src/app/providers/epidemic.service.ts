import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { apiUrl } from '../global';

@Injectable({
  providedIn: 'root'
})
export class EpidemicService {

  constructor(public http: HttpClient) { }
  submit(form){
    let seq = this.http.post(apiUrl + "/Epidemic/Save", form, {
      headers: {
        "content-type": "application/json"
      },
      withCredentials: true,
      responseType: "text"
    })
    return seq;
  }
}
