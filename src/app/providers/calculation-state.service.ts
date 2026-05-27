import { Injectable } from '@angular/core';

type CalculationRecord = Record<string, unknown>;

@Injectable({
  providedIn: 'root',
})
export class CalculationStateService {
  private calculationResults: Array<CalculationRecord> | null = null;
  private currentDetail: CalculationRecord | null = null;

  setCalculationResults(results: Array<CalculationRecord>): void {
    this.calculationResults = Array.isArray(results) ? [...results] : [];
  }

  getCalculationResults(): Array<CalculationRecord> | null {
    return this.calculationResults ? [...this.calculationResults] : null;
  }

  setCurrentDetail(detail: CalculationRecord | null): void {
    this.currentDetail = detail ? { ...detail } : null;
  }

  getCurrentDetail(): CalculationRecord | null {
    return this.currentDetail ? { ...this.currentDetail } : null;
  }

  clearCurrentDetail(): void {
    this.currentDetail = null;
  }

  clearAll(): void {
    this.calculationResults = null;
    this.currentDetail = null;
  }
}
