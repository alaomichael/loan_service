import { DateTime } from "luxon";
import { column, beforeCreate, BaseModel, hasMany, HasMany } from "@ioc:Adonis/Lucid/Orm";
import { v4 as uuid } from "uuid";
import LoanTenure from "./LoanTenure";

export default class Rate extends BaseModel {
  @column({ isPrimary: true })
  public id: string;

  @column()
  public productName: string;

  @column()
  public lowestAmount: number;

  @column()
  public highestAmount: number;

  @column()
  public rateId: string;

  @column()
  public interestRate: number;

  @column()
  public tagName: string;

  @column()
  public currencyCode: string;

  @column()
  public additionalDetails: JSON;

  @column()
  public long: number;

  @column()
  public lat: number;

  @column()
  public status: string;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;


  @hasMany(()=> LoanTenure, {foreignKey: "rateId"})
  public loanTenures:HasMany<typeof LoanTenure>;

  @beforeCreate()
  public static assignUuid(rate: Rate) {
    rate.id = uuid();
  }
}
