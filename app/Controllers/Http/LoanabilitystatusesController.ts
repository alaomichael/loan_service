/* eslint-disable prettier/prettier */
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import Loanabilitystatus from "App/Models/Loanabilitystatus";
// import Payout from "App/Models/Payout";
// import PayoutRecord from "App/Models/PayoutRecord";
import { schema, rules } from "@ioc:Adonis/Core/Validator";
import Event from "@ioc:Adonis/Core/Event";
import { DateTime } from "luxon";
import { v4 as uuid } from "uuid";
import Env from "@ioc:Adonis/Core/Env";
// const axios = require('axios').default
// const API_URL = Env.get('API_URL')
import {
  generateRate,
  interestDueOnLoan,
  dueForRepayment,
  repaymentDueDate,
  approvalRequest,
  sendPaymentDetails,
  investmentRate,
  // @ts-ignore
} from "App/Helpers/utils";

import Approval from "App/Models/Approval";
import Wallet from "App/Models/Wallet";
export default class LoanabilitystatusesController {
  public async store({ request, response }: HttpContextContract) {
    // const user = await auth.authenticate()
    const investmentSchema = schema.create({
      walletId: schema.string({ escape: true }),
      userId: schema.string.optional({ escape: true }),
      recommendation: schema.number.optional(),
      amountLoanable: schema.number.optional(),
      bvn: schema.string.optional({ escape: true }, [
        rules.minLength(11),
        rules.maxLength(11),
      ]),
      isBvnVerified: schema.boolean.optional(),
      totalNumberOfLoansCollected: schema.number.optional(),
      totalAmountOfLoansCollected: schema.number.optional(),
      totalAmountOfLoansRepaid: schema.number.optional(),
      totalAmountOfLoansYetToBeRepaid: schema.number.optional(),
      long: schema.number.optional(),
      lat: schema.number.optional(),
      creditRating: schema.number.optional(),
      isDefaulter: schema.boolean.optional(),
      isFirstLoan: schema.boolean.optional(),
      status: schema.string.optional({ escape: true }, [rules.maxLength(5)]),
      timeline: schema.string.optional({ escape: true }),
    });
    const payload: any = await request.validate({ schema: investmentSchema });
    console.log("Payload line 1010  :", payload);
    // check BVN status
    let bvnIsVerified = await Wallet.query()
      .where({ bvn: payload.bvn, isBvnVerified: true })
      .first();
    if (!bvnIsVerified) {
      return response.json({
        status: "FAILED",
        message: "BVN is not verified.",
      });
    } else {
      payload.isBvnVerified = true;
    }



  console.log("Payload line 69  :", payload);
  const loan = await Loanabilitystatus.create(payload);
  await loan.save();
  console.log("The new loan recommendation:", loan);

      // TODO
      // Send Loanabilitystatus Payload To Admin

      // Send Loanabilitystatus Initiation Message to Queue

 let newLoanId = loan.id;
      // Send to Notificaation Service
      // @ts-ignore
      let newLoanEmail = loan.loanAccountDetails.email;
      Event.emit("new:loan", {
        id: newLoanId,
        email: newLoanEmail,
      });
      return response.status(201).json({ status: "OK", data: loan.$original });
    }

}
