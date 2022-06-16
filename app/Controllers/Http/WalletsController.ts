import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
// import Approval from "App/Models/Approval";
import Wallet from "App/Models/Wallet";
import Loanabilitystatus from "App/Models/Loanabilitystatus";
import { schema, rules } from "@ioc:Adonis/Core/Validator";
import Event from "@ioc:Adonis/Core/Event";
// import { DateTime } from 'luxon'
// import Env from '@ioc:Adonis/Core/Env'
// const axios = require('axios').default

// const API_URL = Env.get('API_URL')

export default class WalletsController {
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
    console.log("Wallet query line 19: ", request.qs());
    // const countActiveRates = await Wallet.query()
    //   .where("status", "active")
    //   .getCount();
    // console.log("Wallet Wallet count: ", countActiveRates);
    // const countSuspended = await Wallet.query().where('status', 'suspended').getCount()
    // console.log('Terminated Wallet count: ', countSuspended)
    // const wallet = await Wallet.query().offset(0).limit(1)
    const wallet = await Wallet.all();
    let sortedRates = wallet;
    if (balance) {
      // @ts-ignore
      sortedRates = await Wallet.query()
        .where("balance", "<=", balance)
        .andWhere("balance", ">=", balance);
    }

    if (currencyCode) {
      sortedRates = sortedRates.filter((wallet) => {
        // @ts-ignore
        return wallet.currencyCode === currencyCode;
      });
    }

    if (tagName) {
      sortedRates = sortedRates.filter((wallet) => {
        // @ts-ignore
        return wallet.tagName!.includes(tagName);
      });
    }

    if (requestType) {
      sortedRates = sortedRates.filter((wallet) => {
        // @ts-ignore
        return wallet.requestType!.includes(requestType);
      });
    }

    if (approvalStatus) {
      sortedRates = sortedRates.filter((wallet) => {
        // @ts-ignore
        return wallet.approvalStatus!.includes(approvalStatus);
      });
    }
    if (status) {
      sortedRates = sortedRates.filter((wallet) => {
        // @ts-ignore
        return wallet.status === `${status}`;
      });
    }

    if (creditRating) {
      sortedRates = sortedRates.filter((wallet) => {
        // @ts-ignore
        return wallet.creditRating === parseInt(creditRating);
      });
    }
    if (limit) {
      sortedRates = sortedRates.slice(0, Number(limit));
    }
    console.log("sortedRates line 79: ", sortedRates);

    if (sortedRates.length < 1) {
      return response.status(200).json({
        status: "OK",
        message: "no wallet wallet matched your search",
        data: [],
      });
    }
    // return wallet(s)
    return response.status(200).json({
      status: "OK",
      data: sortedRates.map((wallet) => wallet.$original),
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
      let wallet = await Wallet.query().where({ id: walletId }).first();
      // .with('timeline')
      // .orderBy('timeline', 'desc')
      // .fetch()
      if (!wallet) return response.status(404).json({ status: "FAILED" });
      return response
        .status(200)
        .json({ status: "OK", data: wallet.$original });
    } catch (error) {
      console.log(error);
    }
  }

  public async store({ request, response }: HttpContextContract) {
    // const user = await auth.authenticate()
    const walletSchema = schema.create({
      currencyCode: schema.string({ escape: true }, [rules.maxLength(5)]),
      balance: schema.number(),
      bvn: schema.string({ escape: true }, [
        rules.minLength(11),
        rules.maxLength(11),
      ]),
      tagName: schema.string({ escape: true }, [rules.maxLength(100)]),
      long: schema.number(),
      lat: schema.number(),
      walletDetails: schema.object().members({
        name: schema.string({ escape: true }, [rules.maxLength(50)]),
        phoneNumber: schema.string({ escape: true }, [rules.maxLength(11)]),
        email: schema.string({ escape: true }, [
          rules.maxLength(50),
          rules.email(),
        ]),
      }),
      status: schema.string({ escape: true }, [rules.maxLength(20)]),
    });
    const payload: any = await request.validate({ schema: walletSchema });
    console.log("The new wallet:", payload);
    const wallet = await Wallet.create(payload);
    await wallet.save();
    console.log("The new wallet:", wallet);

    console.log("A New Wallet has been Created.");
    let loanabilityObject = {
      walletId: wallet.id,
      currencyCode: wallet.currencyCode,
      bvn:wallet.bvn,
      isBvnVerified:wallet.isBvnVerified,
      long:wallet.long,
      lat:wallet.lat,
    }

    const loanRecommendation = await Loanabilitystatus.create(
      loanabilityObject
    );
    console.log("The new loanabilitystatus ,line 170:", loanRecommendation)
    // Send Wallet Creation Message to Queue
    // @ts-ignore
    Event.emit("new:wallet", { id: wallet.id, extras: wallet.walletDetails });
    return response.status(200).json({
      status: "OK",
      data: wallet.$original,
    });
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
        console.log("The new wallet:", payload);
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
      // let wallet = await Wallet.query().where({
      //   product_name: request.input('productName'),
      //   id: request.input('rateId'),
      // })
      let wallet = await Wallet.query()
        .where({
          id: walletId,
        })
        .first();
      console.log(" QUERY RESULT: ", wallet);
      if (wallet !== null) {
        console.log("Wallet wallet Selected for Update:", wallet);
        if (wallet) {
          wallet.currencyCode = currencyCode
            ? currencyCode
            : wallet.currencyCode;
          wallet.balance = balance
            ? balance
            : wallet.balance;
          wallet.bvn = bvn ? bvn : wallet.bvn;
          wallet.isBvnVerified =  isBvnVerified !== wallet.isBvnVerified &&
          isBvnVerified !== undefined &&
          isBvnVerified !== null
            ? isBvnVerified
            : wallet.isBvnVerified;
          wallet.walletDetails = walletDetails
            ? walletDetails
            : wallet.walletDetails;
          wallet.long = long
            ? long
            : wallet.long;
          wallet.lat = lat ? lat : wallet.lat;
          wallet.tagName = tagName
            ? tagName
            : wallet.tagName;
          wallet.creditRating = creditRating
            ? creditRating
            : wallet.creditRating;
          wallet.totalAmountToRepay = totalAmountToRepay
            ? totalAmountToRepay
            : wallet.totalAmountToRepay;
          wallet.status = status
            ? status
            : wallet.status;

          if (wallet) {
            // send to user
            await wallet.save();
            console.log("Update Wallet wallet:", wallet);
            return response.status(200).json({
              status: "OK",
              data: wallet.$original,
            });
          }
          return; // 422
        } else {
          return response.status(304).json({ status: "FAILED", data: wallet });
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

    let wallet = await Wallet.query().where({
      id: walletId,
    });
    console.log(" QUERY RESULT: ", wallet);

    if (wallet.length > 0) {
      wallet = await Wallet.query()
        .where({
          id: walletId,
        })
        .delete();
      console.log("Deleted data:", wallet);
      return response.send("Wallet Deleted.");
    } else {
      return response
        .status(404)
        .json({ status: "FAILED", message: "Invalid parameters" });
    }
  }
}
