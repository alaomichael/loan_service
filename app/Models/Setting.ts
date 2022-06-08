import { DateTime } from "luxon";
import { column, beforeCreate, BaseModel } from "@ioc:Adonis/Lucid/Orm";
import { v4 as uuid } from "uuid";

export default class Setting extends BaseModel {
  @column({ isPrimary: true })
  public id: string;

  @column()
  public fundingWalletId: string;

  @column()
  public isDisbursementAutomated: boolean;

  @column()
  public fundingSourceTerminal: string;

  @column()
  public isLoanAutomated: boolean;

  @column()
  public isTerminationAutomated: boolean;

  @column()
  public tagName: string;

  @column()
  public currencyCode: string;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @beforeCreate()
  public static assignUuid(setting: Setting) {
    setting.id = uuid();
  }
}
