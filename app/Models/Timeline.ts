import { DateTime } from "luxon";
import { column, beforeCreate, BaseModel, belongsTo, BelongsTo } from "@ioc:Adonis/Lucid/Orm";
import { v4 as uuid } from "uuid";
import Loan from "./Loan";
export default class Timeline extends BaseModel {
  @column({ isPrimary: true })
  public id: string;

  @column()
  public loanId: string;

  @column()
  public action: string;

  @column()
  public message: string;

  @column()
  public meta: string;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @belongsTo(() => Loan, { localKey: "loanId" })
  public loan: BelongsTo<typeof Loan>;

  @beforeCreate()
  public static assignUuid(timeline: Timeline) {
    timeline.id = uuid();
  }
}


