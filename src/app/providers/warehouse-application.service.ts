import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { WarehouseApplication, WarehouseApplicationListResult, WarehouseApplicationResult } from '../interfaces/warehouse-application';
import { apiUrl } from '../global';
import { ActionResult } from '../interfaces/action-result';

@Injectable({
    providedIn: 'root'
})
export class WarehouseApplicationService {

    constructor(private http: HttpClient) { }

    getList(pageIndex: number) {
        const params = new HttpParams()
            .set('pageIndex', pageIndex.toString());
        return this.http.get<WarehouseApplicationListResult>(
            `${apiUrl}/WarehouseTask/GetList`,
            { params, withCredentials: true }
        );
    }

    save(application: WarehouseApplication) {
        //id为0时是新增
        if (application.Id === 0) {
            application.Id = null;
        }
        return this.http.post<ActionResult>(
            `${apiUrl}/WarehouseTask/Save`,
            application,
            {
                headers: { 'Content-Type': 'application/json' },
                withCredentials: true
            }
        );
    }

    cancel(id: number) {
      return this.http.post<ActionResult>(
        `${apiUrl}/WarehouseTask/Cancel`,
        { id: id },
        { withCredentials: true }
      );
    }

  detail(id: number) {
    const params = new HttpParams()
      .set('id', id.toString());
    return this.http.get<WarehouseApplicationResult>(
      `${apiUrl}/WarehouseTask/Detail`,
      { params, withCredentials: true }
    );
  }

  pay(data) {
    return this.http.post<any>(
      `${apiUrl}/WarehouseTask/Pay`,
      data,
      {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true }
    );
  }
}
