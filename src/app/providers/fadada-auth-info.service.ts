import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { apiUrl } from '../global';

@Injectable({
  providedIn: 'root'
})
export class FaDaDaAuthInfoService {

  constructor(public httpClient: HttpClient) { 

  }

  public getIsAuth(){
    let req = this.httpClient.get<boolean>(apiUrl + '/FaDaDa/IsAuth', { withCredentials: true });
    return req
  }
  public getAuthUrl() {
    let req = this.httpClient.get<string>(apiUrl + '/FaDaDa/GetAuthUrl', { withCredentials: true });
    return req
  }
}
