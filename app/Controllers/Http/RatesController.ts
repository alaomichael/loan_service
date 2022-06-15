import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import Rate from "App/Models/Rate";
import { schema, rules } from "@ioc:Adonis/Core/Validator";
import Event from "@ioc:Adonis/Core/Event";
import LoanTenure from "App/Models/LoanTenure";
const Env = require("@ioc:Adonis/Core/Env");
const axios = require("axios").default;
// const JSJoda = require('js-joda')
// const LocalDate = JSJoda.LocalDate
// const Moment = require('moment')
const API_URL = Env.get("API_URL");

export default class RatesController {
  public async index({ params, request, response }: HttpContextContract) {
    console.log("Rate params: ", params);
    const { duration, limit, amount, status, productName, interestRate } =
      request.qs();
    console.log("Rate query line 19: ", request.qs());

    // const countSuspended = await Rate.query().where('status', 'suspended').getCount()
    // console.log('Terminated Investment count: ', countSuspended)
    // const rate = await Rate.query().offset(0).limit(1)
    let products = await Rate.query().preload("loanTenures");
    let tenuresResult;
    //   try {
    //            tenuresResult = foo(rate);
    // console.log("Tenures Result: ", tenuresResult);
    //   } catch (error) {
    //     console.log(error)
    //   }
    // async function getTenures(rate) {
    //   var data = await rate.map(async (rate) => {
    //     //@ts-ignore
    //     let id = rate.id;
    //     let singleRate = await Rate.query()
    //       .where({ id: id })
    //       .preload("loanTenures")
    //       .first();
    //     //  console.log(" Rate singleRate : ", singleRate);
    //     //@ts-ignore
    //     const rateTenure = await singleRate.$preloaded.loanTenures.map(
    //       (tenure) => tenure.$original.tenure
    //     );
    //     console.log(" Rate Tenures : ", rateTenure);
    //     // return rate(s)
    //     let rateData1 = { ...rate.$original, loanTenures: rateTenure };
    //     console.log(" Rate Tenures with data : ", rateData1);
    //     return rateData1;
    //     //  return singleRate;
    //   });
    //   console.log(" Preload Rate with Tenures : ", data);
    //   // code here only executes _after_ the request is done
    //   return data; // 'data' is defined
    // }


    // function successCallback(result) {
    //   console.log("Rate ready at URL: " + result);
    //   return result;
    // }

    // function failureCallback(error) {
    //   console.error("Error getting rate: " + error);
    // }
    // async function foo(rate) {
    //   try {
    //     const result = await getTenures(rate).then(successCallback(response));
    //     // const newResult = await doSomethingElse(result);
    //     // const finalResult = await doThirdThing(newResult);
    //     console.log(`Got the final result: await ${result}`);
    //     return result;
    //   } catch (error) {
    //     failureCallback(error);
    //   }
    // }
    // const address = await foo(rate)
    //   // axios.get(`${API_URL}/loans/wallets`)
    //   .then((response) => {
    //     console.log("Response ========================== :", response);
    //     return response;
    //   })
    //   .then((user) => {
    //     return user; //.address;
    //   });

    // const printAddress = async () => {
    //   const a = await address;
    //   console.log("   RATE RESULT *******************  ", a);
    //   return a;
    // };

    // let itIsWorking = await printAddress();
    // console.log("Rate ready at itIsWorking: " + (await itIsWorking));

    // const repaymentDueDate =  (rate) => {
    //   return new Promise( (resolve, reject) => {
    //     if (!rate) {
    //       reject(new Error("Incomplete parameters or out of range"));
    //     }
    //     // let payoutDueDate;
    //     var data =  rate.map( async (singleRate) => {
    //       //@ts-ignore
    //       let id = singleRate.id;
    //       let singleRateTenure = await Rate.query()
    //         .where({ id: id })
    //         .preload("loanTenures")
    //         .first();
    //       //  console.log(" Rate singleRate : ", singleRate);
    //       //@ts-ignore
    //       const rateTenure =  singleRateTenure!.$preloaded.loanTenures.map(
    //         (tenure) => tenure.$original.tenure
    //       );
    //       console.log(" Rate Tenures : ", rateTenure);
    //       // return rate(s)
    //       let rateData1 =  { ...singleRateTenure!.$original, loanTenures: rateTenure };
    //       console.log(" Rate Tenures with data : ", rateData1);
    //       return rateData1;
    //       //  return singleRate;
    //     });
    //     console.log(" Preload Rate with Tenures line 119 : ", data);
    //     // code here only executes _after_ the request is done
    //     // return data;
    //     return resolve(data);
    //   });
    // };

    // console.log(
    //   " Rate repayment Due Date %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%: ",
    //   await repaymentDueDate(rate)
    // );


    //    " Rate repayment Due Date %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%: "
    //    await repaymentDueDate(rate).finally(() => {})


    let sortedRates =  products;
    if (amount) {
      // @ts-ignore
      sortedRates = await Rate.query()
        .where("lowest_amount", "<=", amount)
        .andWhere("highest_amount", ">=", amount);
    }

    if (duration) {
      sortedRates = await sortedRates.filter((rate) => {
        console.log(" Rate Duration:", rate);
        console.log(" Query Duration:", duration);
        const fruits = ["🍎", "🍋", "🍊", "🍇", "🍍", "🍐"];

        fruits.includes("🍇"); // true
        fruits.includes("🍉"); // false

        // @ts-ignore
        // return rate.loanTenures.find(duration);
      });
    }
    if (productName) {
      sortedRates = sortedRates.filter((rate) => {
        // @ts-ignore
        return rate.productName!.includes(productName);
      });
    }
    if (status) {
      sortedRates = sortedRates.filter((rate) => {
        // @ts-ignore
        return rate.status === `${status}`;
      });
    }

    if (interestRate) {
      sortedRates = sortedRates.filter((rate) => {
        // @ts-ignore
        return rate.interestRate === parseInt(interestRate);
      });
    }
    if (limit) {
      sortedRates = sortedRates.slice(0, Number(limit));
    }
    console.log("sortedRates line 79: ", await sortedRates);

    if (sortedRates.length < 1) {
      return response.status(200).json({
        status: "OK",
        message: "no loan rate matched your search",
        data: [],
      });
    }
    // return rate(s)
    let rateData = await sortedRates;
    return response.status(200).json({
      status: "OK",
      data: rateData.map((rate) => rate.$original),
    });
  }

  public async show({ request, params, response }: HttpContextContract) {
    console.log("Params :", request.qs());
    const rate = await Rate.query()
      .where({ id: params.id })
      .preload("loanTenures")
      .first();

    if (!rate) {
      return response.status(200).json({
        status: "OK",
        message: "no loan rate matched your search",
        data: [],
      });
    }

    // const rateTenure = await rate.load("loanTenures");
    // console.log(" Rate tenures: ", rateTenure);
    console.log(
      " Rate ================= : ",
      await rate.$preloaded.loanTenures[0]
    );
    //@ts-ignore
    const rateTenure = await rate.$preloaded.loanTenures.map(
      (tenure) => tenure.$original.tenure
    );
    console.log(" Rate Tenures : ", rateTenure);
    // return rate(s)
    let rateData = { ...rate.$original, loanTenures: rateTenure };
    return response.status(200).json({
      status: "OK",
      data: rateData,
    });
  }

  public async store({ request, response }: HttpContextContract) {
    // const user = await auth.authenticate()
    try {
      const rateSchema = schema.create({
        productName: schema.string({ escape: true }, [rules.maxLength(20)]),
        lowestAmount: schema.number(),
        highestAmount: schema.number(),
        duration: schema.array().members(schema.string()),
        interestRate: schema.number(),
        tagName: schema.string({ escape: true }, [rules.maxLength(100)]),
        currencyCode: schema.string({ escape: true }, [rules.maxLength(5)]),
        additionalDetails: schema.object().members({}),
        long: schema.number.optional(),
        lat: schema.number.optional(),
        status: schema.string({ escape: true }, [rules.maxLength(20)]),
      });
      const payload: any = await request.validate({ schema: rateSchema });
      const tenures = payload.duration;
      // let duration = payload.duration;
      // console.log("The new rate duration:", duration);
      // payload.duration = JSON.stringify(duration);
      let {
        productName,
        lowestAmount,
        highestAmount,
        interestRate,
        tagName,
        currencyCode,
        additionalDetails,
        long,
        lat,
        status,
      } = payload;

      let payload2 = {
        productName,
        lowestAmount,
        highestAmount,
        interestRate,
        tagName,
        currencyCode,
        additionalDetails,
        long,
        lat,
        status,
      };
      const rate = await Rate.create(payload2);
      await rate.save();

      console.log("The new loan rate:", rate);

      console.log("A New Rate has been Created.");

      tenures.forEach(async (tenure) => {
        let duration = await LoanTenure.create({ tenure, rateId: rate.id });

        console.log("The new duration is: ", duration);
      });
      // Save Rate new status to Database
      await rate.save();
      // Send Rate Creation Message to Queue

      // @ts-ignore
      Event.emit("new:rate", { id: rate.id, extras: rate.additionalDetails });
      return response.status(200).json({
        status: "OK",
        data: rate.$original,
      });
    } catch (error) {
      console.log(error);
      console.error(error.messages);
      return response.status(404).json({
        status: "FAILED",
        message: error.messages.errors,
      });
    }
  }

  public async update({ request, response }: HttpContextContract) {
    try {
      const { productName, rateId } = request.qs();
      console.log("Rate query: ", request.qs());
      const rateSchema = schema.create({
        productName: schema.string.optional({ escape: true }, [
          rules.maxLength(20),
        ]),
        lowestAmount: schema.number.optional(),
        highestAmount: schema.number.optional(),
        duration: schema.array.optional().members(schema.string()),
        interestRate: schema.number.optional(),
        tagName: schema.string.optional({ escape: true }, [
          rules.maxLength(100),
        ]),
        currencyCode: schema.string.optional({ escape: true }, [
          rules.maxLength(5),
        ]),
        additionalDetails: schema.object.optional().members({}),
        long: schema.number.optional(),
        lat: schema.number.optional(),
        status: schema.string.optional({ escape: true }, [rules.maxLength(20)]),
      });
      const payload: any = await request.validate({ schema: rateSchema });
      console.log("Rate update payload: ", payload);
      // let rate = await Rate.query().where({
      //   product_name: request.input('productName'),
      //   id: request.input('rateId'),
      // })
      let rate = await Rate.query()
        .where({
          product_name: productName,
          id: rateId,
        })
        .first();
      console.log(" QUERY RESULT: ", rate);
      if (!rate)
        return response.json({
          status: "FAILED",
          message: "No data match your query parameters",
        });
      if (rate) {
        console.log("Loan rate Selected for Update:", rate);
        if (rate) {
          rate.productName = request.input("newProductName")
            ? request.input("newProductName")
            : rate.productName;
          rate.lowestAmount = request.input("lowestAmount")
            ? request.input("lowestAmount")
            : rate.lowestAmount;
          rate.highestAmount = request.input("highestAmount")
            ? request.input("highestAmount")
            : rate.highestAmount;
          rate.duration = request.input("duration")
            ? request.input("duration")
            : rate.duration;
          rate.interestRate = request.input("interestRate")
            ? request.input("interestRate")
            : rate.interestRate;
          rate.tagName = request.input("tagName")
            ? request.input("tagName")
            : rate.tagName;
          rate.additionalDetails = request.input("additionalDetails")
            ? request.input("additionalDetails")
            : rate.additionalDetails;
          rate.long = request.input("long") ? request.input("long") : rate.long;
          rate.lat = request.input("lat") ? request.input("lat") : rate.lat;
          rate.status = request.input("status")
            ? request.input("status")
            : rate.status;

          if (rate) {
            //  do the following to be able to save the array in the database
            let duration;
            duration = JSON.stringify(rate.duration);
            console.log("The new rate duration:", duration);
            rate.duration = duration;
            // send to user
            await rate.save();
            console.log("Updated Loan rate:", rate);
            return response.status(200).json({
              status: "OK",
              data: rate.$original,
            });
          }
          return; // 422
        } else {
          return response.status(304).json({ status: "FAILED", data: rate });
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
    // let id = request.input('rateId')
    const { productName, rateId } = request.qs();
    console.log("Rate query: ", request.qs());
    // let rate = await Rate.query().where({
    //   product_name: request.input('productName'),
    //   id: request.input('rateId'),
    // })
    let rate = await Rate.query().where({
      product_name: productName,
      id: rateId,
    });
    console.log(" QUERY RESULT: ", rate);

    if (rate.length > 0) {
      rate = await Rate.query()
        .where({
          product_name: productName,
          id: rateId,
        })
        .delete();
      console.log("Deleted data:", rate);
      return response.send("Rate Delete.");
    } else {
      return response
        .status(404)
        .json({ status: "FAILED", message: "Invalid parameters" });
    }
  }
}
