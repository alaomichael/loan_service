import { DateTime } from 'luxon'
import { beforeCreate, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import Product from './Product';
import { v4 as uuid } from "uuid";
import AppBaseModel from 'App/Models/AppBaseModel'


export default class LoanTenure extends AppBaseModel {
  @column({ isPrimary: true })
  public id: string;

  @column({})
  public productId: string;

  @column({})
  public tenure: string;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @belongsTo(() => Product, { localKey: "productId" })
  public product: BelongsTo<typeof Product>;

  @beforeCreate()
  public static assignUuid(loantenure: LoanTenure) {
    loantenure.id = uuid();
  }
}
