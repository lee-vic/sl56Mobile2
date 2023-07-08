export class WeightBill {
    
    ObjectId: number;
    /// <summary>
    /// 毛重
    /// </summary>
    GrossWeight: number;
    /// <summary>
    /// 净重
    /// </summary>
    NetWeight: number;
    /// <summary>
    /// 皮重
    /// </summary>
    TareWeight: number;
    /// <summary>
    /// 车牌
    /// </summary>
    VehicleNo: string;
    UnitOfWeight: string;
    Amount: number;
    WxOpenId: string;
    /// <summary>
    /// JSAPI 公众号支付
    /// NATIVE 扫码支付
    /// MWEB H5支付
    /// </summary>
    TradeType: string;
    /// <summary>
    /// 磅单文件路径
    /// </summary>
    BillPath: string;
}