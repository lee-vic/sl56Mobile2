import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { apiUrl } from '../global';
import { InquiryResult } from '../interfaces/quote-inquiry';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: "root",
})
export class CalculationService {
  constructor(private http: HttpClient) {}
  parseInquiry(text: string): Observable<InquiryResult> {
    return this.http.post<InquiryResult>(apiUrl + '/Calculation/ParseInquiry', { InquiryText: text }, {
      headers: { 'Content-Type': 'application/json' }, withCredentials: true
    });
  }

  getPriceRuleTemplateInfoList() {
    let seq = this.http.get(apiUrl + "/common/GetRuleList", {
      withCredentials: true,
      responseType: "json",
    });
    return seq;
  }
  getModeOfTransportList() {
    let seq = this.http.get(apiUrl + "/common/GetModeOfTransportList", {
      withCredentials: true,
      responseType: "json",
    });
    return seq;
  }
  GetPieceRuleTemplates() {
    let seq = this.http.get<Array<any>>(apiUrl + "/Calculation/GetPieceRuleTemplates", {
      withCredentials: true,
      responseType: "json",
    });
    return seq;
  }
  calculate(form): Observable<Array<any>> {
    let data = JSON.stringify(form);
    let seq = this.http.post<Array<any>>(
      apiUrl + "/Calculation/Calculate",
      data,
      {
        headers: {
          "content-type": "application/json",
        },
        withCredentials: true,
        responseType: "json",
      }
    );
    return seq;
  }
  getVolumetricDivisorList() {
    let seq = this.http.get(apiUrl + "/common/GetVolumetricDivisorList", {
      withCredentials: true,
      responseType: "json",
    });
    return seq;
  }
}
