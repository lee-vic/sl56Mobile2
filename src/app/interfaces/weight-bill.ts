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
  //测量日期
  WeightingDate: string;
  // 单据状态.0:初始状态.1:创建了微信支付订单，但是还没有收到支付成功通知的。2:已成功支付
  Status;
  //是否月结
  IsMonthly: Boolean;
  //客户输入的过磅费。只是打印在榜单上的金额。与实际收费金额无关.如果用户未输入，默认实际支付金额
  WeighingFee:number;
  //企业账号，如果数据库有对应记录。不收取过磅费用
  CorporateAccount:number;
  //过磅费选项，见UI的选项值
  PricePerTon:number;
}
