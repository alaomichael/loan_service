/* eslint-disable prettier/prettier */
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import Loanabilitystatus from "App/Models/Loanabilitystatus";
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

import Wallet from "App/Models/Wallet";
export default class LoanabilitystatusesController {
  public async store({ request, response }: HttpContextContract) {
    // const user = await auth.authenticate()
    const recommendationSchema = schema.create({
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
      status: schema.string.optional({ escape: true }, [rules.maxLength(20)]),
      timeline: schema.string.optional({ escape: true }),
    });
    const payload: any = await request.validate({ schema: recommendationSchema });
    console.log("Payload line 1010  :", payload);
    // check BVN status
    // let bvnIsVerified = await Wallet.query()
    //   .where({ bvn: payload.bvn, isBvnVerified: true })
    //   .first();
    // if (!bvnIsVerified) {
    //   return response.json({
    //     status: "FAILED",
    //     message: "BVN is not verified.",
    //   });
    // } else {
    //   payload.isBvnVerified = true;
    // }

    console.log("Payload line 69  :", payload);
    const recommendation = await Loanabilitystatus.create(payload);
    await recommendation.save();
    console.log("The new loan recommendation:", recommendation);

    // TODO
    // Send Loanabilitystatus Payload To Admin

    // Send Loanabilitystatus Initiation Message to Queue

    let newLoanrecommendationId = recommendation.id;
    // Send to Notificaation Service
    // @ts-ignore
    Event.emit("new:recommendation", {
      id: newLoanrecommendationId,
    });
    return response.status(201).json({ status: "OK", data: recommendation.$original });
  }

  public async index({ params, request, response }: HttpContextContract) {
    console.log("Wallet params: ", params);
    const {
      currencyCode,
      balance,
      //   bvn,
      //   isBvnVerified,
      //   walletDetails,
      //   long,
      //   lat,
      creditRating,
      //   totalAmountToRepay,
      requestType,
      approvalStatus,
      status,
      tagName,
      limit,
    } = request.qs();
    console.log("Recommendation query line 19: ", request.qs());
    // const recommendation = await Loanabilitystatus.query().offset(0).limit(1)
    const recommendation = await Loanabilitystatus.all();
    let sortedRecommendations = recommendation;
    if (balance) {
      // @ts-ignore
      sortedRecommendations = await Loanabilitystatus.query()
        .where("recommendation", "<=", balance)
        .andWhere("recommendation", ">=", balance);
    }

    if (currencyCode) {
      sortedRecommendations = sortedRecommendations.filter((recommendation) => {
        // @ts-ignore
        return recommendation.currencyCode === currencyCode;
      });
    }

    if (tagName) {
      sortedRecommendations = sortedRecommendations.filter((recommendation) => {
        // @ts-ignore
        return recommendation.tagName!.includes(tagName);
      });
    }

    if (requestType) {
      sortedRecommendations = sortedRecommendations.filter((recommendation) => {
        // @ts-ignore
        return recommendation.requestType!.includes(requestType);
      });
    }

    if (approvalStatus) {
      sortedRecommendations = sortedRecommendations.filter((recommendation) => {
        // @ts-ignore
        return recommendation.approvalStatus!.includes(approvalStatus);
      });
    }
    if (status) {
      sortedRecommendations = sortedRecommendations.filter((recommendation) => {
        // @ts-ignore
        return recommendation.status === `${status}`;
      });
    }

    if (creditRating) {
      sortedRecommendations = sortedRecommendations.filter((recommendation) => {
        // @ts-ignore
        return recommendation.creditRating === parseInt(creditRating);
      });
    }
    if (limit) {
      sortedRecommendations = sortedRecommendations.slice(0, Number(limit));
    }
    console.log("sortedRecommendations line 79: ", sortedRecommendations);

    if (sortedRecommendations.length < 1) {
      return response.status(200).json({
        status: "OK",
        message: "no recommendation matched your search",
        data: [],
      });
    }
    // return recommendation(s)
    return response.status(200).json({
      status: "OK",
      data: sortedRecommendations.map(
        (recommendation) => recommendation.$original
      ),
    });
  }

  public async showByWalletId({
    params,
    request,
    response,
  }: HttpContextContract) {
    console.log("Loan params: ", params);
    const { walletId } = request.params();
    try {
      let recommendation = await Loanabilitystatus.query()
        .where({ id: walletId })
        .first();
      // .with('timeline')
      // .orderBy('timeline', 'desc')
      // .fetch()
      if (!recommendation) return response.status(404).json({ status: "FAILED" });
      return response
        .status(200)
        .json({ status: "OK", data: recommendation.$original });
    } catch (error) {
      console.log(error);
    }
  }


  public async update({ request, response }: HttpContextContract) {
    try {
        const walletSchema = schema.create({
           currencyCode: schema.string.optional({ escape: true }, [
            rules.maxLength(5),
          ]),
          balance: schema.number.optional(),
          bvn: schema.string.optional({ escape: true }, [
            rules.minLength(11),
            rules.maxLength(11),
          ]),
          isBvnVerified: schema.boolean.optional(),
          tagName: schema.string.optional({ escape: true }, [
            rules.maxLength(100),
          ]),
          long: schema.number.optional(),
          lat: schema.number.optional(),
          walletDetails: schema.object.optional().members({
            name: schema.string.optional({ escape: true }, [
              rules.maxLength(50),
            ]),
            phoneNumber: schema.string.optional({ escape: true }, [
              rules.maxLength(11),
            ]),
            email: schema.string.optional({ escape: true }, [
              rules.maxLength(50),
              rules.email(),
            ]),
          }),
          status: schema.string.optional({ escape: true }, [
            rules.maxLength(20),
          ]),
        });
        const payload: any = await request.validate({ schema: walletSchema });
        console.log("The new recommendation:", payload);
      const { walletId } = request.qs();
      console.log("Wallet query: ", request.qs());
      let {
        currencyCode,
        balance,
        bvn,
        isBvnVerified,
        walletDetails,
        long,
        lat,
        tagName,
        creditRating,
        totalAmountToRepay,
        status,
      } = request.body();
      // let recommendation = await Loanabilitystatus.query().where({
      //   product_name: request.input('productName'),
      //   id: request.input('rateId'),
      // })
      let recommendation = await Loanabilitystatus.query()
        .where({
          id: walletId,
        })
        .first();
      console.log(" QUERY RESULT: ", recommendation);
      if (recommendation !== null) {
        console.log("Wallet recommendation Selected for Update:", recommendation);
        if (recommendation) {
          recommendation.currencyCode = currencyCode
            ? currencyCode
            : recommendation.currencyCode;
          recommendation.balance = balance
            ? balance
            : recommendation.balance;
          recommendation.bvn = bvn ? bvn : recommendation.bvn;
          recommendation.isBvnVerified =  isBvnVerified !== recommendation.isBvnVerified &&
          isBvnVerified !== undefined &&
          isBvnVerified !== null
            ? isBvnVerified
            : recommendation.isBvnVerified;
                  recommendation.long = long
            ? long
            : recommendation.long;
          recommendation.lat = lat ? lat : recommendation.lat;

          recommendation.creditRating = creditRating
            ? creditRating
            : recommendation.creditRating;
           recommendation.status = status
            ? status
            : recommendation.status;

          if (recommendation) {
            // send to user
            await recommendation.save();
            console.log("Update Loanabilitystatus recommendation:", recommendation);
            return response.status(200).json({
              status: "OK",
              data: recommendation.$original,
            });
          }
          return; // 422
        } else {
          return response.status(304).json({ status: "FAILED", data: recommendation });
        }
      } else {
        return response.status(404).json({
          status: "FAILED",
          message: "No data match your query parameters",
        });
      }
    } catch (error) {
      console.log(error);
      console.error(error.messages);
      return response.status(404).json({
        status: "FAILED",
        message: error.messages.errors,
      });
    }
    // return // 401
  }

  public async destroy({ request, response }: HttpContextContract) {
    const { walletId } = request.qs();
    console.log("Wallet query: ", request.qs());

    let recommendation = await Loanabilitystatus.query().where({
      id: walletId,
    });
    console.log(" QUERY RESULT: ", recommendation);

    if (recommendation.length > 0) {
      recommendation = await Loanabilitystatus.query()
        .where({
          id: walletId,
        })
        .delete();
      console.log("Deleted data:", recommendation);
      return response.send("Loanabilitystatus Deleted.");
    } else {
      return response
        .status(404)
        .json({ status: "FAILED", message: "Invalid parameters" });
    }
  }
}
