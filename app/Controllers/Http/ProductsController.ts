import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import Product from "App/Models/Product";
import { schema, rules } from "@ioc:Adonis/Core/Validator";
import Event from "@ioc:Adonis/Core/Event";
import LoanTenure from "App/Models/LoanTenure";
const Env = require("@ioc:Adonis/Core/Env");
const axios = require("axios").default;
// const JSJoda = require('js-joda')
// const LocalDate = JSJoda.LocalDate
// const Moment = require('moment')
const API_URL = Env.get("API_URL");
export default class ProductsController {
  public async index({ params, request, response }: HttpContextContract) {
    console.log("Product params: ", params);
    const { duration, limit, amount, status, productName, interestRate } =
      request.qs();
    console.log("Product query line 19: ", request.qs());

    // const countSuspended = await Product.query().where('status', 'suspended').getCount()
    // console.log('Terminated Investment count: ', countSuspended)
    // const product = await Product.query().offset(0).limit(1)
    let products = await Product.query()
      .preload("loanTenures")

    console.log("products Result, line 23: ", products);
    let tenuresResult;
    //   try {
    //            tenuresResult = foo(product);
    // console.log("Tenures Result: ", tenuresResult);
    //   } catch (error) {
    //     console.log(error)
    //   }
    // async function getTenures(product) {
    //   var data = await product.map(async (product) => {
    //     //@ts-ignore
    //     let id = product.id;
    //     let singleProduct = await Product.query()
    //       .where({ id: id })
    //       .preload("loanTenures")
    //       .first();
    //     //  console.log(" Product singleProduct : ", singleProduct);
    //     //@ts-ignore
    //     const rateTenure = await singleProduct.$preloaded.loanTenures.map(
    //       (tenure) => tenure.$original.tenure
    //     );
    //     console.log(" Product Tenures : ", rateTenure);
    //     // return product(s)
    //     let rateData1 = { ...product.$original, loanTenures: rateTenure };
    //     console.log(" Product Tenures with data : ", rateData1);
    //     return rateData1;
    //     //  return singleProduct;
    //   });
    //   console.log(" Preload Product with Tenures : ", data);
    //   // code here only executes _after_ the request is done
    //   return data; // 'data' is defined
    // }

    // function successCallback(result) {
    //   console.log("Product ready at URL: " + result);
    //   return result;
    // }

    // function failureCallback(error) {
    //   console.error("Error getting product: " + error);
    // }
    // async function foo(product) {
    //   try {
    //     const result = await getTenures(product).then(successCallback(response));
    //     // const newResult = await doSomethingElse(result);
    //     // const finalResult = await doThirdThing(newResult);
    //     console.log(`Got the final result: await ${result}`);
    //     return result;
    //   } catch (error) {
    //     failureCallback(error);
    //   }
    // }
    // const address = await foo(product)
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
    // console.log("Product ready at itIsWorking: " + (await itIsWorking));

    // const repaymentDueDate =  (product) => {
    //   return new Promise( (resolve, reject) => {
    //     if (!product) {
    //       reject(new Error("Incomplete parameters or out of range"));
    //     }
    //     // let payoutDueDate;
    //     var data =  product.map( async (singleProduct) => {
    //       //@ts-ignore
    //       let id = singleProduct.id;
    //       let singleProductTenure = await Product.query()
    //         .where({ id: id })
    //         .preload("loanTenures")
    //         .first();
    //       //  console.log(" Product singleProduct : ", singleProduct);
    //       //@ts-ignore
    //       const rateTenure =  singleProductTenure!.$preloaded.loanTenures.map(
    //         (tenure) => tenure.$original.tenure
    //       );
    //       console.log(" Product Tenures : ", rateTenure);
    //       // return product(s)
    //       let rateData1 =  { ...singleProductTenure!.$original, loanTenures: rateTenure };
    //       console.log(" Product Tenures with data : ", rateData1);
    //       return rateData1;
    //       //  return singleProduct;
    //     });
    //     console.log(" Preload Product with Tenures line 119 : ", data);
    //     // code here only executes _after_ the request is done
    //     // return data;
    //     return resolve(data);
    //   });
    // };

    // console.log(
    //   " Product repayment Due Date %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%: ",
    //   await repaymentDueDate(product)
    // );

    //    " Product repayment Due Date %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%: "
    //    await repaymentDueDate(product).finally(() => {})

    let sortedProducts = products;
    if (amount) {
      // @ts-ignore
      sortedProducts = await Product.query()
        .where("lowest_amount", "<=", amount)
        .andWhere("highest_amount", ">=", amount)
        .preload("loanTenures");
    }

    if (duration) {
      sortedProducts = await sortedProducts.filter(async (product) => {
          // @ts-ignore
          console.log(" Product Duration:", await product.$preloaded.loanTenures.map((product) => product.tenure));
        console.log(" Query Duration:", duration);
        const fruits = ["🍎", "🍋", "🍊", "🍇", "🍍", "🍐"];

        fruits.includes("🍇"); // true
        fruits.includes("🍉"); // false

        // @ts-ignore
        return await product.$preloaded.loanTenures.map((product) => product.tenure).includes(duration);
      });
    }
    if (productName) {
      sortedProducts = sortedProducts.filter((product) => {
        // @ts-ignore
        return product.productName!.includes(productName);
      });
    }
    if (status) {
      sortedProducts = sortedProducts.filter((product) => {
        // @ts-ignore
        return product.status === `${status}`;
      });
    }

    if (interestRate) {
      sortedProducts = sortedProducts.filter((product) => {
        // @ts-ignore
        return product.interestRate === parseInt(interestRate);
      });
    }
    if (limit) {
      sortedProducts = sortedProducts.slice(0, Number(limit));
    }
    console.log("sortedProducts line 79: ", await sortedProducts);

    if (sortedProducts.length < 1) {
      return response.status(200).json({
        status: "OK",
        message: "no loan product matched your search",
        data: [],
      });
    }
    // return product(s)
    let productData = await sortedProducts;
    //  { ...product.$original, loanTenures: productTenure };
    return response.status(200).json({
      status: "OK",
      data: productData.map((product) => {
          console.log("Preloaded Tenures :",product.$preloaded.loanTenures[0]);
         let singleProduct = {
           product: product.$original,
           // @ts-ignore
           tenure: product.$preloaded.loanTenures.map((product) => product.tenure),
         };
return singleProduct;
        }),
    });
  }

  public async show({ request, params, response }: HttpContextContract) {
    console.log("Params :", request.qs());
    const product = await Product.query()
      .where({ id: params.id })
      .preload("loanTenures")
      .first();

    if (!product) {
      return response.status(200).json({
        status: "OK",
        message: "no loan product matched your search",
        data: [],
      });
    }

    // const productTenure = await product.load("loanTenures");
    // console.log(" Product tenures: ", productTenure);
    console.log(
      " Product ================= : ",
      await product.$preloaded.loanTenures[0]
    );
    //@ts-ignore
    const productTenure = await product.$preloaded.loanTenures.map(
      (tenure) => tenure.$original.tenure
    );
    console.log(" Product Tenures : ", productTenure);
    // return product(s)
    let productData = { ...product.$original, loanTenures: productTenure };
    return response.status(200).json({
      status: "OK",
      data: productData,
    });
  }

  public async store({ request, response }: HttpContextContract) {
    // const user = await auth.authenticate()
    try {
      const productSchema = schema.create({
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
      const payload: any = await request.validate({ schema: productSchema });
      const tenures = payload.duration;
      // let duration = payload.duration;
      // console.log("The new product duration:", duration);
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
      const product = await Product.create(payload2);
      await product.save();

      console.log("The new loan product:", product);

      console.log("A New Product has been Created.");

      tenures.forEach(async (tenure) => {
        let duration = await LoanTenure.create({ tenure, productId: product.id });

        console.log("The new duration is: ", duration);
      });
      // Save Product new status to Database
      await product.save();
      // Send Product Creation Message to Queue

      // @ts-ignore
      Event.emit("new:product", { id: product.id, extras: product.additionalDetails });
      return response.status(200).json({
        status: "OK",
        data: product.$original,
      });
    } catch (error) {
      console.log(error);
    //   console.error(error.messages);
      return response.status(404).json({
        status: "FAILED",
        message: error,
      });
    }
  }

  public async update({ request, response }: HttpContextContract) {
    try {
      const { productName, productId } = request.qs();
      console.log("Product query: ", request.qs());
      const productSchema = schema.create({
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
      const payload: any = await request.validate({ schema: productSchema });
      console.log("Product update payload: ", payload);
      // let product = await Product.query().where({
      //   product_name: request.input('productName'),
      //   id: request.input('productId'),
      // })
      let product = await Product.query()
        .where({
          product_name: productName,
          id: productId,
        })
        .first();
      console.log(" QUERY RESULT: ", product);
      if (!product)
        return response.json({
          status: "FAILED",
          message: "No data match your query parameters",
        });
      if (product) {
        console.log("Loan product Selected for Update:", product);
        if (product) {
          product.productName = request.input("newProductName")
            ? request.input("newProductName")
            : product.productName;
          product.lowestAmount = request.input("lowestAmount")
            ? request.input("lowestAmount")
            : product.lowestAmount;
          product.highestAmount = request.input("highestAmount")
            ? request.input("highestAmount")
            : product.highestAmount;
        //   product.duration = request.input("duration")
        //     ? request.input("duration")
        //     : product.duration;
          product.interestRate = request.input("interestRate")
            ? request.input("interestRate")
            : product.interestRate;
          product.tagName = request.input("tagName")
            ? request.input("tagName")
            : product.tagName;
          product.additionalDetails = request.input("additionalDetails")
            ? request.input("additionalDetails")
            : product.additionalDetails;
          product.long = request.input("long") ? request.input("long") : product.long;
          product.lat = request.input("lat") ? request.input("lat") : product.lat;
          product.status = request.input("status")
            ? request.input("status")
            : product.status;

          if (product) {
            //  do the following to be able to save the array in the database
            // let duration;
            // duration = JSON.stringify(product.duration);
            // console.log("The new product duration:", duration);
            // product.duration = duration;
            // send to user
            await product.save();
            console.log("Updated Loan product:", product);
            return response.status(200).json({
              status: "OK",
              data: product.$original,
            });
          }
          return; // 422
        } else {
          return response.status(304).json({ status: "FAILED", data: product });
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
    // let id = request.input('productId')
    const { productName, productId } = request.qs();
    console.log("Product query: ", request.qs());
    // let product = await Product.query().where({
    //   product_name: request.input('productName'),
    //   id: request.input('productId'),
    // })
    let product = await Product.query().where({
      product_name: productName,
      id: productId,
    });
    console.log(" QUERY RESULT: ", product);

    if (product.length > 0) {
      product = await Product.query()
        .where({
          product_name: productName,
          id: productId,
        })
        .delete();
      console.log("Deleted data:", product);
      return response.send("Product Delete.");
    } else {
      return response
        .status(404)
        .json({ status: "FAILED", message: "Invalid parameters" });
    }
  }
}
