export class Size {
  Piece: number;
  Weight: number;
  Height: number;
  Length: number;
  Width: number;
  SelectedPriceRuleTemplateIds: Array<number>;
  TemplateRules:Array<PieceRule>;
}

export class PieceRule{
  ObjectId: number;
  ObjectName: string;
  Checked:boolean
}