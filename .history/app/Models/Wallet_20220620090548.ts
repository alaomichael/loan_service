
import { DateTime } from "luxon";
import { beforeCreate, column, hasOne, HasOne } from "@ioc:Adonis/Lucid/Orm";
import { v4 as uuid } from "uuid";
import Loanabilitystatus from "./Loanabilitystatus";
import AppBaseModel from 'App/Models/AppBaseModel'

export default class Wallet extends AppBaseModel {
  @column({ isPrimary: true })
  public id: string;

  @column()
  public currencyCode: string;

  @column()
  public balance: number;

  @column()
  public bvn: string;

  @column()
  public isBvnVerified: boolean;

  @column()
  public walletDetails: strin;

  @column()
  public long: number;

  @column()
  public lat: number;

  @column()
  public creditRating: number;

  @column()
  public totalAmountToRepay: number;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column()
  public requestType: string;

  @column()
  public approvalStatus: string;

  @column()
  public status: string;

  @column()
  public timeline: string;

  @column()
  public tagName: string;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @hasOne(() => Loanabilitystatus, { localKey: "id" })
  public loanabilitystatus: HasOne<typeof Loanabilitystatus>;

  @beforeCreate()
  public static assignUuid(wallet: Wallet) {
    wallet.id = uuid();
  }
}
