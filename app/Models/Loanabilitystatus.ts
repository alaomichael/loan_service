
import { DateTime } from "luxon";
import { BaseModel, beforeCreate, column } from "@ioc:Adonis/Lucid/Orm";
import { v4 as uuid } from "uuid";

export default class Loanabilitystatus extends BaseModel {
  @column({ isPrimary: true })
  public id: string;

  @column()
  public walletId: string;

  @column()
  public userId: string;

  @column()
  public balance: number;

  @column()
  public recommendation: number;

  @column()
  public amountLoanable: number;

  @column()
  public lastLoanDuration: "7" | "14" | "21" | "30" | "45" | "60" | "90";

  @column()
  public tagName: string;

  @column()
  public currencyCode: string;

  @column()
  public bvn: string;

  @column()
  public isBvnVerified: boolean;

  @column()
  public totalNumberOfLoansCollected: number;

  @column()
  public totalAmountOfLoansCollected: number;

  @column()
  public totalAmountOfLoansRepaid: number;

  @column()
  public totalAmountOfLoansYetToBeRepaid: number;

  @column()
  public loanHistory: string;

  @column()
  public long: number;

  @column()
  public lat: number;

  @column()
  public creditRating: number;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column()
  public isDefaulter: boolean;

  @column()
  public isFirstLoan: boolean;

  @column()
  public status: string;

  @column()
  public timeline: string;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @beforeCreate()
  public static assignUuid(loanabilitystatus: Loanabilitystatus) {
    loanabilitystatus.id = uuid();
  }
}
