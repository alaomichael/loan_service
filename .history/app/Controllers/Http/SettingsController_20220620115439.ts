import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import Setting from "App/Models/Setting";
// import { DateTime } from 'luxon'
import { schema, rules } from "@ioc:Adonis/Core/Validator";
import Event from "@ioc:Adonis/Core/Event";

export default class SettingsController {
  public async index({ params, request, response }: HttpContextContract) {
    console.log("setting params: ", params);
    const {
      fundingWalletId,
      isDisbursementAutomated,
      fundingSourceTerminal,
      isLoanAutomated,
      isTerminationAutomated,
           tagName,
      currencyCode,
      limit,
    } = request.qs();
    console.log("setting query: ", request.qs());
    // const countActiveSetting = await Setting.query()
    //   .where("investment_type", "fixed")
    //   .getCount();
    // console.log("setting Investment count: ", countActiveSetting);

    // const setting = await Setting.query().offset(0).limit(1)
    const setting = await Setting.all();
    let sortedSettings = setting;

    if (fundingWalletId) {
      sortedSettings = sortedSettings.filter((setting) => {
        // @ts-ignore
        return setting.fundingWalletId === parseInt(fundingWalletId);
      });
    }

   if (isDisbursementAutomated) {
      sortedSettings = sortedSettings.filter((setting) => {
        // @ts-ignore
        return (
          setting.isDisbursementAutomated.toString() === isDisbursementAutomated
        );
      });
    }

    if (isLoanAutomated) {
      sortedSettings = sortedSettings.filter((setting) => {
        // @ts-ignore
        return setting.isLoanAutomated.toString() === isLoanAutomated;
      });
    }

    if (isTerminationAutomated) {
      sortedSettings = sortedSettings.filter((setting) => {
        // @ts-ignore
        return (
          setting.isTerminationAutomated.toString() === isTerminationAutomated
        );
      });
    }

    if (fundingSourceTerminal) {
      sortedSettings = sortedSettings.filter((setting) => {
        // @ts-ignore
        return setting.fundingSourceTerminal!.includes(fundingSourceTerminal);
      });
    }

    if (tagName) {
      sortedSettings = sortedSettings.filter((setting) => {
        // @ts-ignore
        return setting.tagName!.includes(tagName);
      });
    }

    if (currencyCode) {
      sortedSettings = sortedSettings.filter((setting) => {
        // @ts-ignore
        return setting.currencyCode!.includes(currencyCode);
      });
    }

    if (limit) {
      sortedSettings = sortedSettings.slice(0, Number(limit));
    }
    if (sortedSettings.length < 1) {
      return response.status(200).json({
        status: "OK",
        message: "no loan setting matched your search",
        data: [],
      });
    }
    // return setting(s)
    return response.status(200).json({
      status: "OK",
      data: sortedSettings.map((setting) => setting)//.$original),
    });
  }

  public async store({ request, response }: HttpContextContract) {
    // const user = await auth.authenticate()
    const settingSchema = schema.create({
      fundingWalletId: schema.string(),
      isDisbursementAutomated: schema.boolean(),
      fundingSourceTerminal: schema.string({ escape: true }, [
        rules.maxLength(50),
      ]),
      isLoanAutomated: schema.boolean(),
      isTerminationAutomated: schema.boolean(),
      tagName: schema.string({ escape: true }, [rules.maxLength(100)]),
      currencyCode: schema.string({ escape: true }, [rules.maxLength(5)]),
    });
    const payload: any = await request.validate({ schema: settingSchema });
    const setting = await Setting.create(payload);

    await setting.save();
    console.log("The new loan:", setting);

    // TODO
    console.log("A New setting has been Created.");

    // Save setting new status to Database
    await setting.save();
    // Send setting Creation Message to Queue

    Event.emit("new:setting", {
      id: setting.id,
      // @ts-ignore
      extras: setting.additionalDetails,
    });
    return response.json({ status: "OK", data: setting.$original });
  }

  public async update({ request, response }: HttpContextContract) {
    try {
      const { id } = request.qs();
      // console.log("Setting query: ", request.qs());

      // function toBool(string) {
      //   if (string === "true") {
      //     return true;
      //   } else {
      //     return false;
      //   }
      // }

      const settingSchema = schema.create({
        fundingWalletId: schema.string.optional(),
        isDisbursementAutomated: schema.boolean.optional(),
        fundingSourceTerminal: schema.string.optional({ escape: true }, [
          rules.maxLength(50),
        ]),
        isLoanAutomated: schema.boolean.optional(),
        isTerminationAutomated: schema.boolean.optional(),
        tagName: schema.string.optional({ escape: true }, [rules.maxLength(100)]),
        currencyCode: schema.string.optional({ escape: true }, [rules.maxLength(5)]),
      });
      const payload: any = await request.validate({ schema: settingSchema });
      console.log("Request body validation line 167", payload);
      let setting = await Setting.query()
        .where({
          id: id,
        })
        .first();
      if (!setting)
        return response.status(404).json({
          status: "FAILED",
          message: "No data match your query parameters",
        });
      // let {
      //   fundingWalletId,
      //   isDisbursementAutomated,
      //   fundingSourceTerminal,
      //   isLoanAutomated,
      //   isTerminationAutomated,
      //   tagName,
      //   currencyCode,
      // } = request.body();
      // console.log("Request body line 175", currencyCode);
      console.log(" QUERY RESULT: ", setting.isDisbursementAutomated);
      if (setting) {
        console.log("loan setting Selected for Update:", setting);
        if (setting) {
          // setting.fundingWalletId = fundingWalletId
          //   ? fundingWalletId
          //   : setting.fundingWalletId;
          // setting.isDisbursementAutomated =
          //   isDisbursementAutomated !== setting.isDisbursementAutomated &&
          //   isDisbursementAutomated !== undefined &&
          //   isDisbursementAutomated !== null
          //     ? isDisbursementAutomated
          //     : setting.isDisbursementAutomated;

          // setting.fundingSourceTerminal = fundingSourceTerminal
          //   ? fundingSourceTerminal
          //   : setting.fundingSourceTerminal;

          // setting.isLoanAutomated =
          //   isLoanAutomated !== setting.isLoanAutomated &&
          //   isLoanAutomated !== undefined &&
          //   isLoanAutomated !== null
          //     ? isLoanAutomated
          //     : setting.isLoanAutomated;

          // setting.isTerminationAutomated =
          //   isTerminationAutomated !== setting.isTerminationAutomated &&
          //   isTerminationAutomated !== undefined &&
          //   isTerminationAutomated !== null
          //     ? isTerminationAutomated
          //     : setting.isTerminationAutomated;
          // setting.tagName = tagName ? tagName : setting.tagName;
          // setting.currencyCode = currencyCode
          //   ? currencyCode
          //   : setting.currencyCode;

          setting.merge(payload);

          await setting.save();

          if (setting) {
            // send to user
            console.log("Update loan setting:", setting);
            return response.json({
              status: "OK",
              data: setting.$original,
            });
          }
          return; // 422
        } else {
          return response.status(304).json({ status: "FAILED", data: setting });
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
    const { id } = request.qs();
    console.log("Setting query: ", request.qs());

    let setting = await Setting.query().where({
      id: id,
    });
    console.log(" QUERY RESULT: ", setting);

    if (setting.length > 0) {
      setting = await Setting.query()
        .where({
          id: id,
        })
        .delete();
      console.log("Deleted data:", setting);
      return response.send("Setting Deleted.");
    } else {
      return response
        .status(404)
        .json({ status: "FAILED", message: "Invalid parameters" });
    }
  }
}
