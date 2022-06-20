import { DateTime } from "luxon";
import {
  column,
  beforeCreate,
  hasMany,
  HasMany,
} from "@ioc:Adonis/Lucid/Orm";
import { v4 as uuid } from "uuid";
import LoanTenure from "./LoanTenure";
import AppBaseModel from 'App/Models/AppBaseModel'


export default class Product extends AppBaseModel {
   @column({ isPrimary: true })
  public id: string;

  @column()
  public productName: string;

  @column()
  public lowestAmount: number;

  @column()
  public highestAmount: number;

  @column()
  public interestRate: number;

  @column()
  public tagName: string;

  @column()
  public currencyCode: string;

  @column()
  public additionalDetails: string;

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

  @hasMany(() => LoanTenure, { localKey: "id" })
  public loanTenures: HasMany<typeof LoanTenure>;

  // @hasMany(() => LoanTenure, { foreignKey: "rateId" })
  // public loanTenures: HasMany<typeof LoanTenure>;

  // @hasOne(() => LoanTenure)
  // public loanTenure: HasOne<typeof LoanTenure>;

  @beforeCreate()
  public static assignUuid(product: Product) {
    product.id = uuid();
  }
}
