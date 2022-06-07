import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import Approval from "App/Models/Approval";
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
      duration,
      limit,
      amount,
      investmentType,
      rolloverCode,
      status,
      productName,
      interestRate,
    } = request.qs();
    console.log("Wallet query line 19: ", request.qs());
    // const countActiveRates = await Wallet.query()
    //   .where("status", "active")
    //   .getCount();
    // console.log("Wallet Investment count: ", countActiveRates);
    // const countSuspended = await Wallet.query().where('status', 'suspended').getCount()
    // console.log('Terminated Investment count: ', countSuspended)
    // const wallet = await Wallet.query().offset(0).limit(1)
    const wallet = await Wallet.all();
    let sortedRates = wallet;
    if (amount) {
      // @ts-ignore
      sortedRates = await Wallet.query()
        .where("lowest_amount", "<=", amount)
        .andWhere("highest_amount", ">=", amount);
    }

    if (duration) {
      sortedRates = sortedRates.filter((wallet) => {
        console.log(" Wallet Duration:", wallet.duration);
        console.log(" Query Duration:", duration);
        // @ts-ignore
        return wallet.duration === duration;
      });
    }

    if (investmentType) {
      sortedRates = sortedRates.filter((wallet) => {
        // @ts-ignore
        return wallet.investmentType!.includes(investmentType);
      });
    }

    if (rolloverCode) {
      sortedRates = sortedRates.filter((wallet) => {
        // @ts-ignore
        return wallet.rolloverCode!.includes(rolloverCode);
      });
    }

    if (productName) {
      sortedRates = sortedRates.filter((wallet) => {
        // @ts-ignore
        return wallet.productName!.includes(productName);
      });
    }
    if (status) {
      sortedRates = sortedRates.filter((wallet) => {
        // @ts-ignore
        return wallet.status === `${status}`;
      });
    }

    if (interestRate) {
      sortedRates = sortedRates.filter((wallet) => {
        // @ts-ignore
        return wallet.interestRate === parseInt(interestRate);
      });
    }
    if (limit) {
      sortedRates = sortedRates.slice(0, Number(limit));
    }
    console.log("sortedRates line 79: ", sortedRates);

    if (sortedRates.length < 1) {
      return response.status(200).json({
        status: "OK",
        message: "no investment wallet matched your search",
        data: [],
      });
    }
    // return wallet(s)
    return response.status(200).json({
      status: "OK",
      data: sortedRates.map((wallet) => wallet.$original),
    });
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
      walletDetails: schema.object().members({}),
      status: schema.string({ escape: true }, [rules.maxLength(20)]),
    });
    const payload: any = await request.validate({ schema: walletSchema });
console.log("The new investment:", payload);
    const wallet = await Wallet.create(payload);
    await wallet.save();
    console.log("The new investment:", wallet);

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
      const { productName, rateId } = request.qs();
      console.log("Wallet query: ", request.qs());
      // let wallet = await Wallet.query().where({
      //   product_name: request.input('productName'),
      //   id: request.input('rateId'),
      // })
      let wallet = await Wallet.query().where({
        product_name: productName,
        id: rateId,
      });
      console.log(" QUERY RESULT: ", wallet);
      if (wallet.length > 0) {
        console.log("Investment wallet Selected for Update:", wallet);
        if (wallet) {
          wallet[0].productName = request.input("newProductName")
            ? request.input("newProductName")
            : wallet[0].productName;
          wallet[0].lowestAmount = request.input("lowestAmount")
            ? request.input("lowestAmount")
            : wallet[0].lowestAmount;
          wallet[0].highestAmount = request.input("highestAmount")
            ? request.input("highestAmount")
            : wallet[0].highestAmount;
          wallet[0].duration = request.input("duration")
            ? request.input("duration")
            : wallet[0].duration;
          wallet[0].rolloverCode = request.input("rolloverCode")
            ? request.input("rolloverCode")
            : wallet[0].rolloverCode;
          wallet[0].investmentType = request.input("investmentType")
            ? request.input("investmentType")
            : wallet[0].investmentType;
          wallet[0].interestRate = request.input("interestRate")
            ? request.input("interestRate")
            : wallet[0].interestRate;
          wallet[0].tagName = request.input("tagName")
            ? request.input("tagName")
            : wallet[0].tagName;
          wallet[0].additionalDetails = request.input("additionalDetails")
            ? request.input("additionalDetails")
            : wallet[0].additionalDetails;
          wallet[0].long = request.input("long")
            ? request.input("long")
            : wallet[0].long;
          wallet[0].lat = request.input("lat")
            ? request.input("lat")
            : wallet[0].lat;
          wallet[0].status = request.input("status")
            ? request.input("status")
            : wallet[0].status;

          if (wallet) {
            // send to user
            await wallet[0].save();
            console.log("Update Investment wallet:", wallet);
            return response.status(200).json({
              status: "OK",
              data: wallet.map((wallet) => {
                return wallet.$original;
              }),
            });
          }
          return; // 422
        } else {
          return response.status(304).json({ status: "FAILED", data: wallet });
        }
      } else {
        return response
          .status(404)
          .json({
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
    // let id = request.input('rateId')
    const { productName, rateId } = request.qs();
    console.log("Wallet query: ", request.qs());
    // let wallet = await Wallet.query().where({
    //   product_name: request.input('productName'),
    //   id: request.input('rateId'),
    // })
    let wallet = await Wallet.query().where({
      product_name: productName,
      id: rateId,
    });
    console.log(" QUERY RESULT: ", wallet);

    if (wallet.length > 0) {
      wallet = await Wallet.query()
        .where({
          product_name: productName,
          id: rateId,
        })
        .delete();
      console.log("Deleted data:", wallet);
      return response.send("Wallet Delete.");
    } else {
      return response
        .status(404)
        .json({ status: "FAILED", message: "Invalid parameters" });
    }
  }
}
