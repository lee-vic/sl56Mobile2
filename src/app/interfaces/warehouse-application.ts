import { ActionResult } from './action-result';

export interface WarehouseApplication {
    Id: number;
    ReferenceNumber: string;//单号
    Piece: number;//件数
    Source: string;//送货方式
    Amount: number;//金额
    Status: number;//0初始，1已收款，2已入仓，9已取消
}

export interface WarehouseApplicationResult extends ActionResult {
    Data?: WarehouseApplication;
}

export interface WarehouseApplicationListResult extends ActionResult {
    Data?: Array<WarehouseApplication>;
}
