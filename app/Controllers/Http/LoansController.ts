/* eslint-disable prettier/prettier */
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import Loan from "App/Models/Loan";
import Setting from "App/Models/Setting";
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
export default class LoansController {
  public async index({ params, request, response }: HttpContextContract) {
    console.log("LOAN params: ", params);
    const { search, limit, requestType, walletId, loanId, status } =
      request.qs();
    console.log("LOAN query: ", request.qs());
    // const count = await Loan.query()
    //   .where("currency_code", "NGN")
    //   .getCount();
    // console.log("LOAN count: ", count);
    // let settings = await Setting.query().where({ currency_code: 'NGN' })
    // console.log('Approval setting line 35:', settings[0].isDisbursementAutomated)
    // const loan = await Loan.query().offset(0).limit(1)
    const loan = await Loan.all(); //.sort(function (Loan.timeline.createdAt, Loan.timeline.createdAt) {return Loan.timeline.createdAt-Loan.timeline.createdAt})
    // console.log('LOAN before sorting line 40: ', loan)
    // let newArray = loan.map((loan) => {return loan.$original})
    let sortedInvestments = loan.map((loan) => {
      return loan.$original;
    });
    // console.log('LOAN newArray sorting: ', newArray)
    console.log("LOAN before sorting: ", sortedInvestments);
    if (search) {
      sortedInvestments = sortedInvestments.filter((loan) => {
        // @ts-ignore
        // console.log(' Sorted :', loan.loanAccountDetails.lastName!.startsWith(search))
        // @ts-ignore
        return loan.loanAccountDetails.lastName!.startsWith(search);
      });
    }
    if (requestType) {
      sortedInvestments = sortedInvestments.filter((loan) => {
        // @ts-ignore
        return loan.requestType.startsWith(requestType);
      });
    }
    if (status) {
      sortedInvestments = sortedInvestments.filter((loan) => {
        // @ts-ignore
        return loan.status.includes(status);
      });
    }

    if (walletId) {
      sortedInvestments = sortedInvestments.filter((loan) => {
        // @ts-ignore
        return loan.walletId === walletId;
      });
    }
    if (loanId) {
      sortedInvestments = sortedInvestments.filter((loan) => {
        // @ts-ignore
        return loan.id === loanId;
      });
    }
    if (limit) {
      sortedInvestments = sortedInvestments.slice(0, Number(limit));
    }
    if (sortedInvestments.length < 1) {
      return response.status(200).json({
        status: "FAILED",
        message: "no loan matched your search",
        data: [],
      });
    }
    // console.log('LOAN MAPPING: ',loan.map((inv) => inv.$extras))
    // console.log('LOAN based on sorting & limit: ', sortedInvestments)
    // @ts-ignore
    Event.emit("list:investments", {
      id: loan[0].id,
      // @ts-ignore
      email: loan[0].loanAccountDetails.email,
    });
    // return loan
    console.log(" SORTED LOAN line 78" + sortedInvestments);
    return response.status(200).json(sortedInvestments);
  }

  public async show({ params, request, response }: HttpContextContract) {
    console.log("LOAN params: ", params);
    const {
      search,
      limit,
      requestType,
      loanId,
      status,
      approvalStatus,
      duration,
    } = request.qs();
    console.log("LOAN query: ", request.qs());
    try {
      let loan = await Loan.query()
        .where("wallet_id", params.walletId)
        .orderBy("createdAt", "desc");
      // .orWhere('id', params.id)
      // .limit()
      let sortedInvestments = loan.map((loan) => {
        return loan.$original;
      });
      if (sortedInvestments.length > 0) {
        console.log("LOAN before sorting: ", sortedInvestments);
        if (search) {
          sortedInvestments = sortedInvestments.filter((loan) => {
            // @ts-ignore
            return loan.walletHolderDetails.lastName!.startsWith(search);
          });
        }
        if (requestType) {
          sortedInvestments = sortedInvestments.filter((loan) => {
            // @ts-ignore
            return loan.requestType.startsWith(requestType);
          });
        }
        if (status) {
          sortedInvestments = sortedInvestments.filter((loan) => {
            // @ts-ignore
            return loan.status.includes(status);
          });
        }

        if (approvalStatus) {
          sortedInvestments = sortedInvestments.filter((loan) => {
            // @ts-ignore
            return loan.approvalStatus.includes(approvalStatus);
          });
        }
        if (loanId) {
          sortedInvestments = sortedInvestments.filter((loan) => {
            // @ts-ignore
            return loan.id === parseInt(loanId);
          });
        }

        if (duration) {
          sortedInvestments = sortedInvestments.filter((loan) => {
            // @ts-ignore
            return loan.duration === duration;
          });
        }
        if (limit) {
          sortedInvestments = sortedInvestments.slice(0, Number(limit));
        }
        if (sortedInvestments.length < 1) {
          return response.status(200).json({
            status: "FAILED",
            message: "no loan matched your search",
            data: [],
          });
        }

        return response
          .status(200)
          .json({ status: "OK", data: sortedInvestments });
      } else {
        return response.status(200).json({
          status: "FAILED",
          message: "no loan matched your search",
          data: [],
        });
      }
    } catch (error) {
      console.log(error);
    }
  }
  public async showByLoanId({
    params,
    request,
    response,
  }: HttpContextContract) {
    console.log("LOAN params: ", params);
    const { loanId } = request.params();
    console.log("LOAN params loanId: ", loanId);
    try {
      let loan = await Loan.query()
        .where({ id: loanId })
        .orderBy("createdAt", "desc")
        .first();
      // .with('timeline')
      // .orderBy('timeline', 'desc')
      // .fetch()
      if (!loan) return response.status(404).json({ status: "FAILED" });
      return response.status(200).json({ status: "OK", data: loan.$original });
    } catch (error) {
      console.log(error);
    }
  }

  public async showByWalletId({
    params,
    request,
    response,
  }: HttpContextContract) {
    console.log("LOAN params: ", params);
    const { walletId } = request.params();
    console.log("LOAN params walletId: ", walletId);
    try {
      let loans = await Loan.query()
        .where({ wallet_id: walletId })
        .orderBy("createdAt", "desc");
      // .with('timeline')
      // .orderBy('timeline', 'desc')
      // .fetch()
      if (!loans || loans.length < 0)
        return response.status(404).json({ status: "FAILED" });
      return response
        .status(200)
        .json({ status: "OK", data: loans.map((loan) => loan.$original) });
    } catch (error) {
      console.log(error);
    }
  }

  public async showRepayment({
    params,
    request,
    response,
  }: HttpContextContract) {
    console.log("LOAN params: ", params);
    try {
      //   const loan = await Loan.query().where('status', 'payout')
      // .orWhere('id', params.id)
      // .limit()
      const { search, limit, walletId, loanId, requestType } = request.qs();
      console.log("PAYOUT query: ", request.qs());
      const payout = await Payout.all();
      let sortedPayouts = payout;
      console.log("PAYOUT Loan line 150: ", payout);
      if (search) {
        sortedPayouts = sortedPayouts.filter((payout) => {
          // @ts-ignore
          // console.log(' Sorted :', payout.walletHolderDetails.lastName!.includes(search))
          // @ts-ignore
          return payout.walletHolderDetails.lastName!.startsWith(search);
        });
      }
      if (walletId) {
        sortedPayouts = sortedPayouts.filter((payout) => {
          // @ts-ignore
          return payout.walletId === walletId;
        });
      }
      if (loanId) {
        sortedPayouts = sortedPayouts.filter((payout) => {
          // @ts-ignore
          return payout.loanId === loanId;
        });
      }

      if (requestType) {
        sortedPayouts = sortedPayouts.filter((payout) => {
          // @ts-ignore
          return payout.requestType === requestType;
        });
      }
      if (limit) {
        sortedPayouts = sortedPayouts.slice(0, Number(limit));
      }
      if (sortedPayouts.length < 1) {
        return response.status(200).json({
          status: "FAILED",
          message: "no loan payout matched your search",
          data: [],
        });
      }
      // return payouts
      // sortedPayouts.map((payout)=> {payout.$original}),
      return response.status(200).json({
        status: "OK",
        data: sortedPayouts.map((payout) => payout.$original),
      });
    } catch (error) {
      console.log(error);
    }
  }

  public async feedbacks({ params, request, response }: HttpContextContract) {
    console.log("LOAN params line 149: ", params);
    const {
      walletId,
      loanId,
      requestType,
      approvalStatus,
      getInvestmentDetails,
    } = request.qs();
    console.log("LOAN query line 151: ", request.qs());
    let loan = await Loan.all();
    let approvals;
    let timeline;
    let timelineObject;
    if (
      requestType === "start loan" &&
      walletId &&
      loanId &&
      !approvalStatus &&
      !getInvestmentDetails
    ) {
      console.log("LOAN ID", loanId);
      console.log("WALLET ID", walletId);
      // check the approval for request
      approvals = await Approval.query()
        .where("request_type", requestType)
        .where("wallet_id", walletId)
        .where("loan_id", loanId);
      // check the approval status
      console.log("approvals line 163: ", approvals);
      if (approvals.length < 1) {
        return response.json({
          status: "FAILED",
          message:
            "No loan approval request data matched your query, please try again",
        });
      }
      console.log("approvals line 170: ", approvals[0].approvalStatus);
      //  if approved update loan status to active, update startDate,  and start loan
      if (approvals[0].approvalStatus === "approved") {
        //  loan
        try {
          loan = await Loan.query().where({
            id: loanId,
            wallet_id: walletId,
            request_type: requestType,
            status: "initiated",
          });
        } catch (error) {
          console.error(error);
          return response.json({ status: "FAILED", message: error.message });
        }
        console.log("LOAN DATA line 305: ", loan);
        if (loan.length < 1) {
          // return response.json({
          //   status: 'FAILED',
          //   message: 'No loan activation approval data matched your query, please try again',
          // })
          loan = await Loan.query()
            // .where('status', 'active')
            .where("request_type", requestType)
            .where("wallet_id", walletId)
            .where("id", loanId);
          return response.json({
            status: "OK",
            message:
              "No loan activation approval data matched your query, please try again",
            approvaldata: approvals.map((approval) => approval.$original),
            investmentdata: loan.map((loan) => loan.$original),
          });
        }
        loan[0].approvalStatus = approvals[0].approvalStatus;
        // TODO
        // send loan details to Transaction Service
        // on success

        // update status of loan
        // update start date
        loan[0].status = "active";
        let currentDateMs = DateTime.now().toISO();
        // @ts-ignore
        loan[0].startDate = DateTime.now().toISO();
        let duration = parseInt(loan[0].duration);
        loan[0].repaymentDate = DateTime.now().plus({ days: duration });
        console.log("The currentDate line 336: ", currentDateMs);
        console.log("Time loan was started line 337: ", loan[0].startDate);
        console.log(
          "Time loan repayment date line 338: ",
          loan[0].repaymentDate
        );
        // update timeline
        timelineObject = {
          id: uuid(),
          action: "loan activated",
          // @ts-ignore
          message: `${loan[0].walletHolderDetails.firstName} loan has just been activated.`,
          createdAt: DateTime.now(),
          meta: `amount approved: ${loan[0].currencyCode} ${loan[0].amountApproved}, request type : ${loan[0].requestType}`,
        };
        console.log("Timeline object line 348:", timelineObject);
        //  Push the new object to the array
        timeline = loan[0].timeline; //JSON.parse(loan[0].timeline)
        timeline.push(timelineObject);
        console.log("Timeline object line 352:", timeline);
        // stringify the timeline array
        loan[0].timeline = JSON.stringify(timeline);
        // Save
        await loan[0].save();
        // Send notification
        console.log("Updated loan Status line 358: ", loan);
        // START
        //  const requestUrl = Env.get('CERTIFICATE_URL') + loan.id
        //  await new PuppeteerServices(requestUrl, {
        //    paperFormat: 'a3',
        //    fileName: `${loan.requestType}_${loan.id}`,
        //  })
        //    .printAsPDF(loan)
        //    .catch((error) => console.error(error))
        //  return response.status(200).json({ status: 'OK', data: loan.$original })

        // END
        await loan[0].save();
        return response.json({
          status: "OK",
          data: loan.map((inv) => inv.$original),
        });
      } else if (
        approvals.length > 0 &&
        approvals[0].approvalStatus === "declined"
      ) {
        // loan = await Loan.query()
        //   .where('status', 'initiated')
        //   .where('request_type', requestType)
        //   .where('wallet_id', walletId)
        //   .where('id', loanId)
        try {
          loan = await Loan.query().where({
            id: loanId,
            wallet_id: walletId,
            request_type: requestType,
            status: "initiated",
          });
        } catch (error) {
          console.error(error);
          return response.json({ status: "FAILED", message: error.message });
        }
        console.log("The declined loan line 239: ", loan);
        if (loan.length < 1) {
          // return response.json({
          //   status: 'FAILED',
          //   message: 'No loan activation decline data matched your query, please try again',
          // })
          loan = await Loan.query()
            // .where('status', 'active')
            .where("request_type", requestType)
            .where("wallet_id", walletId)
            .where("id", loanId);
          return response.json({
            status: "OK",
            message:
              "No loan activation decline data matched your query, please try again",
            approvaldata: approvals.map((approval) => approval.$original),
            investmentdata: loan.map((loan) => loan.$original),
          });
        }

        // loan[0].status = 'declined'
        loan[0].approvalStatus = approvals[0].approvalStatus;
        // update timeline
        timelineObject = {
          id: uuid(),
          action: "loan declined",
          // @ts-ignore
          message: `${loan[0].loanAccountDetails.firstName} loan has just been declined.`,
          createdAt: DateTime.now(),
          meta: `amount declined: ${loan[0].currencyCode} ${loan[0].amountApproved}, request type : ${loan[0].requestType}`,
        };
        console.log("Timeline object line 429:", timelineObject);
        //  Push the new object to the array
        timeline = loan[0].timeline;
        timeline.push(timelineObject);
        console.log("Timeline object line 433:", timeline);
        // stringify the timeline array
        loan[0].timeline = JSON.stringify(timeline);
        // Save
        await loan[0].save();

        // await Save
        await loan[0].save();
        // send notification
        console.log(
          "LOAN DATA line 443: ",
          loan.map((inv) => inv.$original)
        );

        return response.json({
          status: "OK",
          data: loan.map((inv) => inv.$original),
        });
      } else {
        return response.json({ status: "OK", data: approvals });
      }
    } else if (
      requestType === "terminate loan" &&
      walletId &&
      loanId &&
      !approvalStatus &&
      !getInvestmentDetails
    ) {
      console.log("LOAN ID", loanId);
      console.log("WALLET ID", walletId);
      // check the approval for request
      approvals = await Approval.query()
        .where("request_type", requestType)
        .where("wallet_id", walletId)
        .where("loan_id", loanId);
      // check the approval status
      console.log("approvals line 270: ", approvals);
      if (approvals.length < 1) {
        return response.json({
          status: "FAILED",
          message:
            "No loan approval request data matched your query, please try again",
        });
      }
      console.log("approvals line 277: ", approvals[0].approvalStatus);
      //  if approved update loan status to terminated, update startDate,  and start loan
      if (approvals[0].approvalStatus === "approved") {
        loan = await Loan.query()
          .where("status", "active")
          .where("request_type", requestType)
          .where("wallet_id", walletId)
          .where("id", loanId);
        console.log("LOAN DATA line 285: ", loan);
        if (loan.length < 1) {
          // return response.json({
          //   status: 'FAILED',
          //   message:
          //     'No loan termination approval data matched your query,or the feedback has been applied,or please try again',
          // })
          loan = await Loan.query()
            // .where('status', 'active')
            .where("request_type", requestType)
            .where("wallet_id", walletId)
            .where("id", loanId);
          return response.json({
            status: "OK",
            message:
              "No loan termination approval data matched your query,or the feedback has been applied,or please try again",
            approvaldata: approvals.map((approval) => approval.$original),
            investmentdata: loan.map((loan) => loan.$original),
          });
        }
        loan[0].approvalStatus = approvals[0].approvalStatus;
        // TODO
        // send loan details to Transaction Service
        // on success

        // update status loan
        loan[0].isLoanApproved = true;
        loan[0].status = "terminated";

        // update timeline
        timelineObject = {
          id: uuid(),
          action: "loan terminated",
          // @ts-ignore
          message: `${loan[0].walletHolderDetails.firstName} loan has just been terminated.`,
          createdAt: DateTime.now(),
          meta: `amount approved: ${loan[0].currencyCode} ${loan[0].amountApproved}, request type : ${loan[0].requestType}`,
        };
        console.log("Timeline object line 529:", timelineObject);
        //  Push the new object to the array
        timeline = loan[0].timeline;
        timeline.push(timelineObject);
        console.log("Timeline object line 533:", timeline);
        // stringify the timeline array
        loan[0].timeline = JSON.stringify(timeline);
        // Save
        await loan[0].save();

        // send notification
        console.log("Updated loan Status line 540: ", loan);
        return response.json({
          status: "OK",
          data: loan.map((inv) => inv.$original),
        });
      } else if (
        approvals.length > 0 &&
        approvals[0].approvalStatus === "declined"
      ) {
        loan = await Loan.query()
          .where("status", "active")
          .where("request_type", requestType)
          .where("wallet_id", walletId)
          .where("id", loanId);
        console.log("The declined loan line 323: ", loan);
        if (loan.length < 1) {
          // return response.json({
          //   status: 'FAILED',
          //   message:
          //     'No loan termination decline data matched your query,or the feedback has been applied,or please try again',
          // })
          loan = await Loan.query()
            // .where('status', 'active')
            .where("request_type", requestType)
            .where("wallet_id", walletId)
            .where("id", loanId);
          return response.json({
            status: "OK",
            message:
              "No loan termination decline data matched your query,or the feedback has been applied,or please try again",
            approvaldata: approvals.map((approval) => approval.$original),
            investmentdata: loan.map((loan) => loan.$original),
          });
        }

        // loan[0].status = 'declined'
        loan[0].approvalStatus = approvals[0].approvalStatus;
        // update timeline
        timelineObject = {
          id: uuid(),
          action: "loan termination declined",
          // @ts-ignore
          message: `${loan[0].walletHolderDetails.firstName} loan termination has just been declined.`,
          createdAt: DateTime.now(),
          meta: `amount invested: ${loan[0].amount}, request type : ${loan[0].requestType}`,
        };
        console.log("Timeline object line 583:", timelineObject);
        //  Push the new object to the array
        timeline = loan[0].timeline;
        timeline.push(timelineObject);
        console.log("Timeline object line 587:", timeline);
        // stringify the timeline array
        loan[0].timeline = JSON.stringify(timeline);
        // Save
        await loan[0].save();

        // send notification
        console.log(
          "LOAN DATA line 337: ",
          loan.map((inv) => inv.$original)
        );
        return response.json({
          status: "OK",
          data: loan.map((inv) => inv.$original),
        });
      } else {
        return response.json({
          status: "OK",
          data: approvals.map((inv) => inv.$original),
        });
      }
    } else if (
      requestType === "payout loan" &&
      walletId &&
      loanId &&
      !approvalStatus &&
      !getInvestmentDetails
    ) {
      console.log("LOAN ID", loanId);
      console.log("WALLET ID", walletId);
      // check the approval for request
      approvals = await Approval.query()
        .where("request_type", requestType)
        .where("wallet_id", walletId)
        .where("loan_id", loanId);
      // check the approval status
      console.log("approvals line 353: ", approvals);
      if (approvals.length < 1) {
        return response.json({
          status: "FAILED",
          message:
            "No loan payout request data matched your query, please try again",
        });
      }
      console.log("approvals line 345: ", approvals[0].approvalStatus);
      //  if approved update loan status to active, update startDate,  and start loan
      if (approvals[0].approvalStatus === "approved") {
        loan = await Loan.query()
          .where("status", "active")
          .where("request_type", requestType)
          .where("wallet_id", walletId)
          .where("id", loanId);
        console.log("LOAN DATA line 368: ", loan);
        if (loan.length < 1) {
          loan = await Loan.query()
            // .where('status', 'active')
            .where("request_type", requestType)
            .where("wallet_id", walletId)
            .where("id", loanId);
          return response.json({
            status: "OK",
            message:
              "No loan data matched your query,or the feedback has been applied,or please try again",
            approvaldata: approvals.map((approval) => approval.$original),
            investmentdata: loan.map((loan) => loan.$original),
          });
        }
        loan[0].approvalStatus = approvals[0].approvalStatus;
        // TODO
        // send loan details to Transaction Service
        // on success

        // update status loan
        // update start date
        loan[0].isPayoutAuthorized = true;
        loan[0].isTerminationAuthorized = true;
        loan[0].status = "payout";
        // let currentDateMs = DateTime.now().toISO()
        // @ts-ignore
        // loan[0].startDate = DateTime.now().toISO()
        // let duration = parseInt(loan[0].duration)

        // loan[0].payoutDate = DateTime.now().toISO() //DateTime.now().plus({ days: duration })

        // console.log('The currentDate line 372: ', currentDateMs)
        // console.log('Time loan was started line 373: ', loan[0].startDate)
        console.log("Time loan payout date line 390: ", loan[0].payoutDate);
        // update timeline
        timelineObject = {
          id: uuid(),
          action: "loan payout approved",
          // @ts-ignore
          message: `${loan[0].walletHolderDetails.firstName} loan has just been approved for payout.`,
          createdAt: DateTime.now(),
          meta: `amount invested: ${loan[0].amount}, request type : ${loan[0].requestType}`,
        };
        console.log("Timeline object line 676:", timelineObject);
        //  Push the new object to the array
        timeline = loan[0].timeline;
        timeline.push(timelineObject);
        console.log("Timeline object line 680:", timeline);
        // stringify the timeline array
        loan[0].timeline = JSON.stringify(timeline);
        // Save
        await loan[0].save();

        // send notification
        console.log("Updated loan Status line 687: ", loan);
        return response.json({
          status: "OK",
          data: loan.map((inv) => inv.$original),
        });
      } else if (
        approvals.length > 0 &&
        approvals[0].approvalStatus === "declined"
      ) {
        loan = await Loan.query()
          .where("status", "active")
          .where("request_type", requestType)
          .where("wallet_id", walletId)
          .where("id", loanId);
        console.log("The declined loan line 698: ", loan);
        if (loan.length < 1) {
          // return response.json({
          //   status: 'FAILED',
          //   message:
          //     'No loan payout decline data matched your query, or the feedback has been applied, or please try again',
          // })
          loan = await Loan.query()
            // .where('status', 'active')
            .where("request_type", requestType)
            .where("wallet_id", walletId)
            .where("id", loanId);
          return response.json({
            status: "OK",
            message:
              "No loan payout decline data matched your query, or the feedback has been applied, or please try again",
            approvaldata: approvals.map((approval) => approval.$original),
            investmentdata: loan.map((loan) => loan.$original),
          });
        }

        // loan[0].status = 'declined'
        loan[0].approvalStatus = approvals[0].approvalStatus;
        // update timeline
        timelineObject = {
          id: uuid(),
          action: "loan payout declined",
          // @ts-ignore
          message: `${loan[0].walletHolderDetails.firstName} loan payout has just been declined.`,
          createdAt: DateTime.now(),
          meta: `amount invested: ${loan[0].amount}, request type : ${loan[0].requestType}`,
        };
        console.log("Timeline object line 730:", timelineObject);
        //  Push the new object to the array
        timeline = loan[0].timeline;
        timeline.push(timelineObject);
        console.log("Timeline object line 734:", timeline);
        // stringify the timeline array
        loan[0].timeline = JSON.stringify(timeline);
        // Save
        await loan[0].save();

        // await Save
        await loan[0].save();
        // send notification
        console.log(
          "LOAN DATA line 744: ",
          loan.map((inv) => inv.$original)
        );
        return response.json({
          status: "OK",
          data: loan.map((inv) => inv.$original),
        });
      } else {
        return response.json({
          status: "OK",
          data: approvals.map((inv) => inv.$original),
        });
      }
    } else if (loan.length > 0) {
      // check the approval for request
      let approvals = await Approval.all();
      let sortedApproval = approvals;
      let sortedInvestment = loan;
      if (
        requestType &&
        walletId &&
        loanId &&
        approvalStatus &&
        getInvestmentDetails === "true"
      ) {
        console.log("Request Type", requestType);
        sortedInvestment = sortedInvestment.filter((loan) => {
          return (
            loan.requestType === requestType &&
            loan.walletId === walletId &&
            loan.id === loanId &&
            loan.approvalStatus === approvalStatus
          );
        });
        console.log("loan line 514: ", sortedInvestment);
        if (sortedInvestment.length < 1) {
          return response.json({
            status: "FAILED",
            message:
              "No loan approval request data matched your query, please try again",
          });
        }
        console.log("approval line 782: ", sortedInvestment);

        return response.json({
          status: "OK",
          data: sortedInvestment.map((inv) => inv.$original),
        });
      }
      if (requestType) {
        console.log("Request Type", requestType);
        sortedApproval = sortedApproval.filter((approval) => {
          return approval.requestType === requestType;
        });
      }
      if (walletId) {
        console.log("WALLET ID", walletId);
        sortedApproval = sortedApproval.filter((approval) => {
          return approval.walletId === walletId;
        });
      }
      if (loanId) {
        console.log("LOAN ID", loanId);
        sortedApproval = sortedApproval.filter((approval) => {
          return approval.loanId === loanId;
        });
      }
      //  approvalStatuss
      if (approvalStatus) {
        console.log("Request Type", approvalStatus);
        sortedApproval = sortedApproval.filter((approval) => {
          return approval.approvalStatus === approvalStatus;
        });
      }

      // check the approval status
      console.log("approval line 813: ", sortedApproval);
      if (sortedApproval.length < 1) {
        return response.json({
          status: "FAILED",
          message:
            "No loan approval request data matched your query, please try again",
        });
      }
      console.log("approval line 820: ", sortedApproval);

      return response.json({
        status: "OK",
        data: sortedApproval.map((inv) => inv.$original),
      });
    } else {
      return response.json({
        status: "FAILED",
        message: "No data matched your feedback query",
      });
    }
  }

  public async updateOffer({ request, response }: HttpContextContract) {
    try {
      let { walletId, loanId } = request.qs();
      console.log(" walletId and loanId: ", walletId + " " + loanId);
        const walletSchema = schema.create({
          isOfferAccepted: schema.boolean(),
         });
        const payload: any = await request.validate({ schema: walletSchema });
        console.log("The offer is accepted : ", payload);

      let { isOfferAccepted } = request.only(["isOfferAccepted"]);
      console.log(" isOfferAccepted line 909: ", isOfferAccepted);
      let loan = await Loan.query().where({
        wallet_id: walletId,
        id: loanId,
      }).first();
      console.log(" Loan :", loan)
      if (loan) {
        console.log("Loan Selected for Update line 1001:", loan.startDate);
        let isDueForRepayment;
        if (loan.status !== "active") {
          let createdAt = loan.createdAt;
          let duration = loan.duration;
          let timeline;
          let timelineObject;
          try {
            isDueForRepayment = await dueForRepayment(createdAt, duration);
            console.log("Is due for repayment status :", isDueForRepayment);
            // let newRolloverTarget = request.input("rolloverTarget");
            // let newRolloverType = request.input("rolloverType");
            // Restrict update to timed/fixed deposit only
            if (loan && isDueForRepayment === false) {
              loan.amountApproved = amountApproved;
              if (loan) {
                // update timeline
                timelineObject = {
                  id: uuid(),
                  action: "loan updated",
                  // @ts-ignore
                  message: `${loan.loanAccountDetails.firstName} loan has just been updated.`,
                  createdAt: DateTime.now(),
                  meta: `amount approved: ${loan.currencyCode} ${loan.amountApproved}, request type : ${loan.requestType}`,
                };
                console.log("Timeline object line 1041:", timelineObject);
                //  Push the new object to the array
                timeline = loan.timeline;
                timeline.push(timelineObject);
                console.log("Timeline object line 1045:", timeline);
                // stringify the timeline array
                loan.timeline = JSON.stringify(timeline);
                // Save
                await loan.save();
                console.log("Update Loan:", loan);
                // send to user
                return response.json({
                  status: "OK",
                  data: loan.$original,
                });
              }
              return; // 422
            } else {
              return response.status(400).json({
                status: "FAILED",
                data: loan.map((loan) => loan.$original),
                message: "please check your loan parameters",
              });
            }
          } catch (error) {
            console.error("Is due for payout status Error :", error);
            return response.json({ status: "FAILED", data: error.message });
          }
        } else {
          return response.json({
            status: "FAILED",
            data: loan.map((loan) => loan.$original),
          });
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

  public async update({ request, response }: HttpContextContract) {
    try {
      let { walletId, loanId } = request.qs();
      console.log(" walletId and loanId: ", walletId + " " + loanId);
      let { amountApproved } = request.all();
      console.log(" amountApproved line 898: ", amountApproved);
      let loan = await Loan.query().where({
        wallet_id: walletId,
        id: loanId,
      }).first();
      if(!loan) return response.json({status: "FAILED", message: "loan does not exist, or missing parameter."})
      if (loan) {
        console.log("Loan Selected for Update line 1001:", loan[0].startDate);
        let isDueForRepayment;
        if (loan[0].status !== "active") {
          let createdAt = loan[0].createdAt;
          let duration = loan[0].duration;
          let timeline;
          let timelineObject;
          try {
            isDueForRepayment = await dueForRepayment(createdAt, duration);
            console.log("Is due for repayment status :", isDueForRepayment);
            // let newRolloverTarget = request.input("rolloverTarget");
            // let newRolloverType = request.input("rolloverType");
            // Restrict update to timed/fixed deposit only
            if (loan && isDueForRepayment === false) {
              loan[0].amountApproved = amountApproved;
              // loan[0].amount = request.input('amount')
              // loan[0].investmentType = request.input('investmentType')
              // Todo
              // Update Timeline
              // Retrieve the current timeline

              // Turn Timeline string to json

              // push the update to the array

              // Turn Timeline json to string

              // save the timeline to the loan object

              if (loan) {
                // update timeline
                timelineObject = {
                  id: uuid(),
                  action: "loan updated",
                  // @ts-ignore
                  message: `${loan[0].loanAccountDetails.firstName} loan has just been updated.`,
                  createdAt: DateTime.now(),
                  meta: `amount approved: ${loan[0].currencyCode} ${loan[0].amountApproved}, request type : ${loan[0].requestType}`,
                };
                console.log("Timeline object line 1041:", timelineObject);
                //  Push the new object to the array
                timeline = loan[0].timeline;
                timeline.push(timelineObject);
                console.log("Timeline object line 1045:", timeline);
                // stringify the timeline array
                loan[0].timeline = JSON.stringify(timeline);
                // Save
                await loan[0].save();
                console.log("Update Loan:", loan);
                // send to user
                return response.json({
                  status: "OK",
                  data: loan.map((loan) => loan.$original),
                });
              }
              return; // 422
            } else {
              return response.status(400).json({
                status: "FAILED",
                data: loan.map((loan) => loan.$original),
                message: "please check your loan parameters",
              });
            }
          } catch (error) {
            console.error("Is due for payout status Error :", error);
            return response.json({ status: "FAILED", data: error.message });
          }
        } else {
          return response.json({
            status: "FAILED",
            data: loan.map((loan) => loan.$original),
          });
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

  public async getLoanRate({ request, response }: HttpContextContract) {
    let { amount, duration } = request.qs();
    console.log(
      " The Rate return for RATE line 1073: ",
      await generateRate(amount, duration)
    );
    let rate = await generateRate(amount, duration);
    console.log(" Rate return line 1077 : ", rate);
    // @ts-ignore
    if (rate === undefined || rate.length < 1) {
      return response.status(400).json({
        status: "FAILED",
        message: "no loan rate matched your search, please try again.",
        data: [],
      });
    }
    return response.status(200).json({
      status: "OK",
      data: rate,
    });
  }

  public async store({ request, response }: HttpContextContract) {
    // const user = await auth.authenticate()
    const investmentSchema = schema.create({
      walletId: schema.string(),
      amountRequested: schema.number(),
      duration: schema.enum(["7", "14", "21", "30", "45", "60", "90"]),
      tagName: schema.string({ escape: true }, [rules.maxLength(150)]),
      currencyCode: schema.string({ escape: true }, [rules.maxLength(5)]),
      bvn: schema.string({ escape: true }, [
        rules.minLength(11),
        rules.maxLength(11),
      ]),
      loanAccountDetails: schema.object().members({
        firstName: schema.string(),
        lastName: schema.string(),
        email: schema.string([rules.email()]),
        phone: schema.number(),
        loanAccountWalletId: schema.string(),
      }),
      long: schema.number(),
      lat: schema.number(),
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
    // check creditRating

    // check available rate to apply
    let payloadAmount = payload.amountRequested;
    let payloadDuration = payload.duration;
    // console.log(
    //   " The Rate return for RATE line 1141: ",
    //   await generateRate(payloadAmount, payloadDuration)
    // );
    // let rate = Number(await generateRate(payloadAmount, payloadDuration));
    // console.log(" Rate return line 1151 : ", rate);
    // // @ts-ignore
    // if (rate === undefined || rate.length < 1) {
    //   return response.status(400).json({
    //     status: "FAILED",
    //     message: "no loan rate matched your search, please try again.",
    //     data: [],
    //   });
    // }

    // console.log(
    //   " The Rate return for RATE line 1227: ",
    //   await investmentRate(payloadAmount, payloadDuration)
    // );
    // let rate = await investmentRate(payloadAmount, payloadDuration);
    // console.log(" Rate return line 1238 : ", rate);
    // if (rate === undefined || rate.length < 1) {
    //   return response.status(400).json({
    //     status: "FAILED",
    //     message: "no investment rate matched your search, please try again.",
    //     data: [],
    //   });
    // }

    // console.log("Payload line 1160  :", payload);
    // const loan = await Loan.create(payload);
    // loan.interestRate = rate;

    // // When the loan has been approved and activated
    // let amount = loan.amountRequested;
    // let loanDuration = loan.duration;
    // let amountDueOnRepayment = await interestDueOnLoan(
    //   amount,
    //   rate,
    //   loanDuration
    // );
    // // @ts-ignore
    // loan.interestDueOnLoan = amountDueOnRepayment;
    // // @ts-ignore
    // loan.totalAmountToRepay = loan.amountRequested + amountDueOnRepayment;
    // await loan.save();
    // console.log("The new loan:", loan);

    // // TODO
    // // Send Loan Payload To Admin

    // // Send Loan Initiation Message to Queue

    // // check if Approval is set to Auto, from Setting Controller
    // let walletId = loan.walletId;
    // let loanId = loan.id;
    // let requestType = "start loan";
    // let settings = await Setting.query().where({ tagName: "default setting" });
    // console.log("Approval setting line 910:", settings[0]);
    // let timeline: any[] = [];
    // //  create a new object for the timeline
    // let timelineObject = {
    //   id: uuid(),
    //   action: "loan initiated",
    //   // @ts-ignore
    //   message: `${loan.loanAccountDetails.firstName} just initiated a loan of ${loan.currencyCode} ${loan.amountRequested}.`,
    //   createdAt: loan.createdAt,
    //   meta: `duration: ${loan.duration}`,
    // };
    // console.log("Timeline object line 1222:", timelineObject);
    // //  Push the new object to the array
    // timeline.push(timelineObject);

    // console.log("Timeline object line 1226:", timeline);

    // // stringify the timeline array
    // loan.timeline = JSON.stringify(timeline);
    // await loan.save();
    let requestType;
    // let settings = await Setting.query().where({ tagName: "default setting" });
    // console.log("Approval setting line 910:", settings[0]);
    // let timeline: any[] = [];
    //  create a new object for the timeline
    let timelineObject;
    let settings = await Setting.query().where({ tagName: "default setting" });
    console.log("Approval setting line 910:", settings[0]);
    let timeline: any[] = [];
    //  Check if loan activation is automated
    let approvalIsAutomated = settings[0].isLoanAutomated;
    // let approvalIsAutomated = false
    if (approvalIsAutomated === false) {
      console.log(
        " The Rate return for RATE line 1227: ",
        await investmentRate(payloadAmount, payloadDuration)
      );
      let rate = await investmentRate(payloadAmount, payloadDuration);
      console.log(" Rate return line 1238 : ", rate);
      if (rate === undefined || rate.length < 1) {
        return response.status(400).json({
          status: "FAILED",
          message: "no investment rate matched your search, please try again.",
          data: [],
        });
      }

      console.log("Payload line 1160  :", payload);
      const loan = await Loan.create(payload);
      loan.interestRate = rate;

      // When the loan has been approved and activated
      let amount = loan.amountRequested;
      let loanDuration = loan.duration;
      let amountDueOnRepayment = await interestDueOnLoan(
        amount,
        rate,
        loanDuration
      );
      // @ts-ignore
      loan.interestDueOnLoan = amountDueOnRepayment;
      // @ts-ignore
      loan.totalAmountToRepay = loan.amountRequested + amountDueOnRepayment;
      await loan.save();
      console.log("The new loan:", loan);

      // TODO
      // Send Loan Payload To Admin

      // Send Loan Initiation Message to Queue

      // check if Approval is set to Auto, from Setting Controller
      let walletId = loan.walletId;
      let loanId = loan.id;
      requestType = "start loan";
      // let settings = await Setting.query().where({ tagName: "default setting" });
      // console.log("Approval setting line 910:", settings[0]);
      // let timeline: any[] = [];
      //  create a new object for the timeline
      timelineObject = {
        id: uuid(),
        action: "loan initiated",
        // @ts-ignore
        message: `${loan.loanAccountDetails.firstName} just initiated a loan of ${loan.currencyCode} ${loan.amountRequested}.`,
        createdAt: loan.createdAt,
        meta: `duration: ${loan.duration}`,
      };
      console.log("Timeline object line 1186:", timelineObject);
      //  Push the new object to the array
      timeline.push(timelineObject);

      console.log("Timeline object line 1190:", timeline);

      // stringify the timeline array
      loan.timeline = JSON.stringify(timeline);
      await loan.save();

      // Send Approval Request to Admin
      let approval = await approvalRequest(walletId, loanId, requestType);
      console.log(" Approval request return line 1198 : ", approval);
      if (approval === undefined) {
        return response.status(400).json({
          status: "FAILED",
          message:
            "loan approval request was not successful, please try again.",
          data: [],
        });
      }
      let newLoanId = loan.id;
      // Send to Notificaation Service
      // @ts-ignore
      let newLoanEmail = loan.loanAccountDetails.email;
      Event.emit("new:loan", {
        id: newLoanId,
        email: newLoanEmail,
      });
      return response.status(201).json({ status: "OK", data: loan.$original });
    } else if (approvalIsAutomated === true) {
      // TODO
      // Get recommendations
      let amountRecommended;
      amountRecommended = 425000;
      // call Okra

      // call CreditRegistry

      // TODO
      payloadAmount = amountRecommended;
      // loan.amountApproved = amountRecommended;
      payloadDuration = payload.duration;
      payload.amountApproved = amountRecommended;
      // console.log(
      //   " The Rate return for RATE line 1141: ",
      //   await generateRate(payloadAmount, payloadDuration)
      // );
      // let rate = Number(await generateRate(payloadAmount, payloadDuration));
      // console.log(" Rate return line 1151 : ", rate);
      // // @ts-ignore
      // if (rate === undefined || rate.length < 1) {
      //   return response.status(400).json({
      //     status: "FAILED",
      //     message: "no loan rate matched your search, please try again.",
      //     data: [],
      //   });
      // }
      console.log(
        " The Rate return for RATE line 1227: ",
        await investmentRate(payloadAmount, payloadDuration)
      );
      let rate = await investmentRate(payloadAmount, payloadDuration);
      console.log(" Rate return line 1238 : ", rate);
      if (rate === undefined || rate.length < 1) {
        return response.status(400).json({
          status: "FAILED",
          message: "no investment rate matched your search, please try again.",
          data: [],
        });
      }

      console.log("Payload line 1190  :", payload);
      const loan = await Loan.create(payload);
      loan.interestRate = rate;

      // When the loan has been approved and activated
      let amount = loan.amountApproved;
      let loanDuration = loan.duration;
      let amountDueOnRepayment = Number(
        await interestDueOnLoan(amount, rate, loanDuration)
      );
      loan.interestDueOnLoan = amountDueOnRepayment;
      loan.totalAmountToRepay = loan.amountApproved + amountDueOnRepayment;
      await loan.save();
      console.log("The new loan:", loan);

      // Send Loan Payload To Transaction Service
      let sendToTransactionService = "OK"; //= new SendToTransactionService(loan)
      console.log(
        " Feedback from Transaction service: ",
        sendToTransactionService
      );
      if (sendToTransactionService === "OK") {
        // Activate the loan
        loan.amountApproved = amountRecommended;
        loan.requestType = requestType;
        loan.status = "active";
        loan.approvalStatus = "approved";
        loan.startDate = DateTime.now(); //.toISODate()
        loan.repaymentDate = DateTime.now().plus({
          days: parseInt(loanDuration),
        });
        timelineObject = {
          id: uuid(),
          action: "loan activated",
          // @ts-ignore
          message: `${loan.loanAccountDetails.firstName} loan of ${loan.currencyCode} ${loan.amountApproved} has just been approved and activated.`,
          createdAt: loan.startDate,
          meta: `duration: ${loan.duration}, payout date : ${loan.repaymentDate}`,
        };
        console.log("Timeline object line 1272:", timelineObject);
        //  Push the new object to the array
        timeline.push(timelineObject);

        console.log("Timeline object line 1276:", timeline);

        // stringify the timeline array
        loan.timeline = JSON.stringify(timeline);
        await loan.save();
        let newLoanId = loan.id;
        // Send to Notificaation Service
        // @ts-ignore
        let newLoanEmail = loan.loanAccountDetails.email;
        Event.emit("new:loan", {
          id: newLoanId,
          email: newLoanEmail,
        });
        return response
          .status(201)
          .json({ status: "OK", data: loan.$original });
      } else {
        return response.json({
          status: "FAILED",
          message:
            "Loan was not successfully sent to Transaction Service, please try again.",
          data: loan.$original,
        });
      }
    }
    // Save update to database
    // await loan.save();
    //   let newLoanId = loan.id;
    //   // Send to Notificaation Service
    //   // @ts-ignore
    //   let newLoanEmail = loan.loanAccountDetails.email;
    //   Event.emit("new:loan", {
    //     id: newLoanId,
    //     email: newLoanEmail,
    //   });
    //   return response.status(201).json({ status: "OK", data: loan.$original });
  }

  public async getCreditRecommendations({
    request,
    response,
  }: HttpContextContract) {
    //  START
    try {
      let { walletId, loanId } = request.qs();
      console.log(" walletId and loanId: ", walletId + "  " + loanId);

      let amountApproved;

      let loan = await Loan.query().where({
        wallet_id: walletId,
        id: loanId,
      });
      console.log("Loan Selected for Update line 1375:", loan);
      if (loan.length > 0) {
        console.log("Loan Selected for Update line 1377:", loan[0].startDate);
        let payload = loan[0];
        // call Okra

        // Call Credit registry

        // give recommendation based on the report of Okra and CreditRegistry, internal algorithm

        // check available rate to apply
        let payloadAmount = payload.amountRequested;
        let payloadDuration = payload.duration;
        let amountRecommended;
        amountRecommended = 400000;
        // console.log(
        //   " The Rate return for RATE line 1212: ",
        //   await generateRate(payloadAmount, payloadDuration)
        // );
        // let rate = Number(await generateRate(payloadAmount, payloadDuration));
        // console.log(" Rate return line 1151 : ", rate);
        // // @ts-ignore
        // if (rate === undefined || rate.length < 1) {
        //   return response.status(400).json({
        //     status: "FAILED",
        //     message: "no loan rate matched your search, please try again.",
        //     data: [],
        //   });
        // }
        console.log(
          " The Rate return for RATE line 1403: ",
          await investmentRate(payloadAmount, payloadDuration)
        );
        let rate = await investmentRate(payloadAmount, payloadDuration);
        console.log(" Rate return line 1407 : ", rate);
        if (rate === undefined || rate.length < 1) {
          return response.status(400).json({
            status: "FAILED",
            message:
              "no investment rate matched your search, please try again.",
            data: [],
          });
        }

        let isDueForRepayment;
        if (loan[0].status !== "active") {
          let createdAt = loan[0].createdAt;
          let duration = loan[0].duration;
          let timeline;
          let timelineObject;
          try {
            isDueForRepayment = await dueForRepayment(createdAt, duration);
            console.log("Is due for repayment status :", isDueForRepayment);
            if (loan && isDueForRepayment === false) {
              loan[0].amountApproved = amountRecommended; // amountApproved;
              amountApproved = loan[0].amountApproved;
              console.log(" amountApproved line 1429: ", amountApproved);
              // Recalculate the interestRate and totalAmountToRepay
              loan[0].interestRate = rate;
              // When the loan has been approved and activated
              let amount = loan[0].amountApproved;
              let loanDuration = loan[0].duration;
              let amountDueOnRepayment = Number(
                await interestDueOnLoan(amount, rate, loanDuration)
              );
              loan[0].interestDueOnLoan = amountDueOnRepayment;
              loan[0].totalAmountToRepay =
                loan[0].amountApproved + amountDueOnRepayment;
              await loan[0].save();
              console.log("The new loan:", loan[0]);
              if (loan) {
                // update timeline
                timelineObject = {
                  id: uuid(),
                  action: "loan updated",
                  // @ts-ignore
                  message: `${loan[0].loanAccountDetails.firstName} loan has just been updated.`,
                  createdAt: DateTime.now(),
                  meta: `amount approved: ${loan[0].currencyCode} ${loan[0].amountApproved}, request type : ${loan[0].requestType}`,
                };
                console.log("Timeline object line 1453:", timelineObject);
                //  Push the new object to the array
                timeline = loan[0].timeline;
                timeline.push(timelineObject);
                console.log("Timeline object line 1457:", timeline);
                // stringify the timeline array
                loan[0].timeline = JSON.stringify(timeline);
                // Save
                await loan[0].save();
                console.log("Update Loan:", loan);
                // send to user
                return response.json({
                  status: "OK",
                  data: loan.map((loan) => loan.$original),
                });
              }
              return; // 422
            } else {
              return response.status(400).json({
                status: "FAILED",
                data: loan.map((loan) => loan.$original),
                message: "please check your loan parameters",
              });
            }
          } catch (error) {
            console.error("Is due for payout status Error :", error);
            return response.json({ status: "FAILED", data: error.message });
          }
        } else {
          return response.json({
            status: "FAILED",
            data: loan.map((loan) => loan.$original),
          });
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
    // END
  }

  public async approve({ request, response }: HttpContextContract) {
    try {
      // let loan = await Loan.query().where({
      //   wallet_id: params.id,
      //   id: request.input('loanId'),
      // })
      const { loanId, walletId } = request.qs();
      console.log("Loan query: ", request.qs());
      let loan = await Loan.query().where({
        wallet_id: walletId,
        id: loanId,
      });
      console.log(" Loan QUERY RESULT: ", loan);
      if (loan.length > 0) {
        console.log("Loan Selected for Update:", loan);
        let isDueForRepayment = await dueForRepayment(
          loan[0].startDate,
          loan[0].duration
        );
        console.log("Is due for payout status :", isDueForRepayment);
        // Restrict update to timed/fixed deposit only
        // if (loan && loan[0].investmentType !== 'debenture' && isDueForRepayment === false)
        if (loan) {
          loan[0].status = request.input("status")
            ? request.input("status")
            : loan[0].status;
          let loanApprovedStatus = request.input("isLoanApproved");
          loan[0].isLoanApproved =
            request.input("isLoanApproved") !== undefined
              ? request.input("isLoanApproved")
              : loan[0].isLoanApproved;
          console.log("loanApprovedStatus :", loanApprovedStatus);
          if (loan) {
            // send to user
            await loan[0].save();
            console.log("Update Loan:", loan);
            return response.status(200).json({
              status: "OK",
              data: loan.map((inv) => inv.$original),
            });
          }
          return; // 422
        } else {
          return response.status(304).json({ status: "FAILED", data: loan });
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

  public async showApprovalRequest({
    request,
    params,
    response,
  }: HttpContextContract) {
    console.log("LOAN params: ", params);
    const { loanId, status, repaymentDate, walletId, limit } = request.qs();
    console.log("LOAN query: ", request.qs());

    try {
      const loan = await Loan.all();
      // .limit()
      let sortedApprovalRequest = loan;

      if (loanId) {
        // @ts-ignore
        sortedApprovalRequest = await Loan.query().where("id", loanId);
      }

      // if (isPayoutAuthorized) {
      //   sortedApprovalRequest = sortedApprovalRequest.filter((loan) => {
      //     // @ts-ignore
      //     return (
      //       loan.isPayoutAuthorized.toString() === `${isPayoutAuthorized}`
      //     );
      //   });
      // }

      // if (isTerminationAuthorized) {
      //   sortedApprovalRequest = sortedApprovalRequest.filter((loan) => {
      //     // @ts-ignore
      //     return (
      //       loan.isTerminationAuthorized.toString() ===
      //       `${isTerminationAuthorized}`
      //     );
      //   });
      // }

      if (repaymentDate) {
        sortedApprovalRequest = sortedApprovalRequest.filter((loan) => {
          // @ts-ignore
          return loan.repaymentDate.includes(repaymentDate);
        });
      }
      if (status) {
        sortedApprovalRequest = sortedApprovalRequest.filter((loan) => {
          // @ts-ignore
          return loan.status === `${status}`;
        });
      }

      if (walletId) {
        sortedApprovalRequest = sortedApprovalRequest.filter((loan) => {
          // @ts-ignore
          return loan.walletId.toString() === `${walletId}`;
        });
      }
      if (limit) {
        sortedApprovalRequest = sortedApprovalRequest.slice(0, Number(limit));
      }
      if (sortedApprovalRequest.length < 1) {
        return response.status(200).json({
          status: "OK",
          message: "no loan approval request matched your search",
          data: [],
        });
      }
      // return rate(s)
      return response.status(200).json({
        status: "OK",
        data: sortedApprovalRequest.map((inv) => inv.$original),
      });
    } catch (error) {
      console.log(error);
    }
  }

  public async payout({ request, response }: HttpContextContract) {
    try {
      // @ts-ignore
      // let id = request.input('walletId')
      let { walletId, loanId } = request.all();
      console.log(
        "Params for update line 1318: " +
          " walletId: " +
          walletId +
          ", loanId: " +
          loanId
      );
      // let loan = await Loan.query().where('wallet_id', id).where('id', params.id)
      let loan = await Loan.query().where("id", loanId);
      console.log("Loan Info, line 1322: ", loan);
      if (loan.length > 0) {
        console.log("loan search data :", loan[0].$original);
        // @ts-ignore
        // let isDueForRepayment = await dueForPayout(loan[0].startDate, loan[0].duration)
        // console.log('Is due for payout status :', isDueForRepayment)

        // TESTING
        let startDate = DateTime.now().minus({ days: 5 }).toISO();
        let duration = 4;
        console.log("Time loan was started line 1332: ", startDate);
        let timelineObject;
        let timeline;
        let isDueForRepayment = await dueForRepayment(startDate, duration);
        console.log("Is due for payout status line 1336:", isDueForRepayment);
        // let amt = loan[0].amount
        let settings = await Setting.query().where({
          tagName: "default setting",
        });
        console.log("Approval setting line 1339:", settings[0]);
        if (isDueForRepayment) {
          //  START
          let payload = loan[0].$original;
          // send to Admin for approval
          let walletId = payload.walletId;
          let loanId = payload.id;
          let requestType = "payout loan";
          // let  approvalStatus = 'approved'

          let approvalIsAutomated = settings[0].isTerminationAutomated;
          let approvalRequestIsExisting;
          if (approvalIsAutomated === false) {
            approvalRequestIsExisting = await Approval.query().where({
              loan_id: loanId,
              wallet_id: walletId,
              request_type: requestType,
              //  approval_status: approvalStatus,
            });

            console.log(
              "approvalRequestIsExisting line 1366: ",
              approvalRequestIsExisting
            );
            if (approvalRequestIsExisting.length < 1) {
              let approvalRequestIsDone = await approvalRequest(
                walletId,
                loanId,
                requestType
              );
              console.log(
                " Approval request return line 1369 : ",
                approvalRequestIsDone
              );
              if (approvalRequestIsDone === undefined) {
                return response.status(400).json({
                  status: "FAILED",
                  message:
                    "payout approval request was not successful, please try again.",
                  data: [],
                });
              }
            }
            loan = await Loan.query().where("id", loanId);
            loan[0].requestType = requestType;
            // START

            console.log("Updated loan Status line 1379: ", loan);
            console.log("Payout loan data line 1380:", payload);
            payload.loanId = loanId;
            payload.requestType = requestType;
            // check if payout request is existing
            let payoutRequestIsExisting = await Payout.query().where({
              loan_id: loanId,
              wallet_id: walletId,
            });
            console.log(
              "Loan payout Request Is Existing data line 1392:",
              payoutRequestIsExisting
            );
            console.log(
              "Loan payout Request Is Existing data length line 1396:",
              payoutRequestIsExisting.length
            );
            console.log("Loan payload data line 1399:", payload);
            console.log(
              " loan[0].approvalStatus  line 1400:",
              loan[0].approvalStatus
            );
            console.log(" loan[0].status line 1401:", loan[0].status);
            let payout;
            if (
              (payoutRequestIsExisting.length < 1 &&
                loan[0].approvalStatus === "approved" &&
                loan[0].status === "active") ||
              (payoutRequestIsExisting.length < 1 &&
                loan[0].approvalStatus === "approved" &&
                loan[0].status === "payout")
            ) {
              // console.log('Matured Payout loan data line 1392:', payload)
              payload.timeline = JSON.stringify(loan[0].timeline);
              console.log("Matured Payout loan data line 1413:", payload);
              payout = await Payout.create(payload);
              payout.approvalStatus = "pending";
              payout.status = "payout";
              await payout.save();
              console.log("Matured Payout loan data line 1418:", payout);

              // update timeline
              timelineObject = {
                id: uuid(),
                action: "loan payout initiated",
                // @ts-ignore
                message: `${loan[0].loanAccountDetails.firstName} loan has just been sent for payout processing.`,
                createdAt: DateTime.now(),
                meta: `amount to payout: ${loan[0].currencyCode} ${loan[0].totalAmountToRepay}, request type : ${loan[0].requestType}`,
              };
              console.log("Timeline object line 1429:", timelineObject);
              //  Push the new object to the array
              timeline = loan[0].timeline;
              timeline.push(timelineObject);
              console.log("Timeline object line 1433:", timeline);
              // stringify the timeline array
              loan[0].timeline = JSON.stringify(timeline);
              // Save
              await loan[0].save();
              // stringify the timeline array
              payout.timeline = JSON.stringify(timeline);
              // Save
              await payout.save();
            } else if (
              (payoutRequestIsExisting.length > 0 &&
                loan[0].approvalStatus === "approved" &&
                loan[0].status === "active") ||
              (payoutRequestIsExisting.length > 0 &&
                loan[0].approvalStatus === "approved" &&
                loan[0].status === "payout")
            ) {
              // let payout = await Payout.create(payload)
              payoutRequestIsExisting[0].approvalStatus = "pending";
              payoutRequestIsExisting[0].status = "payout";
              await payoutRequestIsExisting[0].save();
              // update timeline
              timelineObject = {
                id: uuid(),
                action: "loan payout initiated",
                // @ts-ignore
                message: `${loan[0].loanAccountDetails.firstName} loan has just been sent for payout processing.`,
                createdAt: DateTime.now(),
                meta: `amount to payout: ${loan[0].currencyCode} ${loan[0].totalAmountToRepay}, request type : ${loan[0].requestType}`,
              };
              console.log("Timeline object line 1463:", timelineObject);
              //  Push the new object to the array
              timeline = loan[0].timeline;
              timeline.push(timelineObject);
              console.log("Timeline object line 1467:", timeline);
              // stringify the timeline array
              loan[0].timeline = JSON.stringify(timeline);
              await loan[0].save();
              // stringify the timeline array
              payoutRequestIsExisting[0].timeline = JSON.stringify(timeline);
              // Save
              await payoutRequestIsExisting[0].save();

              console.log(
                "Matured Payout loan data line 1476:",
                payoutRequestIsExisting[0]
              );
            }
            console.log(
              "Loan payout data after payout request line 1477:",
              payout
            );
            console.log(
              "Loan payout data after payout request line 1480:",
              payoutRequestIsExisting[0]
            );
            // END
            loan[0].status = "active";
            loan[0].approvalStatus = "pending";
            // Save
            await loan[0].save();
          } else if (approvalIsAutomated === true) {
            if (loan[0].status !== "paid") {
              // update status of loan
              loan[0].requestType = requestType;
              loan[0].approvalStatus = "approved";
              loan[0].status = "payout";
              loan[0].isLoanApproved = true;
              // Save
              await loan[0].save();
            }
            // Send notification

            console.log("Updated loan Status line 1315: ", loan);
            console.log("Payout loan data 1:", payload);
            payload.loanId = loanId;
            payload.requestType = requestType;
            // check if payout request is existing
            let payoutRequestIsExisting = await Payout.query().where({
              loan_id: loanId,
              wallet_id: walletId,
            });
            console.log(
              "Loan payout Request Is Existing data line 1527:",
              payoutRequestIsExisting
            );
            console.log(
              "Loan payout Request Is Existing data length line 1531:",
              payoutRequestIsExisting.length
            );
            console.log("Loan payload data line 1534:", payload);
            console.log(
              " loan[0].approvalStatus  line 1535:",
              loan[0].approvalStatus
            );
            console.log(" loan[0].status line 1536:", loan[0].status);
            let payout;
            if (
              (payoutRequestIsExisting.length < 1 &&
                loan[0].approvalStatus === "approved" &&
                loan[0].status === "active") ||
              (payoutRequestIsExisting.length < 1 &&
                loan[0].approvalStatus === "approved" &&
                loan[0].status === "payout")
            ) {
              payload.timeline = JSON.stringify(loan[0].timeline);
              console.log("Matured Payout loan data line 1548:", payload);
              payout = await Payout.create(payload);
              payout.status = "payout";
              await payout.save();
              console.log("Matured Payout loan data line 1551:", payout);

              // update timeline
              timelineObject = {
                id: uuid(),
                action: "loan payout approved",
                // @ts-ignore
                message: `${loan[0].loanAccountDetails.firstName} loan has just been approved for payout.`,
                createdAt: payout.createdAt,
                meta: `amount to payout: ${loan[0].currencyCode} ${loan[0].totalAmountToRepay}, request type : ${loan[0].requestType}`,
              };
              console.log("Timeline object line 1562:", timelineObject);
              //  Push the new object to the array
              timeline = loan[0].timeline;
              timeline.push(timelineObject);
              console.log("Timeline object line 1566:", timeline);
              // stringify the timeline array
              loan[0].timeline = JSON.stringify(timeline);
              // Save
              await loan[0].save();
              // stringify the timeline array
              payout.timeline = JSON.stringify(timeline);
              // Save
              await payout.save();
            } else if (
              (payoutRequestIsExisting.length > 0 &&
                loan[0].approvalStatus === "approved" &&
                loan[0].status === "active") ||
              (payoutRequestIsExisting.length > 0 &&
                loan[0].approvalStatus === "approved" &&
                loan[0].status === "payout")
            ) {
              // let payout = await Payout.create(payload)
              payoutRequestIsExisting[0].status = "payout";
              await payoutRequestIsExisting[0].save();
              // update timeline
              timelineObject = {
                id: uuid(),
                action: "loan payout approved",
                // @ts-ignore
                message: `${loan[0].loanAccountDetails.firstName} loan has just been approved for payout.`,
                createdAt: DateTime.now(),
                meta: `amount to repay: ${loan[0].currencyCode} ${loan[0].totalAmountToRepay}, request type : ${loan[0].requestType}`,
              };
              console.log("Timeline object line 1595:", timelineObject);
              //  Push the new object to the array
              timeline = loan[0].timeline;
              timeline.push(timelineObject);
              console.log("Timeline object line 1599:", timeline);
              // stringify the timeline array
              loan[0].timeline = JSON.stringify(timeline);
              await loan[0].save();
              // stringify the timeline array
              payoutRequestIsExisting[0].timeline = JSON.stringify(timeline);
              // Save
              await payoutRequestIsExisting[0].save();

              console.log(
                "Matured Payout loan data line 1608:",
                payoutRequestIsExisting[0]
              );
            }

            console.log(
              "Loan payout data after payout request line 1616:",
              payout
            );
            console.log(
              "Loan payout data after payout request line 1618:",
              payoutRequestIsExisting[0]
            );
            await loan[0].save();
          }

          console.log("Loan data after payout request line 1392:", loan);
          return response.status(200).json({
            status: "OK",
            data: loan.map((inv) => inv.$original),
          });
          // END
        } else {
          //  START
          // if the loan has not matured, i.e terminated
          let payload = loan[0].$original;
          // send to Admin for approval
          let walletId = payload.walletId;
          let loanId = payload.id;
          let requestType = "terminate loan";
          // let approvalStatus = 'approved'
          let settings = await Setting.query().where({
            tagName: "default setting",
          });
          console.log("Approval setting line 1241:", settings[0]);
          let approvalRequestIsExisting;
          let approvalIsAutomated = settings[0].isTerminationAutomated; // isDisbursementAutomated
          if (approvalIsAutomated === false) {
            approvalRequestIsExisting = await Approval.query().where({
              loan_id: loanId,
              wallet_id: walletId,
              request_type: requestType,
              //  approval_status: approvalStatus,
            });
            console.log(
              "approvalRequestIsExisting line 1366: ",
              approvalRequestIsExisting
            );
            if (approvalRequestIsExisting.length < 1) {
              let approvalRequestIsDone = await approvalRequest(
                walletId,
                loanId,
                requestType
              );
              console.log(
                " Approval request return line 1245 : ",
                approvalRequestIsDone
              );
              if (approvalRequestIsDone === undefined) {
                return response.status(400).json({
                  status: "FAILED",
                  message:
                    "termination approval request was not successful, please try again.",
                  data: [],
                });
              }
            }

            loan = await Loan.query().where("id", loanId);
            loan[0].requestType = requestType;
            payload.loanId = loanId;
            payload.requestType = requestType;
            // check if payout request is existing
            let payout;
            let payoutRequestIsExisting = await Payout.query().where({
              loan_id: loanId,
              wallet_id: walletId,
            });
            console.log(
              "Loan payout Request Is Existing data line 1264:",
              payoutRequestIsExisting
            );
            if (
              payoutRequestIsExisting.length < 1 &&
              loan[0].approvalStatus === "approved" &&
              loan[0].status === "active"
            ) {
              console.log("Payout loan data 1:", payload);
              payload.timeline = JSON.stringify(loan[0].timeline);
              console.log("Payout loan data line 1576:", payload);
              payout = await Payout.create(payload);
              payout.status = "terminated";
              await payout.save();
              console.log("Terminated Payout loan data line 1276:", payout);
            } else if (
              payoutRequestIsExisting.length > 0 &&
              loan[0].approvalStatus === "approved" &&
              loan[0].status === "active"
            ) {
              console.log("Payout loan data 1:", payload);
              payout.status = "terminated";
              await payout.save();
              console.log("Terminated Payout loan data line 1285:", payout);
            }
            loan[0].status = "active";
            loan[0].approvalStatus = "pending";
            // Save
            await loan[0].save();
          } else if (approvalIsAutomated === true) {
            let payout;
            loan[0].requestType = requestType;
            // Save
            await loan[0].save();
            payload.loanId = loanId;
            payload.requestType = requestType;
            // check if payout request is existing
            let payoutRequestIsExisting = await Payout.query().where({
              loan_id: loanId,
              wallet_id: walletId,
            });
            console.log(
              "Loan payout Request Is Existing data line 1304:",
              payoutRequestIsExisting
            );
            if (
              payoutRequestIsExisting.length < 1 &&
              loan[0].approvalStatus === "approved" &&
              loan[0].status === "active"
            ) {
              console.log("Payout loan data 1:", payload);
              payload.timeline = JSON.stringify(loan[0].timeline);
              console.log("Loan data line 1618:", payload);

              payout = await Payout.create(payload);
              payout.status = "terminated";
              await payout.save();
              console.log("Terminated Payout loan data line 1316:", payout);
            } else if (
              payoutRequestIsExisting.length > 0 &&
              loan[0].approvalStatus === "approved" &&
              loan[0].status === "active"
            ) {
              console.log("Payout loan data 1:", payload);
              payout.status = "terminated";
              await payout.save();
              console.log("Terminated Payout loan data line 1325:", payout);
            }

            loan[0].status = "terminated";
            loan[0].approvalStatus = "approved";
            loan[0].isLoanApproved = true;
            await loan[0].save();
          }
          // update timeline
          timelineObject = {
            id: uuid(),
            action: "loan termination initiated",
            // @ts-ignore
            message: `${loan[0].loanAccountDetails.firstName} loan has just been sent for termination processing.`,
            createdAt: DateTime.now(),
            meta: `amount to rrepay: ${loan[0].totalAmountToRepay}, request type : ${loan[0].requestType}`,
          };
          console.log("Timeline object line 1509:", timelineObject);
          //  Push the new object to the array
          timeline = loan[0].timeline;
          timeline.push(timelineObject);

          console.log("Timeline object line 1514:", timeline);

          // stringify the timeline array
          loan[0].timeline = JSON.stringify(timeline);
          await loan[0].save();

          console.log("Terminated Payout loan data line 1521:", loan);
          return response.status(200).json({
            status: "OK",
            data: loan.map((inv) => inv.$original),
          });
          // END
        }
      } else {
        return response.status(404).json({
          status: "FAILED",
          message: "no loan matched your search",
          data: [],
        });
      }
    } catch (error) {
      console.error(error);
    }
  }

  public async processPayment({ request, response }: HttpContextContract) {
    try {
      // @ts-ignore
      let { walletId, loanId } = request.all();
      console.log(
        "Params for update line 1359: " +
          " walletId: " +
          walletId +
          ", loanId: " +
          loanId
      );
      let loan;
      try {
        loan = await Loan.query().where({
          id: loanId,
          wallet_id: walletId,
        });
      } catch (error) {
        console.error(error);
        return response.json({ status: "FAILED", message: error.message });
      }
      if (loan.length > 0) {
        let investmentData = loan[0];
        let rolloverType = loan[0].rolloverType;
        let amount = loan[0].amount;
        let duration = loan[0].duration;
        let investmentType = loan[0].investmentType;
        let rolloverTarget = loan[0].rolloverTarget;
        let rolloverDone = loan[0].rolloverDone;
        let currencyCode = loan[0].currencyCode;
        let isTransactionSentForProcessing;
        let payload;
        let payout;
        let timelineObject;
        let timeline;
        let settings = await Setting.query().where({
          tagName: "default setting",
        });
        console.log("Approval setting line 1568:", settings[0]);
        console.log("Loan Info, line 1569: ", loan);
        if (
          (loan.length > 0 &&
            loan[0].isPayoutAuthorized === true &&
            loan[0].isTerminationAuthorized === true &&
            loan[0].requestType === "payout loan" &&
            loan[0].approvalStatus === "approved" &&
            loan[0].status === "payout") ||
          (loan.length > 0 &&
            loan[0].isPayoutAuthorized === true &&
            loan[0].isTerminationAuthorized === false &&
            loan[0].requestType === "payout loan" &&
            loan[0].approvalStatus === "approved" &&
            loan[0].status === "payout") ||
          (loan.length > 0 &&
            loan[0].isPayoutAuthorized === false &&
            loan[0].isTerminationAuthorized === true &&
            loan[0].requestType === "terminate loan" &&
            loan[0].approvalStatus === "approved" &&
            loan[0].status === "terminated") ||
          (loan.length > 0 &&
            loan[0].isPayoutAuthorized === true &&
            loan[0].isTerminationAuthorized === true &&
            loan[0].requestType === "terminate loan" &&
            loan[0].approvalStatus === "approved" &&
            loan[0].status === "terminated")
        ) {
          console.log("loan search data line 1596 :", loan[0].$original);
          // @ts-ignore
          // let isDueForRepayment = await dueForPayout(loan[0].startDate, loan[0].duration)
          // console.log('Is due for payout status :', isDueForRepayment)

          // let payoutIsApproved = true
          // Notify
          if (
            loan[0].isPayoutAuthorized === true ||
            loan[0].isTerminationAuthorized === true
          ) {
            // Check Rollover Type
            // let rolloverType = loan[0].rolloverType
            // let amount = loan[0].amount
            // let duration = loan[0].duration
            // let investmentType = loan[0].investmentType
            // let rolloverTarget = loan[0].rolloverTarget
            // let rolloverDone = loan[0].rolloverDone
            // let currencyCode = loan[0].currencyCode
            // let isTransactionSentForProcessing
            if (rolloverType === "100") {
              // Save the payment data in payout table
              payload = investmentData;
              console.log("Payout loan data line 1619:", payload);
              // payout = await Payout.create(payload)
              // payout.status = 'matured'
              // await payout.save()
              // console.log('Matured Payout loan data line 1235:', payout)

              // check if payout request is existing
              let payoutRequestIsExisting = await Payout.query().where({
                loan_id: loanId,
                wallet_id: walletId,
              });
              console.log(
                "Loan payout Request Is Existing data line 1631:",
                payoutRequestIsExisting
              );
              if (
                payoutRequestIsExisting.length < 1 &&
                // loan[0].requestType !== 'start loan' &&
                loan[0].approvalStatus !== "pending" &&
                loan[0].status !== "initiated"
              ) {
                console.log("Payout loan data line 1781:", payload);
                payload.timeline = JSON.stringify(loan[0].timeline);
                console.log("Payout loan data line 1783:", payload);

                payout = await Payout.create(payload);
                payout.status = "payout";
                await payout.save();
                console.log("Matured Payout loan data line 1788:", payout);
              } else {
                payoutRequestIsExisting[0].requestType = "payout loan";
                payoutRequestIsExisting[0].approvalStatus = "approved";
                payoutRequestIsExisting[0].status = "payout";
                loan[0].status = "payout";
                // Save
                await payoutRequestIsExisting[0].save();
                await loan[0].save();
              }

              // If payment processing is automated
              let paymentProcessingIsAutomated =
                settings[0].isDisbursementAutomated;
              if (paymentProcessingIsAutomated === true) {
                //  Proceed to payout the Total Amount due on maturity
                loan[0].requestType = "payout payment";
                loan[0].approvalStatus = "approved";
                loan[0].status = "payout";
                loan[0].save();
                // Send Payment Details to Transaction Service
                // use try catch
                try {
                  // TODO
                  // Update with the real transaction service endpoint and payload
                  let rate = await sendPaymentDetails(
                    amount,
                    duration,
                    investmentType
                  );
                  console.log(" Rate return line 1669 : ", rate);
                } catch (error) {
                  console.error(error);
                  return response.send({
                    status: "FAILED",
                    message: "The transaction was not sent successfully.",
                    error: error.message,
                  });
                }
                // Update with the appropriate endpoint and data
                isTransactionSentForProcessing = true;
                if (isTransactionSentForProcessing === false) {
                  return response.send({
                    status: "FAILED",
                    message: "The transaction was not sent successfully.",
                    isTransactionInProcess: isTransactionSentForProcessing,
                  });
                }
                // update timeline
                timelineObject = {
                  id: uuid(),
                  action: "loan payment initiated",
                  // @ts-ignore
                  message: `${loan[0].walletHolderDetails.firstName} loan has just been sent for payment processing.`,
                  createdAt: DateTime.now(),
                  meta: `amount to payout: ${loan[0].totalAmountToPayout}, request type : ${loan[0].requestType}`,
                };
                console.log("Timeline object line 1696:", timelineObject);
                //  Push the new object to the array
                timeline = loan[0].timeline;
                timeline.push(timelineObject);

                console.log("Timeline object line 1701:", timeline);

                // stringify the timeline array
                loan[0].timeline = JSON.stringify(timeline);
                await loan[0].save();

                return response.send({
                  status: "OK",
                  message:
                    "No Rollover was set on this loan, but the transaction was sent successfully for payment processing.",
                  isTransactionInProcess: isTransactionSentForProcessing,
                  data: loan[0].$original,
                });
              } else {
                let requestType = "payout payment";
                let approvalRequestIsDone = await approvalRequest(
                  walletId,
                  loanId,
                  requestType
                );
                console.log(
                  " Approval request return line 1717 : ",
                  approvalRequestIsDone
                );
                if (approvalRequestIsDone === undefined) {
                  return response.status(400).json({
                    status: "FAILED",
                    message:
                      "payment processing approval request was not successful, please try again.",
                    data: [],
                  });
                }
                loan = await Loan.query().where("id", loanId);
                loan[0].requestType = requestType;
                loan[0].status = "payout";
                loan[0].approvalStatus = "pending";

                // update timeline
                timelineObject = {
                  id: uuid(),
                  action: "loan termination initiated",
                  // @ts-ignore
                  message: `${loan[0].walletHolderDetails.firstName} loan has just been sent for termination processing.`,
                  createdAt: DateTime.now(),
                  meta: `amount to payout: ${loan[0].totalAmountToPayout}, request type : ${loan[0].requestType}`,
                };
                console.log("Timeline object line 1740:", timelineObject);
                //  Push the new object to the array
                timeline = loan[0].timeline;
                timeline.push(timelineObject);
                console.log("Timeline object line 1744:", timeline);
                // stringify the timeline array
                loan[0].timeline = JSON.stringify(timeline);
                // Save
                await loan[0].save();

                // TODO
                // Update with the appropriate endpoint and data

                return response.send({
                  status: "OK",
                  message:
                    "No Rollover was set on this loan, but the transaction was sent successfully for payment processing approval.",
                  isTransactionInProcess: isTransactionSentForProcessing,
                  data: loan[0].$original,
                });
              }
            } else {
              // If the loan has rollover
              // Check RollOver Target
              /**
               * .enum('rollover_type', ['100' = 'no rollover',
               *  '101' = 'rollover principal only',
               * '102' = 'rollover principal with interest',
               * '103' = 'rollover interest only'])
               */

              console.log(
                "Data for line 1542: ",
                rolloverType,
                amount,
                duration,
                investmentType,
                rolloverTarget,
                rolloverDone
              );
              //  function for effecting the set rollover
              const effectRollover = async (
                investmentData,
                amount,
                rolloverType,
                rolloverDone,
                rolloverTarget
              ) => {
                return new Promise(async (resolve, reject) => {
                  console.log(
                    "Datas line 1562 : ",
                    investmentData,
                    amount,
                    rolloverType,
                    rolloverDone,
                    rolloverTarget
                  );
                  if (!investmentData || rolloverTarget < 0) {
                    reject(
                      new Error(
                        "Incomplete parameters , or no rollover target was set, or is less than allowed range"
                      )
                    );
                  }
                  let amountToPayoutNow;
                  let amountToBeReinvested;
                  let timelineObject;
                  let timeline;
                  let rolloverIsSuccessful;
                  let settings = await Setting.query().where({
                    tagName: "default setting",
                  });
                  console.log("Approval setting line 2081:", settings[0]);
                  if (rolloverDone >= rolloverTarget) {
                    let payload = investmentData;
                    let payout;
                    let loanId = payload.id;
                    walletId = payload.walletId;
                    let requestType = "payout loan";
                    amountToPayoutNow =
                      amount + investmentData.interestDueOnLoan;
                    // Send Loan Initiation Message to Queue
                    payload = investmentData;
                    console.log("Payout loan data line 2091:", payload);
                    // check if payout request is existing
                    let payoutRequestIsExisting = await Payout.query().where({
                      loan_id: loanId,
                      wallet_id: walletId,
                    });
                    console.log(
                      "Loan payout Request Is Existing data line 2098:",
                      payoutRequestIsExisting
                    );
                    if (
                      payoutRequestIsExisting.length < 1 &&
                      // loan[0].requestType !== 'start loan' &&
                      payload.approvalStatus !== "pending" &&
                      payload.status !== "initiated"
                    ) {
                      console.log("Payout loan data line 2107:", payload);
                      payload.timeline = JSON.stringify(loan[0].timeline);
                      console.log("Payout loan data line 2109:", payload);

                      payout = await Payout.create(payload);
                      payout.status = "payout";
                      payout.isPayoutAuthorized = loan[0].isPayoutAuthorized;
                      payout.isTerminationAuthorized =
                        loan[0].isTerminationAuthorized;

                      await payout.save();
                      console.log(
                        "Matured Payout loan data line 2117:",
                        payout
                      );
                    } else {
                      payoutRequestIsExisting[0].requestType =
                        loan[0].requestType;
                      payoutRequestIsExisting[0].isPayoutAuthorized =
                        loan[0].isPayoutAuthorized;
                      payoutRequestIsExisting[0].isTerminationAuthorized =
                        loan[0].isTerminationAuthorized;
                      payoutRequestIsExisting[0].status = "payout";
                      // loan[0]
                      payload.status = "payout";
                      //  Save
                      await payoutRequestIsExisting[0].save();
                      await payload.save();
                    }

                    let isDisbursementAutomated =
                      settings[0].isDisbursementAutomated;
                    if (isDisbursementAutomated === false) {
                      try {
                        let approvalRequestIsDone = await approvalRequest(
                          walletId,
                          loanId,
                          requestType
                        );
                        console.log(
                          " Approval request return line 1672 : ",
                          approvalRequestIsDone
                        );
                        if (approvalRequestIsDone === undefined) {
                          return response.status(400).json({
                            status: "FAILED",
                            message:
                              "payment processing approval request was not successful, please try again.",
                            data: [],
                          });
                        }
                      } catch (error) {
                        console.error(error);
                        return response.send({
                          status: "FAILED",
                          message:
                            "The approval request for this transaction was not sent successfully.",
                          error: error.message,
                        });
                      }

                      // update timeline
                      timelineObject = {
                        id: uuid(),
                        action: "loan payment approval initiated",
                        // @ts-ignore
                        message: `${loan[0].walletHolderDetails.firstName} loan has just been sent for payment processing approval.`,
                        createdAt: DateTime.now(),
                        meta: `amount to payout: ${loan[0].totalAmountToPayout}, request type : ${loan[0].requestType}`,
                      };
                      console.log("Timeline object line 2168:", timelineObject);
                      //  Push the new object to the array
                      timeline = loan[0].timeline;
                      timeline.push(timelineObject);
                      console.log("Timeline object line 2173:", timeline);
                      // stringify the timeline array
                      loan[0].timeline = JSON.stringify(timeline);
                      // Save
                      await loan[0].save();

                      return response.send({
                        status: "OK",
                        message:
                          "Rollover target has been reached or exceeded, and the loan details has been sent to admin for payout approval.",
                        data: loan[0].$original,
                      });
                    } else {
                      try {
                        // TODO
                        // Send Payment details to Transaction Service
                        // Update with the real transaction service endpoint and payload
                        let rate = await sendPaymentDetails(
                          amount,
                          duration,
                          investmentType
                        );
                        console.log(" Rate return line 2190 : ", rate);
                      } catch (error) {
                        console.error(error);
                        return response.send({
                          status: "FAILED",
                          message: "The transaction was not sent successfully.",
                          error: error.message,
                        });
                      }
                      isTransactionSentForProcessing = true;
                      if (isTransactionSentForProcessing === false) {
                        return response.send({
                          status: "FAILED",
                          message: "The transaction was not sent successfully.",
                          isTransactionInProcess:
                            isTransactionSentForProcessing,
                        });
                      }
                      //}
                      // update timeline
                      timelineObject = {
                        id: uuid(),
                        action: "loan payout initiated",
                        // @ts-ignore
                        message: `${loan[0].walletHolderDetails.firstName} loan has just been sent for payment processing.`,
                        createdAt: DateTime.now(),
                        meta: `amount to payout: ${loan[0].totalAmountToPayout}, request type : ${loan[0].requestType}`,
                      };
                      console.log("Timeline object line 2217:", timelineObject);
                      //  Push the new object to the array
                      timeline = loan[0].timeline;
                      timeline.push(timelineObject);
                      console.log("Timeline object line 2221:", timeline);
                      // stringify the timeline array
                      loan[0].timeline = JSON.stringify(timeline);
                      // Save
                      await loan[0].save();

                      return response.send({
                        status: "OK",
                        message:
                          "Rollover target has been reached or exceeded, and payout of the sum total of your principal and interest has been initiated.",
                        data: loan[0].$original,
                      });
                    }
                  }
                  // if rolloverDone < rolloverTarget
                  investmentData = loan[0];
                  let payload = investmentData;
                  console.log("Payload line 1969 :", payload);
                  let payloadDuration = investmentData.duration;
                  let payloadInvestmentType = investmentData.investmentType;
                  let payout;
                  let newTimeline: any[] = [];
                  let rate;

                  switch (rolloverType) {
                    case "101":
                      //'101' = 'rollover principal only',
                      amountToBeReinvested = amount;
                      payloadDuration = loan[0].duration;
                      payloadInvestmentType = loan[0].investmentType;
                      amountToPayoutNow = loan[0].interestDueOnLoan;
                      // loan[0].amount = amountToBeReinvested
                      loan[0].totalAmountToPayout = amountToPayoutNow;
                      rolloverDone = rolloverDone + 1;
                      loan[0].rolloverTarget = rolloverTarget;
                      loan[0].rolloverDone = rolloverDone;
                      await loan[0].save();
                      investmentData = loan[0];
                      // Save the payment data in payout table
                      payload = investmentData;
                      console.log("Payout loan data line 2475:", payload);
                      payload.timeline = JSON.stringify(loan[0].timeline);
                      console.log(
                        "Matured Payout loan data line 2477:",
                        payload
                      );

                      payout = await Payout.create(payload);
                      payout.status = "payout";
                      await payout.save();
                      console.log(
                        "Matured Payout loan data line 2482:",
                        payout
                      );

                      // send payment details to transction service

                      // Send Notification

                      console.log(
                        " The Rate return for RATE line 2491: ",
                        await investmentRate(
                          amountToBeReinvested,
                          payloadDuration,
                          payloadInvestmentType
                        )
                      );
                      rate = await investmentRate(
                        amountToBeReinvested,
                        payloadDuration,
                        payloadInvestmentType
                      );
                      console.log(" Rate return line 2503 : ", rate);
                      if (rate === undefined) {
                        //  send the money to the investor wallet
                        console.log(
                          `Principal of ${currencyCode} ${amountToBeReinvested} and the interest of ${currencyCode} ${amountToPayoutNow} was paid, because there was no loan product that matched your request.`
                        );
                        // update timeline
                        timelineObject = {
                          id: uuid(),
                          action: "matured loan payout",
                          // @ts-ignore
                          message: `${loan[0].walletHolderDetails.firstName} payment on loan has just been sent.`,
                          createdAt: DateTime.now(),
                          meta: `amount invested: ${
                            loan[0].amount
                          },amount paid: ${
                            loan[0].interestDueOnLoan + loan[0].amount
                          }, request type : ${loan[0].requestType}`,
                        };
                        console.log(
                          "Timeline object line 2518:",
                          timelineObject
                        );
                        //  Push the new object to the array
                        newTimeline = JSON.parse(loan[0].timeline);
                        // newTimeline = loan[0].timeline
                        newTimeline.push(timelineObject);
                        console.log("Timeline object line 2522:", newTimeline);
                        // stringify the timeline array
                        loan[0].timeline = JSON.stringify(newTimeline);
                        // Save
                        await loan[0].save();
                        rolloverIsSuccessful = false;
                        break;

                        // return response.status(400).json({
                        //   status: 'FAILED',
                        //   message: 'no loan rate matched your search, please try again.',
                        //   data: [],
                        // })
                      }
                      // initiate a new loan
                      var isNewInvestmentCreated = await createNewInvestment(
                        amountToBeReinvested,
                        payloadDuration,
                        payloadInvestmentType,
                        investmentData
                      );
                      console.log(
                        "new loan is created: ",
                        isNewInvestmentCreated
                      );
                      if (isNewInvestmentCreated === undefined) {
                        // send the money to the user
                        // send payment details to transction service
                        // Send Notification
                        rolloverIsSuccessful = false;
                        break;
                        //  return response.status(404).json({
                        //    status: 'FAILED',
                        //    message: 'reinvestment was not successful, please try again',
                        //    data: [
                        //      amountToBeReinvested,
                        //      payloadDuration,
                        //      payloadInvestmentType,
                        //      investmentData,
                        //    ],
                        //  })
                        // break
                      }
                      console.log(
                        `Principal of ${currencyCode} ${amountToBeReinvested} was Reinvested and the interest of ${currencyCode} ${amountToPayoutNow} was paid`
                      );
                      // update timeline
                      timelineObject = {
                        id: uuid(),
                        action: "matured loan payout",
                        // @ts-ignore
                        message: `${loan[0].walletHolderDetails.firstName} payment on loan has just been sent.`,
                        createdAt: DateTime.now(),
                        meta: `amount reinvested: ${loan[0].amount},amount paid: ${loan[0].totalAmountToPayout}, request type : ${loan[0].requestType}`,
                      };
                      console.log("Timeline object line 2554:", timelineObject);
                      //  Push the new object to the array
                      newTimeline = JSON.parse(loan[0].timeline);
                      // newTimeline = loan[0].timeline
                      newTimeline.push(timelineObject);
                      console.log("Timeline object line 2558:", newTimeline);
                      // stringify the timeline array
                      loan[0].timeline = JSON.stringify(newTimeline);
                      // Save
                      await loan[0].save();
                      rolloverIsSuccessful = true;
                      break;
                    case "102":
                      // '102' = 'rollover principal plus interest',
                      amountToBeReinvested = amount + loan[0].interestDueOnLoan;
                      payloadDuration = loan[0].duration;
                      payloadInvestmentType = loan[0].investmentType;
                      //  loan[0].amount = amountToBeReinvested
                      loan[0].totalAmountToPayout = 0;
                      amountToPayoutNow = loan[0].totalAmountToPayout;
                      rolloverDone = rolloverDone + 1;
                      loan[0].rolloverTarget = rolloverTarget;
                      loan[0].rolloverDone = rolloverDone;
                      await loan[0].save();
                      investmentData = loan[0];
                      // Save the payment data in payout table
                      payload = investmentData;
                      console.log("Payout loan data line 2578:", payload);
                      payload.timeline = JSON.stringify(loan[0].timeline);
                      console.log(
                        "Matured Payout loan data line 2580:",
                        payload
                      );
                      payout = await Payout.create(payload);
                      payout.status = "payout";
                      await payout.save();
                      console.log(
                        "Matured Payout loan data line 2584:",
                        payout
                      );

                      // send payment details to transction service

                      // Send Notification

                      console.log(
                        " The Rate return for RATE line 2591: ",
                        await investmentRate(
                          amountToBeReinvested,
                          payloadDuration,
                          payloadInvestmentType
                        )
                      );
                      rate = await investmentRate(
                        amountToBeReinvested,
                        payloadDuration,
                        payloadInvestmentType
                      );
                      console.log(" Rate return line 2603 : ", rate);
                      if (rate === undefined) {
                        //  send the money to the investor wallet
                        console.log(
                          `Principal of ${currencyCode} ${amountToBeReinvested} and the interest of ${currencyCode} ${amountToPayoutNow} was paid, because there was no loan product that matched your request.`
                        );
                        // update timeline
                        timelineObject = {
                          id: uuid(),
                          action: "matured loan payout",
                          // @ts-ignore
                          message: `${loan[0].walletHolderDetails.firstName} payment on loan has just been sent.`,
                          createdAt: DateTime.now(),
                          meta: `amount paid back to wallet: ${amountToBeReinvested},interest: ${loan[0].totalAmountToPayout}, request type : ${loan[0].requestType}`,
                        };
                        console.log(
                          "Timeline object line 2618:",
                          timelineObject
                        );
                        //  Push the new object to the array
                        newTimeline = JSON.parse(loan[0].timeline);
                        // newTimeline = loan[0].timeline
                        newTimeline.push(timelineObject);
                        console.log("Timeline object line 2622:", newTimeline);
                        // stringify the timeline array
                        loan[0].timeline = JSON.stringify(newTimeline);
                        // Save
                        await loan[0].save();
                        rolloverIsSuccessful = false;
                        break;
                        // return response.status(400).json({
                        //   status: 'FAILED',
                        //   message: 'no loan rate matched your search, please try again.',
                        //   data: [],
                        // })
                      }

                      // initiate a new loan
                      isNewInvestmentCreated = await createNewInvestment(
                        amountToBeReinvested,
                        payloadDuration,
                        payloadInvestmentType,
                        investmentData
                      );
                      console.log(
                        "new loan is created 2628: ",
                        isNewInvestmentCreated
                      );
                      if (isNewInvestmentCreated === undefined) {
                        // send the money to the user
                        // send payment details to transction service
                        // Send Notification

                        rolloverIsSuccessful = false;
                        break;
                        // return response.status(404).json({
                        //   status: 'FAILED',
                        //   message: 'reinvestment was not successful, please try again',
                        //   data: [
                        //     amountToBeReinvested,
                        //     payloadDuration,
                        //     payloadInvestmentType,
                        //     investmentData,
                        //   ],
                        // })
                        // break
                      }

                      console.log(
                        `The Sum Total of the Principal and the interest of ${currencyCode} ${amountToBeReinvested} was Reinvested`
                      );
                      // update timeline

                      timelineObject = {
                        id: uuid(),
                        action: "matured loan payout",
                        // @ts-ignore
                        message: `${loan[0].walletHolderDetails.firstName} payment for matured loan has just been sent.`,
                        createdAt: DateTime.now(),
                        meta: `amount paid: ${loan[0].totalAmountToPayout},amount reinvested: ${amountToBeReinvested}, request type : ${loan[0].requestType}`,
                      };
                      console.log("Timeline object line 2686:", timelineObject);
                      //  Push the new object to the array
                      console.log(
                        "Timeline object line 2688:",
                        loan[0].timeline
                      );
                      newTimeline = JSON.parse(loan[0].timeline);
                      console.log("Timeline object line 2690:", newTimeline);
                      newTimeline.push(timelineObject);
                      console.log("Timeline object line 2692:", newTimeline);
                      // stringify the timeline array
                      loan[0].timeline = JSON.stringify(newTimeline);
                      // Save
                      await loan[0].save();
                      rolloverIsSuccessful = true;
                      break;
                    // case '103':
                    //   // '103' = 'rollover interest only'
                    //   amountToBeReinvested = loan[0].interestDueOnLoan
                    //   amountToPayoutNow = amount
                    //   payloadDuration = loan[0].duration
                    //   payloadInvestmentType = loan[0].investmentType
                    //   loan[0].amount = amountToBeReinvested
                    //   loan[0].totalAmountToPayout = amountToPayoutNow
                    //   rolloverDone = rolloverDone + 1
                    //   loan[0].rolloverTarget = rolloverTarget
                    //   loan[0].rolloverDone = rolloverDone
                    //   await loan[0].save()
                    //   investmentData = loan[0]
                    //   // Save the payment data in payout table
                    //   payload = investmentData
                    //   console.log('Payout loan data line 1941:', payload)
                    //   payout = await Payout.create(payload)
                    //   payout.status = 'payout'
                    //   await payout.save()
                    //   console.log('Matured Payout loan data line 1945:', payout)
                    //   // send payment details to transction service

                    //   // Send Notification

                    //   // initiate a new loan
                    //   investmentCreated = await createInvestment(
                    //     amountToBeReinvested,
                    //     payloadDuration,
                    //     payloadInvestmentType,
                    //     investmentData
                    //   )
                    //   console.log('investmentCreated data line 1990:', investmentCreated)
                    //   if (investmentCreated === undefined) {
                    //     // send the money to the user
                    //     // send payment details to transction service
                    //     // Send Notification
                    // return response.status(404).json({
                    //   status: 'FAILED',
                    //   message: 'reinvestment was not successful, please try again',
                    //   data: [
                    //     amountToBeReinvested,
                    //     payloadDuration,
                    //     payloadInvestmentType,
                    //     investmentData,
                    //   ],
                    // })
                    //   }

                    //   console.log(
                    //     `The Interest of ${currencyCode} ${amountToBeReinvested} was Reinvested and the Principal of ${currencyCode} ${amountToPayoutNow} was paid`
                    //   )
                    //   break
                    default:
                      console.log("Nothing was done on this loan");
                      break;
                  }
                  return resolve({
                    payload,
                    amountToBeReinvested,
                    amountToPayoutNow,
                    rolloverDone,
                    rolloverIsSuccessful,
                  });
                });
              };

              let rolloverImplementation = await effectRollover(
                investmentData,
                amount,
                rolloverType,
                rolloverDone,
                rolloverTarget
              );
              console.log(
                "testing Rollover Implementation line 2770",
                rolloverImplementation
              );
              await loan[0].save();
              if (
                // @ts-ignore
                rolloverImplementation?.rolloverIsSuccessful === false ||
                // @ts-ignore
                rolloverImplementation?.rolloverIsSuccessful === undefined
              ) {
                console.log(
                  "Loan data after payout for unsuccessful reinvestment, line 2779:",
                  loan
                );
                return response.status(400).json({
                  status: "FAILED",
                  data: loan.map((inv) => inv.$original),
                });
              }
              console.log("Loan data after payout line 2785:", loan);
              return response.status(200).json({
                status: "OK",
                data: loan.map((inv) => inv.$original),
              });
            }
          } else {
            // if the loan is terminated
            let payload = loan[0].$original;
            // send to Admin for approval
            // let walletId = payload.walletId
            let loanId = payload.id;
            let requestType = "terminate loan";
            let approvalForTerminationIsAutomated = false;
            if (approvalForTerminationIsAutomated === false) {
              let approvalRequestIsDone = await approvalRequest(
                walletId,
                loanId,
                requestType
              );
              console.log(
                " Approval request return line 2772 : ",
                approvalRequestIsDone
              );
              if (approvalRequestIsDone === undefined) {
                return response.status(400).json({
                  status: "FAILED",
                  message:
                    "termination approval request was not successful, please try again.",
                  data: [],
                });
              }
              console.log("Payout loan data line 2780:", payload);
              payload.timeline = JSON.stringify(loan[0].timeline);
              console.log("Terminated Payout loan data line 2782:", payload);

              const payout = await Payout.create(payload);
              payout.status = "terminated";
              await payout.save();
              console.log("Terminated Payout loan data line 2787:", payout);
              //  END
              loan = await Loan.query().where("id", loanId);
              loan[0].requestType = requestType;
              loan[0].status = "active";
              loan[0].approvalStatus = "pending";
              await loan[0].save();
            } else if (approvalForTerminationIsAutomated === true) {
              // if payout was approved
              // send to transaction service
              //  Proceed to payout the Total Amount due on maturity
              try {
                let rate = await sendPaymentDetails(
                  amount,
                  duration,
                  investmentType
                );
                console.log(" Rate return line 2800 : ", rate);
              } catch (error) {
                console.error(error);
                return response.send({
                  status: "FAILED",
                  message: "The transaction was not sent successfully.",
                  error: error.message,
                });
              }
              isTransactionSentForProcessing = true;
              if (isTransactionSentForProcessing === false) {
                return response.send({
                  status: "FAILED",
                  message: "The transaction was not sent successfully.",
                  isTransactionInProcess: isTransactionSentForProcessing,
                });
              }

              // if transaction was successfully processed
              // update Date payout was effected due to termination

              // TODO
              // Move the code below to a new function that will check payout approval status and update the transaction
              // START
              // payload.datePayoutWasDone = new Date().toISOString()
              console.log("Payout loan data line 2825:", payload);
              payload.timeline = JSON.stringify(loan[0].timeline);
              console.log("Terminated Payout loan data line 2827:", payload);

              let payout = await Payout.create(payload);
              payout.status = "terminated";
              await payout.save();
              console.log("Terminated Payout loan data line 2832:", payout);
              //  END
              loan = await Loan.query().where("id", loanId);
              loan[0].requestType = requestType;
              loan[0].status = "terminated";
              loan[0].approvalStatus = "approved";
              await loan[0].save();
              console.log("Terminated Payout loan data line 2839:", loan);
            }
            // update timeline
            timelineObject = {
              id: uuid(),
              action: "terminated loan payout",
              // @ts-ignore
              message: `${loan[0].walletHolderDetails.firstName} payment on loan has just been sent.`,
              createdAt: DateTime.now(),
              meta: `amount invested: ${loan[0].totalAmountToPayout}, request type : ${loan[0].requestType}`,
            };
            console.log("Timeline object line 2850:", timelineObject);
            //  Push the new object to the array
            timeline = loan[0].timeline;
            timeline.push(timelineObject);
            console.log("Timeline object line 2854:", timeline);
            // stringify the timeline array
            loan[0].timeline = JSON.stringify(timeline);
            // Save
            await loan[0].save();
            return response.status(200).json({
              status: "OK",
              data: loan.map((inv) => inv.$original),
            });
          }
        } else {
          return response.status(404).json({
            status: "FAILED",
            message:
              "no loan matched your search, or payment has been processed.",
            data: {
              paymentStatus: loan.map((inv) => inv.$original.status),
              amountPaid: loan.map((inv) => inv.$original.totalAmountToPayout),
            },
          });
        }
      } else {
        console.log("Loan data after search line 2911:", loan);
        return response.status(200).json({
          status: "FAILED",
          data: loan.map((inv) => inv.$original),
        });
      }
    } catch (error) {
      console.error(error);
    }
  }

  public async transactionStatus({ request, response }: HttpContextContract) {
    // const { loanId } = request.qs()
    console.log("Rate query: ", request.qs());
    // @ts-ignore
    let { walletId, loanId } = request.all();
    let loan = await Loan.query()
      .where({
        id: loanId,
        wallet_id: walletId,
      })
      .andWhereNot({ status: "paid" })
      .first();
    console.log(" QUERY RESULT: ", loan);
    if (loan) {
      // loan = await Loan.query().where({id: loanId,wallet_id: walletId,})
      let timeline;
      let timelineObject;
      // Check for Successful Transactions
      let transactionStatus;
      // get update from the endpoint with axios
      transactionStatus = "OK";
      if (transactionStatus !== "OK") {
        let walletId = loan.walletId;
        let loanId = loan.id;
        let totalAmountToPayout = loan.amountApproved;
        // @ts-ignore
        let phone = loan.loanAccountDetails.phone;
        console.log("Unsuccessful transaction, line 2903");
        return response.json({
          status: "FAILED",
          message: "The transaction was not successful.",
          data: {
            loanId: loanId,
            totalAmountToPayout: totalAmountToPayout,
            receiverDetails: {
              walletId: walletId,
              phone: phone,
            },
          },
        });
      }
      // Update Account status

      let {
        id,
        walletId,
        loanAccountDetails,
        duration,
        amountRequested,
        amountApproved,
        tagName,
        currencyCode,
        isDisbursementSuccessful,
        long,
        lat,
        interestRate,
        interestDueOnLoan,
        isLoanApproved,
        createdAt,
        startDate,
        dateDisbursementWasDone,
        requestType,
        approvalStatus,
        status,
        repaymentDate,
      } = loan;

      console.log("Initial status line 2949: ", status);
      console.log(
        "Initial dateDisbursementWasDone line 2950: ",
        dateDisbursementWasDone
      );
      let payload = {
        loanId: id,
        walletId,
        duration,
        amountRequested,
        amountApproved,
        tagName,
        currencyCode,
        loanAccountDetails,
        long,
        lat,
        interestRate,
        interestDueOnLoan,
        totalAmountPaid: amountApproved,
        createdAt,
        startDate,
        repaymentDate,
        isLoanApproved,
        isDisbursementSuccessful,
        dateDisbursementWasDone,
        requestType,
        approvalStatus,
        status,
        timeline,
      };
      // get the amount paid and the status of the transaction
      // let amountPaid = 50500
      isDisbursementSuccessful = true;

      // Save the Transaction to
      // payload[0].totalAmountToPayout = 0
      // payload.totalAmountPaid = amountPaid
      payload.approvalStatus = "approved";
      payload.status = "paid";
      payload.isDisbursementSuccessful = isDisbursementSuccessful;
      // @ts-ignore
      console.log("Payout Payload: ", payload);

      // @ts-ignore
      // let { walletId, loanId, walletId } = request.all()
      let payoutRecord;
      payoutRecord = await PayoutRecord.query().where({
        loan_id: payload.loanId,
        wallet_id: walletId,
      });
      console.log(" QUERY RESULT line 3003: ", payoutRecord);
      if (payoutRecord.length > 0) {
        return response.json({
          status: "OK",
          message: "Record already exist in the database.",
          data: payoutRecord.map((record) => record.$original),
        });
      }
      // loan[0].totalAmountToPayout = amountPaid
      loan.isDisbursementSuccessful = isDisbursementSuccessful;
      loan.approvalStatus = "approved";
      loan.status = "paid";
      // @ts-ignore
      // loan[0].datePayoutWasDone = new Date().toISOString()

      // Save the Update
      await loan.save();
      payload.timeline = JSON.stringify(loan.timeline);
      console.log("Matured Payout loan data line 3021:", payload);

      payoutRecord = await PayoutRecord.create(payload);
      // update loan status
      // payout.status = 'paid'
      await payoutRecord.save();

      console.log("Payout Record loan data line 3028:", payoutRecord);
      // @ts-ignore
      loan.datePayoutWasDone = payoutRecord.createdAt;

      // Update Payout
      let payout = await Payout.query()
        .where({
          loan_id: payload.loanId,
          wallet_id: walletId,
        })
        .first();
      console.log("Payout loan data line 3040:", payout);
      if (payout) {
        payout.totalAmountToPayout = payoutRecord.totalAmountPaid;
        payout.isPayoutAuthorized = payoutRecord.isPayoutAuthorized;
        payout.isTerminationAuthorized = payoutRecord.isTerminationAuthorized;
        payout.isDisbursementSuccessful = payoutRecord.isDisbursementSuccessful;
        payout.approvalStatus = payoutRecord.approvalStatus;
        payout.datePayoutWasDone = payoutRecord.createdAt;
        payout.status = payoutRecord.status;
        payout.timeline = payoutRecord.timeline;
        // Save the update
        await payout.save();
      }
      // Notify

      // Check RollOver Target

      // update timeline
      timelineObject = {
        id: uuid(),
        action: "loan payout has been done ",
        // @ts-ignore
        message: `${loan.walletHolderDetails.firstName} payment on loan has just been made.`,
        createdAt: DateTime.now(),
        meta: `amount paid: ${loan.totalAmountToPayout}, request type : ${loan.requestType}`,
      };
      console.log("Timeline object line 3065:", timelineObject);
      //  Push the new object to the array
      timeline = loan.timeline;
      timeline.push(timelineObject);
      // stringify the timeline array
      loan.timeline = JSON.stringify(timeline);
      console.log("Timeline object line 3069:", timeline);
      // Save
      await loan.save();

      console.log("data:", loan.$original);
      return response.json({ status: "OK", data: payoutRecord.$original });
    } else {
      return response.status(404).json({
        status: "FAILED",
        message: "Invalid parameters, or payment has been effected.",
      });
    }
  }

  public async destroy({ params, request, response }: HttpContextContract) {
    // const { loanId } = request.qs()
    console.log("Rate query: ", request.qs());
    let loan = await Loan.query().where({
      id: request.input("loanId"),
      wallet_id: params.walletId,
    });
    console.log(" QUERY RESULT: ", loan);
    if (loan.length > 0) {
      loan = await Loan.query()
        .where({
          id: request.input("loanId"),
          wallet_id: params.walletId,
        })
        .delete();
      console.log("Deleted data:", loan);
      return response.send("Loan Deleted.");
    } else {
      return response
        .status(404)
        .json({ status: "FAILED", message: "Invalid parameters" });
    }
  }
}
