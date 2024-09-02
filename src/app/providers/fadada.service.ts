import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { apiUrl } from '../global';
import { FaDaDaAuthResult } from '../interfaces/fadada-auth-result';
import { FadadaSignTask } from '../interfaces/fadada-sign-task';

@Injectable({
  providedIn: 'root'
})
export class FadadaService {

  constructor(public http: HttpClient) { }

  getIsAuth() {
    let seq = this.http.get<boolean>(apiUrl + "/FaDaDa/IsAuth", { withCredentials: true });
    return seq;
  }

  submitAuthResult(data: FaDaDaAuthResult) {
    let postData = JSON.stringify(data);
    let seq = this.http.post(apiUrl + "/FaDaDa/SubmitAuthResult", postData, { headers: { "content-type": "application/json" }, withCredentials: true });
    return seq;
  }

  getSignTasks() {
    let seq = this.http.get<Array<FadadaSignTask>>(apiUrl + "/FaDaDa/GetSignTasks", { withCredentials: true });
    return seq;
  }

  getSignTaskUrl(signTaskId, actorId) {
    let params = new HttpParams();
    params = params.append("signTaskId", signTaskId);
    params = params.append("actorId", actorId);
    let seq = this.http.get<string>(apiUrl + "/FaDaDa/GetSignTaskUrl", { withCredentials: true , params: params});
    return seq;
  }

  getSignTaskPreviewUrl(signTaskId) {
    let params = new HttpParams();
    params = params.append("signTaskId", signTaskId);
    let seq = this.http.get<string>(apiUrl + "/FaDaDa/GetSignTaskPreviewUrl", { withCredentials: true , params: params});
    return seq;
  }
}
