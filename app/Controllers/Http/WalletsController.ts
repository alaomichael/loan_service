import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
// import Approval from "App/Models/Approval";
import Wallet from "App/Models/Wallet";
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


  public async showByWalletId({ params, request, response }: HttpContextContract) {
    console.log('Loan params: ', params)
    const { walletId } = request.params()
    try {
      let wallet = await Wallet.query()
        .where({ id: walletId })
        .first()
        // .with('timeline')
        // .orderBy('timeline', 'desc')
        // .fetch()
      if (!wallet) return response.status(404).json({ status: 'FAILED' })
      return response.status(200).json({ status: 'OK', data: wallet.$original })
    } catch (error) {
      console.log(error)
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
      const {  walletId } = request.qs();
      console.log("Wallet query: ", request.qs());
      // let wallet = await Wallet.query().where({
      //   product_name: request.input('productName'),
      //   id: request.input('rateId'),
      // })
      let wallet = await Wallet.query().where({
        id: walletId,
      }).first();
      console.log(" QUERY RESULT: ", wallet);
      if (wallet !== null) {
        console.log("Wallet wallet Selected for Update:", wallet);
        if (wallet) {
          wallet.currencyCode = request.input("currencyCode")
            ? request.input("currencyCode")
            : wallet.currencyCode;
          wallet.balance = request.input("balance")
            ? request.input("balance")
            : wallet.balance;
          wallet.bvn = request.input("bvn")
            ? request.input("bvn")
            : wallet.bvn;
          wallet.isBvnVerified = request.input("isBvnVerified")
            ? request.input("isBvnVerified")
            : wallet.isBvnVerified;
          wallet.walletDetails = request.input("walletDetails")
            ? request.input("walletDetails")
            : wallet.walletDetails;
          wallet.long = request.input("long")
            ? request.input("long")
            : wallet.long;
          wallet.lat = request.input("lat")
            ? request.input("lat")
            : wallet.lat;
          wallet.tagName = request.input("tagName")
            ? request.input("tagName")
            : wallet.tagName;
          wallet.creditRating = request.input("creditRating")
            ? request.input("creditRating")
            : wallet.creditRating;
          wallet.totalAmountToRepay = request.input("totalAmountToRepay")
            ? request.input("totalAmountToRepay")
            : wallet.totalAmountToRepay;
          wallet.status = request.input("status")
            ? request.input("status")
            : wallet.status;

          if (wallet) {
            // send to user
            await wallet.save();
            console.log("Update Wallet wallet:", wallet);
            return response.status(200).json({
              status: "OK",
              data:  wallet.$original,
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
      console.error(error);
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
