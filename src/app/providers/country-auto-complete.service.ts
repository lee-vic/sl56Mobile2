import { Injectable } from '@angular/core';
import { CountryService } from './country.service';
import { Country } from '../interfaces/country';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CountryAutoCompleteService {
  countryList:Array<Country>=[];
  labelAttribute = 'Name';
  formValueAttribute = 'Id';
  constructor(private countryService:CountryService) { 
    this.countryService.getCoutryList().subscribe(res=>this.countryList=res);
  }
  getResults(keyword:string) {
    if (!keyword) { return false; }

    var result= this.countryList.filter(function (item) {
      return item.Name.toLowerCase().includes(keyword.toLowerCase());
    });
    return result;
 }
}
