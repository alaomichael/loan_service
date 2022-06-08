/* eslint-disable eqeqeq */
/* eslint-disable prettier/prettier */
"use strict";

// import Loan from "App/Models/Loan"
// import Setting from "App/Models/Setting"
// import PuppeteerServices from "App/Services/PuppeteerServices"
// import { DateTime } from 'luxon'
// const { DateTime } = require('luxon')
// const {DateTime} = Luxon
// import Env from '@ioc:Adonis/Core/Env'
const Env = require("@ioc:Adonis/Core/Env");
const axios = require("axios").default;
// const JSJoda = require('js-joda')
// const LocalDate = JSJoda.LocalDate
// const Moment = require('moment')
const API_URL = Env.get("API_URL");

// export const STANDARD_DATE_TIME_FORMAT = 'yyyy-LL-dd HH:mm:ss'
// export const TIMEZONE_DATE_TIME_FORMAT = 'yyyy-LL-dd HH:mm:ss ZZ'
// export const DATE_FORMAT = 'yyyy-LL-dd'
// export const UUID_REGEX =
//   /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/
// export const passwordRegex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/
// export const urlRegex =
//   /[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/

// export type RateType = 'percentage' | 'number'
// export type RoundingType = 'none' | 'nearest' | 'down' | 'up'
// export type ThousandSeparator = 'comma' | 'duration' | 'none' | 'space'

// Generate rate
// export const generateRate =

const generateRate = (amount, duration) => {
  return new Promise((resolve, reject) => {
    if (!amount || !duration || amount <= 0)
      reject(
        new Error("Incomplete parameters or amount is less than allowed range")
      );
    let rate:number;
    if (parseInt(duration) >= 7 && 14 > parseInt(duration)) {
      duration = "7 days";
    } else if (parseInt(duration) >= 14 && 21 > parseInt(duration)) {
      duration = "14 days";
    } else if (parseInt(duration) >= 21 && 30 > parseInt(duration)) {
      duration = "21 days";
    } else if (parseInt(duration) >= 30 && 45 > parseInt(duration)) {
      duration = "30 days";
    } else if (parseInt(duration) >= 45 && 60 > parseInt(duration)) {
      duration = "45 days";
    } else if (parseInt(duration) >= 60 && 90 > parseInt(duration)) {
      duration = "60 days";
    } else if (parseInt(duration) >= 90 && 119 > parseInt(duration)) {
      duration = "90 days";
    } else if (parseInt(duration) >= 120) {
      duration = "120 days";
    }

    switch (duration) {
      case "7 days":
        rate = 10;
        console.log(`RATE for ${amount} loan for ${duration} days is:`, rate);
        break;
      case "14 days":
        rate = 9;
        console.log(`RATE for ${amount} loan for ${duration} days is:`, rate);
        break;
      case "21 days":
        rate = 8;
        console.log(`RATE for ${amount} loan for ${duration} days is:`, rate);
        break;
      case "30 days":
        rate = 7;
        console.log(`RATE for ${amount} loan for ${duration} days is:`, rate);
        break;
      case "45 days":
        rate = 6;
        console.log(`RATE for ${amount} loan for ${duration} days is:`, rate);
        break;
      case "60 days":
        rate = 5;
        console.log(`RATE for ${amount} loan for ${duration} days is:`, rate);
        break;
      case "90 days":
        rate = 4.5;
        console.log(`RATE for ${amount} loan for ${duration} days is:`, rate);
        break;
      case "120 days":
        rate = 4.0;
        console.log(`RATE for ${amount} loan for ${duration} days is:`, rate);
        break;
      default:
        rate = 10.5;
        console.log(`RATE for ${amount} loan for ${duration} days is:`, rate);
        break;
    }
    return resolve(rate);
  });
};

// generateRate(198, '752', 'fixed')

// generateRate(1000, '300', 'debenture')

// Generate Return on Loan
const interestDueOnLoan = (amount, rate, duration) => {
  return new Promise((resolve, reject) => {
    if (!amount || !rate || !duration || amount <= 0) {
      reject(
        new Error("Incomplete parameters or amount is less than allowed range")
      );
    }
    let interestDue;
    let interestDueDaily;
    interestDue = amount * (rate/100);
    interestDueDaily = interestDue / duration;
    let day = "day";
    if (duration > 1) {
      day = "days";
    }
    console.log(
      `Interest due for your loan of ${amount} for ${duration} ${day} is ${interestDue}`
    );
    console.log(
      `Interest due daily for your loan of ${amount} for ${duration} ${day} is ${interestDueDaily}`
    );
    return resolve(interestDue);
  });
};

// interestDueOnPayout(150000, 0.05, 180)

// Check Loan due for payout
// export const dueForPayout =
const dueForRepayment = (created_at, duration) => {
  return new Promise((resolve, reject) => {
    if (!created_at || !duration) {
      reject(
        new Error(
          "Invalid or incomplete parameters or out of range, please try again."
        )
      );
    }

    // Get numbers of days difference between two dates
    function getNumberOfDays(start, end) {
      const date1 = new Date(start);
      const date2 = new Date(end);

      // One day in milliseconds
      const oneDay = 1000 * 60 * 60 * 24;

      // Calculating the time difference between two dates
      const diffInTime = date2.getTime() - date1.getTime();

      // Calculating the no. of days between two dates
      const diffInDays = Math.round(diffInTime / oneDay);

      return diffInDays;
    }

    // console.log('From Date Comparism function:', getNumberOfDays('2/1/2021', '3/1/2021'))

    // function getNumberOfDays2(start, end) {
    //   const start_date = new LocalDate.parse(start)
    //   const end_date = new LocalDate.parse(end)

    //   return JSJoda.ChronoUnit.DAYS.between(start_date, end_date)
    // }

    // console.log('From Js-Joda:', getNumberOfDays2('2021-02-01', '2022-04-29'))

    let isDueForRepayment;
    console.log("Current Date line 159 utils.ts: " + created_at);
    let loanCreationDate = new Date(created_at).getTime();
    let durationToMs = parseInt(duration) * 24 * 60 * 60 * 1000;
    let loanRepaymentDate = new Date(
      durationToMs + loanCreationDate
    ).getTime();
    let loanDuration;
    let currentDate = new Date().getTime();

    // let verificationCodeExpiresAt = DateTime.now().plus({ hours: 2 })
    // let testingPayoutDate = DateTime.now().plus({ days: duration })
    // console.log('verificationCodeExpiresAt : ' + verificationCodeExpiresAt + ' from now')
    // console.log('Testing Payout Date: ' + testingPayoutDate)

    // console.log('Current Date: ' + currentDate)
    // console.log('duration converted to Ms: ' + durationToMs)
    // console.log(`Your investment was created on ${new Date(loanCreationDate).toDateString()}`)
    // console.log(`Loan Payout Date is ${new Date(loanRepaymentDate).toDateString()} `)
    loanDuration = getNumberOfDays(
      new Date(loanCreationDate).toLocaleDateString(),
      new Date(currentDate).toLocaleDateString()
    );

    // console.log(
    //   'From Date Comparism function 2:',
    //   getNumberOfDays(
    //     new Date(loanCreationDate).toLocaleDateString(),
    //     new Date(currentDate).toLocaleDateString()
    //   )
    // )
    let day = "day";
    if (loanDuration > 1) {
      day = "days";
    }
    console.log("Loan duration is : " + loanDuration + ` ${day}`);
    if (
      currentDate >= loanRepaymentDate ||
      loanDuration >= parseInt(duration)
    ) {
      isDueForRepayment = true;
      // loanRepaymentDate = new Date(loanRepaymentDate).toLocaleString()
      console.log(
        `Your loan is due for repayment on ${new Date(
          loanRepaymentDate
        ).toDateString()}`
      );
    } else {
      isDueForRepayment = false;
      console.log(
        `Your loan will be due for repayment on ${new Date(
          loanRepaymentDate
        ).toDateString()}`
      );
    }
    return resolve(isDueForRepayment);
  });
};

// dueForPayout('2022-04-29 10:02:07.58+01', '190')

// Get numbers of days difference between two dates
const loanDuration = async function getNumberOfDays(start, end) {
  const date1 = new Date(start);
  const date2 = new Date(end);

  // One day in milliseconds
  const oneDay = 1000 * 60 * 60 * 24;

  // Calculating the time difference between two dates
  const diffInTime = (await date2.getTime()) - date1.getTime();

  // Calculating the no. of days between two dates
  const diffInDays = await Math.round(diffInTime / oneDay);
  console.log("Duration of the investment is: ", diffInDays);
  // let currentDate = new Date().toISOString() //.toLocaleString()
  // console.log('currentDate : ', currentDate)

  return diffInDays;
};

// let currentDate = new Date().toISOString()
// loanDuration('2022-04-30 10:02:07.58+01', currentDate)

const repaymentDueDate = (created_at, duration) => {
  return new Promise((resolve, reject) => {
    if (!created_at || !duration) {
      reject(new Error("Incomplete parameters or out of range"));
    }
    let payoutDueDate;
    let loanCreationDate = new Date(created_at).getTime();
    let durationToMs = parseInt(duration) * 24 * 60 * 60 * 1000;
    let loanRepaymentDate = new Date(
      durationToMs + loanCreationDate
    ).getTime();
    // let currentDate = new Date().getTime()
    // console.log('Current Date: ' + currentDate)
    // console.log('duration converted to Ms: ' + durationToMs)
    // console.log(`Your loan was created on ${new Date(loanCreationDate).toDateString()}`)
    // console.log(`Loan Payout Date is ${new Date(loanRepaymentDate).toDateString()} `)
    payoutDueDate = new Date(loanRepaymentDate).toISOString(); // using .toISOString() to convert it to luxon acceptable format
    // console.log(
    //   `The payout date for investment created on ${new Date(
    //     created_at
    //   ).toDateString()} for a duration of ${duration} is ${payoutDueDate}`
    // )
    return resolve(payoutDueDate);
  });
};

// repaymentDueDate('2022-04-29 10:02:07.58+01', '200')

const approvalRequest = async function (walletId, loanId, requestType) {
  try {
    // let requestType = 'request loan'
    const response = await axios.post(`${API_URL}/investments/approvals`, {
      walletId,
      loanId,
      requestType,
    });
    console.log(
      "The API response for approval request line 280: ",
      response.data
    );
    if (response && response.data.status === "OK") {
      console.log("Approval request status is OK");
      return response.data;
    } else {
      console.log("Approval request status is NOT OK");
      return;
    }
  } catch (error) {
    console.error(error);
  }
};

const sendPaymentDetails = async function (amount, duration, investmentType) {
  try {
    const response = await axios.get(
      `${API_URL}/investments/rates?amount=${amount}&duration=${duration}&investmentType=${investmentType}`
    );
    console.log("The API response: ", response.data);
    if (response.data.status === "OK" && response.data.data.length > 0) {
      return response.data.data[0].interestRate;
    } else {
      return;
    }
  } catch (error) {
    console.error(error);
  }
};

// console.log(
//   ' The Rate return for RATE utils.ts line 299: ',
//   sendPaymentDetails(12000, 180, 'fixed')
// )
const investmentRate = async function (
  payloadAmount,
  payloadDuration
) {
  try {
    const response = await axios.get(
      `${API_URL}/loans/rates?amount=${payloadAmount}&duration=${payloadDuration}`
    );
    console.log("The API response line 338: ", response.data);
    if (response.data.status === "OK" && response.data.data.length > 0) {
      console.log(
        "The API response line 341: ",
        response.data.data[0].interestRate
      );
      return response.data.data[0].interestRate;
    } else {
      return;
    }
  } catch (error) {
    console.error(error);
  }
};

const createNewInvestment = async function (
  payloadAmount,
  payloadDuration,
  payloadInvestmentType,
  investmentData
) {
  console.log("Loan data line 362: ", investmentData);
  console.log("Loan payloadAmount data line 363: ", payloadAmount);
  console.log("Loan payloadDuration data line 364: ", payloadDuration);
  console.log(
    "Loan payloadInvestmentType data line 366: ",
    payloadInvestmentType
  );
  try {
    // let requestType = 'start investment'
    let payload;
    // destructure / extract the needed data from the investment
    let {
      amount,
      rolloverType,
      rolloverTarget,
      rolloverDone,
      investmentType,
      duration,
      userId,
      tagName,
      currencyCode,
      long,
      lat,
      walletHolderDetails,
    } = investmentData;
    // copy the investment data to payload
    payload = {
      amount,
      rolloverType,
      rolloverTarget,
      rolloverDone,
      investmentType,
      duration,
      userId,
      tagName,
      currencyCode,
      long,
      lat,
      walletHolderDetails,
    };
    payload.amount = payloadAmount;
    //  payload.interestRate = rate
    console.log("PAYLOAD line 2325 :", payload);

    const response = await axios.post(`${API_URL}/investments`, {
      amount: payloadAmount,
      rolloverType,
      rolloverTarget,
      rolloverDone,
      investmentType,
      duration,
      userId,
      tagName,
      currencyCode,
      long,
      lat,
      walletHolderDetails,
    });
    console.log(
      "The API response for new investment creation request line 420: ",
      response.data
    );
    if (response && response.data.status === "OK") {
      console.log("New investment created successfully, request status is OK");
      return response.data;
    } else {
      console.log("New investment request status is NOT OK");
      return;
    }
  } catch (error) {
    console.error(error);
  }
};

/**
 * An utility function which returns a random number
 * @param {number} min Minimum value
 * @param {number} max Maximum value
 * @returns {Promise<Number>} Random value
 * @throws {Error}
 */
// export const generateCode = function (min: number, max: number): Promise<number> {
//   return new Promise((resolve, reject) => {
//     if (!min || !max) reject(new Error('Incomplete parameters'))
//     const code = Math.floor(Math.random() * (max - min) + min)
//     return resolve(code)
//   })
// }

// export const bytesToKbytes = (bytes: number) => Math.round((bytes / 1000) * 100) / 100

// export const commonEmailProperties = function () {
//   const APP_NAME = Env.get('APP_NAME')
//   const APP_SENDING_EMAIL = Env.get('APP_SENDING_EMAIL')

//   return { APP_NAME, APP_SENDING_EMAIL }
// }

// export const IS_DEMO_MODE = Env.get('DEMO_MODE')

// export const rateTypes: RateType[] = ['number', 'percentage']
// export const roundingTypes: RoundingType[] = ['none', 'nearest', 'down', 'up']
// export const thousandSeparatorTypes: ThousandSeparator[] = ['comma', 'duration', 'none', 'space']

export const getPrintServerBaseUrl = function () {
  let host: string;
  let port: number;
  const NODE_ENV = Env.get("NODE_ENV");

  if (NODE_ENV === "production" || NODE_ENV === "testing") {
    host = Env.get("PROD_PRINT_SERVER_HOST");
    port = Env.get("PROD_PRINT_SERVER_PORT");
  } else {
    host = Env.get("DEV_PRINT_SERVER_HOST");
    port = Env.get("DEV_PRINT_SERVER_PORT");
  }

  return `http://${host}:${port}`;
};

export const isProduction = Env.get("NODE_ENV") === "production";
export const isDevelopment = Env.get("NODE_ENV") === "development";

module.exports = {
  generateRate,
  interestDueOnLoan,
  dueForRepayment,
  repaymentDueDate,
  approvalRequest,
  loanDuration,
  sendPaymentDetails,
  investmentRate,
  getPrintServerBaseUrl,
  createNewInvestment,
};

export {
  generateRate,
  interestDueOnLoan,
  dueForRepayment,
  repaymentDueDate,
  approvalRequest,
  loanDuration,
  sendPaymentDetails,
  investmentRate,
  createNewInvestment,
};
