import { DateTime } from "luxon";
import { column, beforeCreate, hasMany, HasMany } from "@ioc:Adonis/Lucid/Orm";
import { v4 as uuid } from "uuid";
import Timeline from "./Timeline";
import AppBaseModel from 'App/Models/AppBaseModel'

export default class Loan extends AppBaseModel {
  @column({ isPrimary: true })
  public id: string;

  @column()
  public walletId: string;

  @column()
  public userId: string;

  @column()
  public firstName: string;

  @column()
  public lastName: string;

  @column()
  public phone: string;

  @column()
  public email: string;

  @column()
  public savingsAccountNumber: string;

  @column()
  public loanAccountNumber: string;

  @column()
  public beneficiaryAccountNumber: string;

  @column()
  public beneficiaryAccountName: string;

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

  @column()
  public isOfferAccepted: boolean;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: false })
  public startDate: DateTime;

  @column.dateTime({ autoCreate: false })
  public repaymentDate: DateTime;

  @column()
  public isLoanApproved: boolean;

  @column()
  public acceptOffer: boolean;

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

  @column.dateTime({ autoCreate: false })
  public dateDisbursementWasDone: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @hasMany(() => Timeline, { localKey: "id" })
  public timelines: HasMany<typeof Timeline>;

  @beforeCreate()
  public static assignUuid(loan: Loan) {
    loan.id = uuid();
  }
}
