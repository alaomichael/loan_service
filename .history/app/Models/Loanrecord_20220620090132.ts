import { DateTime } from 'luxon'
import { beforeCreate, column } from '@ioc:Adonis/Lucid/Orm'
import { v4 as uuid } from "uuid";
import AppBaseModel from 'App/Models/AppBaseModel'

export default class Loanrecord extends AppBaseModel {
  @column({ isPrimary: true })
  public id: string;

  @column()
  public walletId: string;

  @column()
  public amountRequested: number;

  @column()
  public amountApproved: number;

  @column()
  public duration: string;

  @column()
  public tagName: string;

  @column()
  public currencyCode: string;

  @column()
  public bvn: string;

  @column()
  public isBvnVerified: boolean;

  @column()
  public loanAccountDetails: JSON;

  @column()
  public long: number;

  @column()
  public lat: number;

  @column()
  public creditRating: number;

  @column()
  public interestRate: number;

  @column()
  public interestDueOnLoan: number;

  @column()
  public totalAmountToRepay: number;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: false })
  public startDate: DateTime;

  @column.dateTime({ autoCreate: false })
  public repaymentDate: DateTime;

  @column()
  public isLoanApproved: boolean;

  @column()
  public isDisbursementSuccessful: boolean;

  @column()
  public isRepaymentSuccessful: boolean;

  @column()
  public requestType: string;

  @column()
  public approvalStatus: string;

  @column()
  public status: string;

  @column()
  public timeline: string;

  @column.dateTime({ autoCreate: false })
  public dateDisbursementWasDone: DateTime;


  @column.dateTime({ autoCreate: false })
  public datePaymentWasDone: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @beforeCreate()
  public static assignUuid(loanrecord: Loanrecord) {
    loanrecord.id = uuid();
  }
}
