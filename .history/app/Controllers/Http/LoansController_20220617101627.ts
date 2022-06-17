/* eslint-disable prettier/prettier */
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import Loan from "App/Models/Loan";
import Setting from "App/Models/Setting";
import { schema, rules } from "@ioc:Adonis/Core/Validator";
import Event from "@ioc:Adonis/Core/Event";
import { DateTime } from "luxon";
import { v4 as uuid } from "uuid";

import {
   interestDueOnLoan,
  dueForRepayment,
    approvalRequest,
  sendPaymentDetails,
  loanRate,
  createNewLoan,
  // @ts-ignore
} from "App/Helpers/utils";

import Approval from "App/Models/Approval";
import Wallet from "App/Models/Wallet";
import Timeline from "App/Models/Timeline";
import Loanrecord from "App/Models/Loanrecord";
export default class LoansController {
  public async index({ params, request, response }: HttpContextContract) {
    console.log("LOAN params: ", params);
    const { search, limit, requestType, walletId, loanId, status } =
      request.qs();
    console.log("LOAN query: ", request.qs());
    const loan = await Loan.query().preload("timelines"); 
    let sortedInvestments = loan.map((loan) => {
      return {
        ...loan.$original,
        // @ts-ignore
        timelines: loan.$preloaded.timelines.map((timeline)=> timeline.$original),
      };
    });
   
    console.log("LOAN before sorting: ", sortedInvestments);
    if (search) {
      sortedInvestments = sortedInvestments.filter((loan) => {
              // @ts-ignore
        return loan.lastName!.startsWith(search);
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
      // @ts-ignore
    Event.emit("list:investments", {
      id: loan[0].id,
      // @ts-ignore
      email: loan[0].email,
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
        .where({ id: loanId }).preload("timelines", query => {
          query.orderBy("createdAt", "desc");
        }).first();
      if (!loan) return response.status(404).json({ status: "FAILED" });
      let updatedResponseWithTimeline = {
          ...loan.$original,
          // @ts-ignore
          timelines: loan.$preloaded.timelines.map(
            (timeline) => timeline.$original
          ),
        }
      return response
        .status(200)
        .json({ status: "OK", data: updatedResponseWithTimeline });
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
        .preload("timelines", query => {
          query.orderBy("createdAt", "desc");
        });
      console.log("Loans result :", loans)
      if (loans.length > 0){
        let updatedLoanWithTimeline = loans.map((loan) => { return {
          ...loan.$original,
          // @ts-ignore
          timelines: loan.$preloaded.timelines.map(
            (timeline) => timeline.$original
          ),
        };})
        return response
        .status(200)
        .json({ status: "OK", data:updatedLoanWithTimeline}) ;
       } else { return response
         .status(404)
         .json({ status: "FAILED", message: "Invalid request" });};
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
      const payout = await Loanrecord.all();
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
    console.log("LOAN params line 302: ", params);
    const {
      walletId,
      loanId,
      requestType,
      approvalStatus,
      getLoanDetails,
    } = request.qs();
    console.log("LOAN query line 310: ", request.qs());
    let loan = await Loan.all();
    let approvals;
        let timelineObject;
    if (
      requestType === "request loan" &&
      walletId &&
      loanId &&
      !approvalStatus &&
      !getLoanDetails
    ) {
      console.log("LOAN ID", loanId);
      console.log("WALLET ID", walletId);
      // check the approval for request
      approvals = await Approval.query()
        .where("request_type", requestType)
        .where("wallet_id", walletId)
        .where("loan_id", loanId)
        .first();
      // check the approval status
      console.log("approvals line 330: ", approvals);
      if (!approvals) {
        return response.json({
          status: "FAILED",
          message:
            "No loan approval request data matched your query, please try again",
        });
      }
      console.log("approvals line 338: ", approvals.approvalStatus);
      //  if approved update loan status to active, update startDate,  and request loan
      if (approvals.approvalStatus === "approved") {
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
        console.log("LOAN DATA line 355: ", loan);
        if (loan.length < 1) {

          return response.json({
            status: "OK",
            message:
              "No loan activation approval data matched your query, please try again",
                      });
        }
        loan[0].approvalStatus = approvals.approvalStatus;
        loan[0].isLoanApproved = true;
        // TODO
        // send loan details to Bank Admin
        // on success
        // check if the user have an account with the bank

        // if no account with the bank
        // create savings and loan account with the bank

        // update status of loan
        // update request date
        loan[0].status = "processing disbursement";
        let currentDateMs = DateTime.now().toISO();
        // @ts-ignore
        loan[0].startDate = DateTime.now().toISO();
        let duration = parseInt(loan[0].duration);
        loan[0].repaymentDate = DateTime.now().plus({ days: duration });
        console.log("The currentDate line 387: ", currentDateMs);
        console.log("The loan was started line 388: ", loan[0].startDate);
        console.log(
          "The loan repayment date line 390: ",
          loan[0].repaymentDate
        );
        // update timeline
        timelineObject = {
          id: uuid(),
          loanId: loan[0].id,
          action: "loan activated",
          // @ts-ignore
          message: `${loan[0].firstName} loan has just been activated.`,
          createdAt: DateTime.now(),
          meta: `amount approved: ${loan[0].currencyCode} ${loan[0].amountRequested}, request type : ${loan[0].requestType}`,
        };
        console.log("Timeline object line 402:", timelineObject);
             //  create a new record for the timeline

        let newTimeline = await Timeline.create(timelineObject);

        console.log(" NEW TIMELINE line 419 :", newTimeline);

        // Save
        await loan[0].save();
        // Send notification
        console.log("Updated loan Status line 412: ", loan);
        await loan[0].save();
        return response.json({
          status: "OK",
          data: loan.map((inv) => inv.$original),
        });
      } else if (
        approvals.length > 0 &&
        approvals.approvalStatus === "declined"
      ) {
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
        console.log("The declined loan line 451: ", loan);
        if (!loan) {
             return response.json({
            status: "OK",
            message:
              "No loan activation decline data matched your query, please try again",
          });
        }
        // loan[0].status = 'declined'
        loan[0].approvalStatus = approvals.approvalStatus;
        // update timeline
        timelineObject = {
          id: uuid(),
          action: "loan declined",
          loanId: loan[0].id,
          // @ts-ignore
          message: `${loan[0].firstName} loan has just been declined.`,
          createdAt: DateTime.now(),
          meta: `amount declined: ${loan[0].currencyCode} ${loan[0].amountRequested}, request type : ${loan[0].requestType}`,
        };
        console.log("Timeline object line 482:", timelineObject);

        let newTimeline = await Timeline.create(timelineObject);

        console.log(" NEW TIMELINE line 1383 :", newTimeline);
        // Save
        await loan[0].save();
        // send notification
        console.log(
          "LOAN DATA line 493: ",
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
      !getLoanDetails
    ) {
      console.log("LOAN ID", loanId);
      console.log("WALLET ID", walletId);
      // check the approval for request
      approvals = await Approval.query()
        .where("request_type", requestType)
        .where("wallet_id", walletId)
        .where("loan_id", loanId).first();
      // check the approval status
      console.log("approvals line 270: ", approvals);
      if (!approvals) {
        return response.json({
          status: "FAILED",
          message:
            "No loan approval request data matched your query, please try again",
        });
      }
      console.log("approvals line 277: ", approvals.approvalStatus);
      //  if approved update loan status to terminated, update startDate,  and request loan
      if (approvals.approvalStatus === "approved") {
        loan = await Loan.query()
          .where("status", "active")
          .where("request_type", requestType)
          .where("wallet_id", walletId)
          .where("id", loanId);
        console.log("LOAN DATA line 285: ", loan);
        if (loan.length < 1) {
     
          loan = await Loan.query()
            // .where('status', 'active')
            .where("request_type", requestType)
            .where("wallet_id", walletId)
            .where("id", loanId);
          return response.json({
            status: "OK",
            message:
              "No loan termination approval data matched your query,or the feedback has been applied,or please try again",
          });
        }
        loan[0].approvalStatus = approvals.approvalStatus;
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
          loanId: loan[0].id,
          // @ts-ignore
          message: `${loan[0].firstName} loan has just been terminated.`,
          createdAt: DateTime.now(),
          meta: `amount approved: ${loan[0].currencyCode} ${loan[0].amountApproved}, request type : ${loan[0].requestType}`,
        };
        console.log("Timeline object line 529:", timelineObject);
       let newTimeline = await Timeline.create(timelineObject);
       console.log("new Timeline object line 601:", newTimeline);
        // Save
        await loan[0].save();

        // send notification
        console.log("Updated loan Status line 581: ", loan);
        return response.json({
          status: "OK",
          data: loan.map((inv) => inv.$original),
        });
      } else if (
        approvals.length > 0 &&
        approvals.approvalStatus === "declined"
      ) {
        loan = await Loan.query()
          .where("status", "active")
          .where("request_type", requestType)
          .where("wallet_id", walletId)
          .where("id", loanId);
        console.log("The declined loan line 595: ", loan);
        if (loan.length < 1) {
              loan = await Loan.query()
            // .where('status', 'active')
            .where("request_type", requestType)
            .where("wallet_id", walletId)
            .where("id", loanId);
          return response.json({
            status: "OK",
            message:
              "No loan termination decline data matched your query,or the feedback has been applied,or please try again",
          });
        }

        // loan[0].status = 'declined'
        loan[0].approvalStatus = approvals.approvalStatus;
        // update timeline
        timelineObject = {
          id: uuid(),
          action: "loan termination declined",
          loanId: loan[0].id,
          // @ts-ignore
          message: `${loan[0].walletHolderDetails.firstName} loan termination has just been declined.`,
          createdAt: DateTime.now(),
          meta: `amount requested: ${loan[0].amountRequested}, request type : ${loan[0].requestType}`,
        };
        console.log("Timeline object line 653:", timelineObject);
               let newTimeline = await Timeline.create(timelineObject);
               console.log("new Timeline object line 655:", newTimeline);
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
      requestType === "disburse loan" &&
      walletId &&
      loanId &&
      !approvalStatus &&
      !getLoanDetails
    ) {
      console.log("LOAN ID", loanId);
      console.log("WALLET ID", walletId);
      // check the approval for request
      approvals = await Approval.query()
        .where("request_type", requestType)
        .where("wallet_id", walletId)
        .where("loan_id", loanId).first();
      // check the approval status
      console.log("approvals line 353: ", approvals);
      if (!approvals) {
        return response.json({
          status: "FAILED",
          message:
            "No loan payout request data matched your query, please try again",
        });
      }
      console.log("approvals line 345: ", approvals.approvalStatus);
      //  if approved update loan status to active, update startDate,  and request loan
      if (approvals.approvalStatus === "approved") {
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
        loan[0].approvalStatus = approvals.approvalStatus;
        // TODO
        // send loan details to Transaction Service
        // on success

        // update status loan
        // update start date

        loan[0].status = "payout";
        // let currentDateMs = DateTime.now().toISO()
        // @ts-ignore
        // loan[0].startDate = DateTime.now().toISO()
        // let duration = parseInt(loan[0].duration)

        // loan[0].payoutDate = DateTime.now().toISO() //DateTime.now().plus({ days: duration })

        // console.log('The currentDate line 372: ', currentDateMs)
        // console.log('Time loan was started line 373: ', loan[0].startDate)
        console.log("Time loan payout date line 390: ", loan[0].repaymentDate);
        // update timeline
        timelineObject = {
          id: uuid(),
          action: "loan payout approved",
          loanId: loan[0].id,
          // @ts-ignore
          message: `${loan[0].firstName} loan has just been approved for payout.`,
          createdAt: DateTime.now(),
          meta: `amount requested: ${loan[0].amountRequested}, request type : ${loan[0].requestType}`,
        };
        console.log("Timeline object line 750:", timelineObject);
              let newTimeline = await Timeline.create(timelineObject);
              console.log("new Timeline object line 752:", newTimeline);
        // Save
        await loan[0].save();

        // send notification
        console.log("Updated loan Status line 687: ", loan);
        return response.json({
          status: "OK",
          data: loan.map((inv) => inv.$original),
        });
      } else if (
        approvals &&
        approvals.approvalStatus === "declined"
      ) {
        loan = await Loan.query()
          .where("status", "active")
          .where("request_type", requestType)
          .where("wallet_id", walletId)
          .where("id", loanId);
        console.log("The declined loan line 698: ", loan);
        if (loan.length < 1) {
          loan = await Loan.query()
            // .where('status', 'active')
            .where("request_type", requestType)
            .where("wallet_id", walletId)
            .where("id", loanId);
          return response.json({
            status: "OK",
            message:
              "No loan payout decline data matched your query, or the feedback has been applied, or please try again",
          });
        }

        // loan[0].status = 'declined'
        loan[0].approvalStatus = approvals.approvalStatus;
        // update timeline
        timelineObject = {
          id: uuid(),
          action: "loan payout declined",
          loanId:loan[0].id,
          // @ts-ignore
          message: `${loan[0].firstName} loan payout has just been declined.`,
          createdAt: DateTime.now(),
          meta: `amount requested: ${loan[0].amountRequested}, request type : ${loan[0].requestType}`,
        };
        console.log("Timeline object line 804:", timelineObject);
           let newTimeline = await Timeline.create(timelineObject);
           console.log("new Timeline object line 806:", newTimeline);
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
        getLoanDetails === "true"
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
      let loan = await Loan.query()
        .where({
          wallet_id: walletId,
          id: loanId,
        })
        .first();
      console.log(" Loan :", loan);
      if (!loan)
        return response.json({
          status: "FAILED",
          message: "loan does not exist, or invalid parameter.",
        });
      if (loan) {
        console.log("Loan Selected for Update line 1001:", loan.startDate);
        let isDueForRepayment;
        let requestType;
        if (loan.status !== "active") {
          let createdAt = loan.createdAt;
          let duration = loan.duration;
          // let timeline;
          let timelineObject;
          try {
            isDueForRepayment = await dueForRepayment(createdAt, duration);
            console.log("Is due for repayment status :", isDueForRepayment);

            if (loan && isOfferAccepted === true) {
              // check loan disbursement setting
              let setting = await Setting.query()
                .where({ tagName: "default setting" })
                .first();
              if (!setting)
                return response.json({
                  status: "FAILED",
                  message: "setting does not exist.",
                });
              console.log(
                "isDisbursementAutomated is set to:",
                setting.isDisbursementAutomated
              );
              loan.amountApproved;
              let { isDisbursementAutomated } = setting;
              if (isDisbursementAutomated === false) {
                // send to admin for disbursement approval
                requestType = "loan disbursement";
                let approval = await approvalRequest(
                  walletId,
                  loanId,
                  requestType
                );
                console.log(" Approval request return line 955 : ", approval);
                if (approval === undefined) {
                  return response.status(400).json({
                    status: "FAILED",
                    message:
                      "loan approval request was not successful, please try again.",
                    data: [],
                  });
                }

                // update loan row appropriately
                loan.requestType = requestType;
                loan.approvalStatus = "pending";
                loan.isOfferAccepted = isOfferAccepted;
                // update timeline
                timelineObject = {
                  id: uuid(),
                  action: "loan offer accepted",
                  loanId: loan.id,
                  // @ts-ignore
                  message: `${loan.firstName} just accepted the offer made.`,
                  createdAt: DateTime.now(),
                  meta: `amount approved: ${loan.currencyCode} ${loan.amountApproved}, request type : ${loan.requestType}`,
                };
                console.log("Timeline object line 997:", timelineObject);
                     let newTimeline = await Timeline.create(timelineObject);
                     console.log("new Timeline object line 999:", newTimeline);

                // Save
                await loan.save();
                console.log("Update Loan:", loan);
                // notify

                // send to user
                return response.json({
                  status: "OK",
                  data: loan.$original,
                });
              } else {
                // if disbursement is automated
                requestType = "loan disbursement";
                //  send money to savings account

                // debit loan account

                // update loan row appropriately
                loan.requestType = requestType;
                loan.approvalStatus = "approved";
                loan.isOfferAccepted = isOfferAccepted;
                  loan.startDate = DateTime.now(); //.toISODate()
                  loan.repaymentDate = DateTime.now().plus({
                    days: parseInt(loan.duration),
                  });
                // update timeline
                timelineObject = {
                  id: uuid(),
                  action: "loan disbursed",
                  loanId: loan.id,
                  // @ts-ignore
                  message: `${loan.firstName} loan has just been disbursed.`,
                  createdAt: DateTime.now(),
                  meta: `amount approved: ${loan.currencyCode} ${loan.amountApproved}, request type : ${loan.requestType}`,
                };
                console.log("Timeline object line 1036:", timelineObject);
                      let newTimeline = await Timeline.create(timelineObject);
                      console.log("new Timeline object line 1038:", newTimeline);
                loan.isOfferAccepted = isOfferAccepted;
                // Save
                await loan.save();
                console.log("Update Loan:", loan);
                // notify

                // send to user
                return response.json({
                  status: "OK",
                  data: loan.$original,
                });
              }
            } else if (loan && isOfferAccepted === false) {
              // update timeline
              timelineObject = {
                id: uuid(),
                action: "loan offer rejected",
                loanId: loan.id,
                // @ts-ignore
                message: `${loan.firstName} just rejected the offer made.`,
                createdAt: DateTime.now(),
                meta: `amount approved: ${loan.currencyCode} ${loan.amountApproved}, request type : ${loan.requestType}`,
              };
              console.log("Timeline object line 1062:", timelineObject);
                    let newTimeline = await Timeline.create(timelineObject);
                    console.log("new Timeline object line 1064:", newTimeline);
              // update loan to reflect offer rejection
              loan.isOfferAccepted = isOfferAccepted;
              // Save
              await loan.save();
              console.log("Update Loan:", loan);
              // send to user
              return response.json({
                status: "OK",
                data: loan.$original,
              });
            } else {
              return response.status(400).json({
                status: "FAILED",
                data: loan.$original,
                message: "please check your loan parameters",
              });
            }
          } catch (error) {
            console.log(error);
            console.error(error.messages);
            return response.json({
              status: "FAILED",
              message: error.messages.errors,
            });
          }
        } else {
          return response.json({
            status: "FAILED",
            data: loan.$original,
          });
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
      return response.json({
        status: "FAILED",
        message: error.messages.errors,
      });
    }
    // return // 401
  }

  public async update({ request, response }: HttpContextContract) {
    try {
      let { walletId, loanId } = request.qs();
      console.log(" walletId and loanId: ", walletId + " " + loanId);
      let { amountApproved } = request.all();
      console.log(" amountApproved line 898: ", amountApproved);
      let loan = await Loan.query()
        .where({
          wallet_id: walletId,
          id: loanId,
        })
        .first();
      if (!loan)
        return response.json({
          status: "FAILED",
          message: "loan does not exist, or missing parameter.",
        });
      if (loan) {
        console.log("Loan Selected for Update line 1001:", loan.startDate);
        let isDueForRepayment;
        if (loan.status !== "active") {
          let createdAt = loan.createdAt;
          let duration = loan.duration;
          // let timeline;
          let timelineObject;
          try {
            isDueForRepayment = await dueForRepayment(createdAt, duration);
            console.log("Is due for repayment status :", isDueForRepayment);

            if (loan && isDueForRepayment === false) {
              loan.amountApproved = amountApproved;
              // loan.amount = request.input('amount')
              // loan.investmentType = request.input('investmentType')
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
                  loanId: loan.id,
                  // @ts-ignore
                  message: `${loan.firstName} loan has just been updated.`,
                  createdAt: DateTime.now(),
                  meta: `amount approved: ${loan.currencyCode} ${loan.amountApproved}, request type : ${loan.requestType}`,
                };
                console.log("Timeline object line 1171:", timelineObject);
                     let newTimeline = await Timeline.create(timelineObject);
                     console.log("new Timeline object line 1173:", newTimeline);
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
                data: loan.$original,
                message: "please check your loan parameters",
              });
            }
          } catch (error) {
            console.log(error);
            console.error(error.messages);
            return response.json({
              status: "FAILED",
              message: error.messages.errors,
            });
          }
        } else {
          return response.json({
            status: "FAILED",
            data: loan.$original,
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
    // console.log(
    //   " The Rate return for RATE line 1073: ",
    //   await generateRate(amount, duration)
    // );
    // let rate = await generateRate(amount, duration);
    // console.log(" Rate return line 1077 : ", rate);

    console.log(
      " The Rate return for RATE line 1073: ",
      await loanRate(amount, duration)
    );
    let rate = await loanRate(amount, duration);
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
    const loanSchema = schema.create({
      walletId: schema.string(),
      userId: schema.string.optional(),
      firstName: schema.string(),
      lastName: schema.string.optional(),
      phone: schema.string(),
      email: schema.string(),
      loanAccountId: schema.string.optional(),
      amountRequested: schema.number(),
      duration: schema.enum([
        "7",
        "14",
        "21",
        "30",
        "45",
        "60",
        "90",
        "120",
        "150",
        "180",
        "210",
        "240",
        "270",
        "300",
        "330",
        "360"
      ]),
      tagName: schema.string({ escape: true }, [rules.maxLength(150)]),
      currencyCode: schema.string({ escape: true }, [rules.maxLength(5)]),
      bvn: schema.string({ escape: true }, [
        rules.minLength(11),
        rules.maxLength(11),
      ]),
      loanAccountDetails: schema.object.optional().members({
        firstName: schema.string(),
        lastName: schema.string(),
        email: schema.string([rules.email()]),
        phone: schema.number(),
        loanAccountWalletId: schema.string(),
      }),
      long: schema.number(),
      lat: schema.number(),
    });
    const payload: any = await request.validate({ schema: loanSchema });
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
    let requestType;
     let timelineObject;
    let settings = await Setting.query().where({ tagName: "default setting" });
    console.log("Approval setting line 910:", settings[0]);
        //  Check if loan activation is automated
    let approvalIsAutomated = settings[0].isLoanAutomated;
    // let approvalIsAutomated = false
    console.log("Approval setting line 1369:", approvalIsAutomated);
    if (approvalIsAutomated === false || approvalIsAutomated.toString() === "0") {
      console.log(
        " The Rate return for RATE line 1227: ",
        await loanRate(payloadAmount, payloadDuration)
      );
      let rate = await loanRate(payloadAmount, payloadDuration);
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
      requestType = "request loan";
      //  create a new object for the timeline
      timelineObject = {
        id: uuid(),
        action: "loan initiated",
        loanId: loan.id,
        // @ts-ignore
        message: `${loan.firstName} just initiated a loan of ${loan.currencyCode} ${loan.amountRequested}.`,
        createdAt: loan.createdAt,
        meta: `duration: ${loan.duration}`,
      };
      console.log("Timeline object line 1186:", timelineObject);
            let newTimeline = await Timeline.create(timelineObject);

      console.log(" NEW TIMELINE line 1383 :", newTimeline);

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
      let newLoanEmail = loan.email;
      Event.emit("new:loan", {
        id: newLoanId,
        email: newLoanEmail,
      });
      return response.status(201).json({ status: "OK", data: loan.$original });
    } else if (
      approvalIsAutomated === true ||
      // @ts-ignore
      approvalIsAutomated.toString() === "1"
    ) {
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
      console.log(
        " The Rate return for RATE line 1227: ",
        await loanRate(payloadAmount, payloadDuration)
      );
      let rate = await loanRate(payloadAmount, payloadDuration);
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
      loan.isLoanApproved = true;
      await loan.save();
      console.log("The new loan:", loan);

      // Send Loan Payload To Transaction Service
      let sendToUserForAcceptance = "OK"; //= new SendToTransactionService(loan)
      console.log(" Feedback from admin: ", sendToUserForAcceptance);
      if (sendToUserForAcceptance === "OK") {
        // Activate the loan
        loan.amountApproved = amountRecommended;
        loan.requestType = requestType;
        loan.status = "pending";
        loan.approvalStatus = "approved";
        // loan.startDate = DateTime.now(); //.toISODate()
        // loan.repaymentDate = DateTime.now().plus({
        //   days: parseInt(loanDuration),
        // });
        timelineObject = {
          id: uuid(),
          action: "loan offer made",
          loanId: loan.id,
          // @ts-ignore
          message: `${loan.firstName} loan of ${loan.currencyCode} ${loan.amountApproved} has just been approved and offer made.`,
          createdAt: loan.createdAt,
          meta: `duration: ${loan.duration}`,
        };
        console.log("Timeline object line 1487:", timelineObject);
              let newTimeline = await Timeline.create(timelineObject);
              console.log("new Timeline object line 1489:", newTimeline);
        await loan.save();
        let newLoanId = loan.id;
        // Send to Notificaation Service

        // @ts-ignore
        let newLoanEmail = loan.email;
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
            "Loan was not successfully sent to user for offer acceptance, please try again.",
          data: loan.$original,
        });
      }
    }
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

      let loan = await Loan.query()
        .where({
          wallet_id: walletId,
          id: loanId,
        })
        .first();
      console.log("Loan Selected for Update line 1375:", loan);
      if (!loan)
        return response.json({
          status: "FAILED",
          message: "loan does not exist, or missing parameter.",
        });
      if (loan) {
        console.log("Loan Selected for Update line 1377:", loan.startDate);
        let payload = loan;
        // call Okra

        // Call Credit registry

        // give recommendation based on the report of Okra and CreditRegistry, internal algorithm

        // check available rate to apply
        let payloadAmount = payload.amountRequested;
        let payloadDuration = payload.duration;
        let amountRecommended;
        amountRecommended = 400000;
              console.log(
          " The Rate return for RATE line 1403: ",
          await loanRate(payloadAmount, payloadDuration)
        );
        let rate = await loanRate(payloadAmount, payloadDuration);
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
        if (loan.status !== "active") {
          let createdAt = loan.createdAt;
          let duration = loan.duration;
          // let timeline;
          let timelineObject;
          try {
            isDueForRepayment = await dueForRepayment(createdAt, duration);
            console.log("Is due for repayment status :", isDueForRepayment);
            if (loan && isDueForRepayment === false) {
              loan.amountApproved = amountRecommended; // amountApproved;
              amountApproved = loan.amountApproved;
              console.log(" amountApproved line 1591: ", amountApproved);
              // Recalculate the interestRate and totalAmountToRepay
              loan.interestRate = rate;
              // When the loan has been approved and activated
              let amount = loan.amountApproved;
              let loanDuration = loan.duration;
              let amountDueOnRepayment = Number(
                await interestDueOnLoan(amount, rate, loanDuration)
              );
              loan.interestDueOnLoan = amountDueOnRepayment;
              loan.totalAmountToRepay =
                loan.amountApproved + amountDueOnRepayment;
              await loan.save();
              console.log("The new loan:", loan);
              if (loan) {
                // update timeline
                timelineObject = {
                  id: uuid(),
                  action: "loan updated",
                  loanId:loan.id,
                  // @ts-ignore
                  message: `${loan.firstName} loan has just been updated.`,
                  createdAt: DateTime.now(),
                  meta: `amount approved: ${loan.currencyCode} ${loan.amountApproved}, request type : ${loan.requestType}`,
                };
                console.log("Timeline object line 1616:", timelineObject);
                    let newTimeline = await Timeline.create(timelineObject);
                    console.log("new Timeline object line 1618:", newTimeline);
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
                data: loan.$original,
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
            data: loan.$original,
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
      const { loanId, walletId } = request.qs();
      console.log("Loan query: ", request.qs());
      let loan = await Loan.query()
        .where({
          wallet_id: walletId,
          id: loanId,
        })
        .first();
      console.log(" Loan QUERY RESULT: ", loan);
      if (loan) {
        console.log("Loan Selected for Update:", loan);
        let isDueForRepayment = await dueForRepayment(
          loan.startDate,
          loan.duration
        );
        console.log("Is due for payout status :", isDueForRepayment);
        if (loan) {
          // loan.status = request.input("status")
          //   ? request.input("status")
          //   : loan.status;
          // let loanApprovedStatus = request.input("isLoanApproved");
          // loan.isLoanApproved =
          //   request.input("isLoanApproved") !== undefined
          loan.merge(request.only[])
          //     ? request.input("isLoanApproved")
          //     : loan.isLoanApproved;
          // console.log("loanApprovedStatus :", loanApprovedStatus);
          loan.merge(request.only(["isLoanApproved","status"]))
          
          if (loan) {
            // send to user
            await loan.save();
            console.log("Update Loan:", loan);
            return response.status(200).json({
              status: "OK",
              data: loan.$original,
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
    
      let loan = await Loan.query().where("id", loanId);
      console.log("Loan Info, line 1322: ", loan);
      if (loan.length > 0) {
        console.log("loan search data :", loan[0].$original);
        
      //  TODO
        // TESTING
        let startDate = DateTime.now().minus({ days: 5 }).toISO();
        let duration = 4;
        console.log("Time loan was started line 1332: ", startDate);
        let timelineObject;
        // let timeline;
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
            console.log("Loanrecord loan data line 1380:", payload);
            payload.loanId = loanId;
            payload.requestType = requestType;
            // check if payout request is existing
            let payoutRequestIsExisting = await Loanrecord.query().where({
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
            
              console.log("Matured Loanrecord loan data line 1413:", payload);
              payout = await Loanrecord.create(payload);
              payout.approvalStatus = "pending";
              payout.status = "payout";
              await payout.save();
              console.log("Matured Loanrecord loan data line 1418:", payout);

              // update timeline
              timelineObject = {
                id: uuid(),
                action: "loan payout initiated",
                loanId:loan[0].id,
                // @ts-ignore
                message: `${loan[0].firstName} loan has just been sent for payout processing.`,
                createdAt: DateTime.now(),
                meta: `amount to payout: ${loan[0].currencyCode} ${loan[0].totalAmountToRepay}, request type : ${loan[0].requestType}`,
              };
              console.log("Timeline object line 1925:", timelineObject);
                    let newTimeline = await Timeline.create(timelineObject);
                    console.log("new Timeline object line 1927:", newTimeline);  // Save
              await loan[0].save();
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
              // let payout = await Loanrecord.create(payload)
              payoutRequestIsExisting[0].approvalStatus = "pending";
              payoutRequestIsExisting[0].status = "payout";
              await payoutRequestIsExisting[0].save();
              // update timeline
              timelineObject = {
                id: uuid(),
                action: "loan payout initiated",
                loanId: loan[0].id,
                // @ts-ignore
                message: `${loan[0].firstName} loan has just been sent for payout processing.`,
                createdAt: DateTime.now(),
                meta: `amount to payout: ${loan[0].currencyCode} ${loan[0].totalAmountToRepay}, request type : ${loan[0].requestType}`,
              };
              console.log("Timeline object line 1953:", timelineObject);
                     let newTimeline = await Timeline.create(timelineObject);
                     console.log("new Timeline object line 1955:", newTimeline);
              await loan[0].save();
              // Save
              await payoutRequestIsExisting[0].save();

              console.log(
                "Matured Loanrecord loan data line 1476:",
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
            console.log("Loanrecord loan data 1:", payload);
            payload.loanId = loanId;
            payload.requestType = requestType;
            // check if payout request is existing
            let payoutRequestIsExisting = await Loanrecord.query().where({
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
              // payload.timeline = JSON.stringify(loan[0].timeline);
              console.log("Matured Loanrecord loan data line 1548:", payload);
              payout = await Loanrecord.create(payload);
              payout.status = "payout";
              await payout.save();
              console.log("Matured Loanrecord loan data line 1551:", payout);

              // update timeline
              timelineObject = {
                id: uuid(),
                action: "loan payout approved",
                loanId: loan[0].id,
                // @ts-ignore
                message: `${loan[0].firstName} loan has just been approved for payout.`,
                createdAt: payout.createdAt,
                meta: `amount to payout: ${loan[0].currencyCode} ${loan[0].totalAmountToRepay}, request type : ${loan[0].requestType}`,
              };
              console.log("Timeline object line 2041:", timelineObject);
                     let newTimeline = await Timeline.create(timelineObject);
                     console.log("new Timeline object line 2043:", newTimeline);
              // Save
              await loan[0].save();
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
              // let payout = await Loanrecord.create(payload)
              payoutRequestIsExisting[0].status = "payout";
              await payoutRequestIsExisting[0].save();
              // update timeline
              timelineObject = {
                id: uuid(),
                action: "loan payout approved",
                loanId: loan[0].id,
                // @ts-ignore
                message: `${loan[0].firstName} loan has just been approved for payout.`,
                createdAt: DateTime.now(),
                meta: `amount to repay: ${loan[0].currencyCode} ${loan[0].totalAmountToRepay}, request type : ${loan[0].requestType}`,
              };
              console.log("Timeline object line 2071:", timelineObject);
                    let newTimeline = await Timeline.create(timelineObject);
                    console.log("new Timeline object line 2073:", newTimeline);
              await loan[0].save();
              // Save
              await payoutRequestIsExisting[0].save();

              console.log(
                "Matured Loanrecord loan data line 1608:",
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
          let approvalIsAutomated = settings[0].isTerminationAutomated;
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
            let payoutRequestIsExisting = await Loanrecord.query().where({
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
              console.log("Loanrecord loan data 1:", payload);
             
              console.log("Loanrecord loan data line 1576:", payload);
              payout = await Loanrecord.create(payload);
              payout.status = "terminated";
              await payout.save();
              console.log("Terminated Loanrecord loan data line 1276:", payout);
            } else if (
              payoutRequestIsExisting.length > 0 &&
              loan[0].approvalStatus === "approved" &&
              loan[0].status === "active"
            ) {
              console.log("Loanrecord loan data 1:", payload);
              payout.status = "terminated";
              await payout.save();
              console.log("Terminated Loanrecord loan data line 1285:", payout);
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
            let payoutRequestIsExisting = await Loanrecord.query().where({
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
              console.log("Loanrecord loan data 1:", payload);
               payout = await Loanrecord.create(payload);
              payout.status = "terminated";
              await payout.save();
              console.log("Terminated Loanrecord loan data line 1316:", payout);
            } else if (
              payoutRequestIsExisting.length > 0 &&
              loan[0].approvalStatus === "approved" &&
              loan[0].status === "active"
            ) {
              console.log("Loanrecord loan data 1:", payload);
              payout.status = "terminated";
              await payout.save();
              console.log("Terminated Loanrecord loan data line 1325:", payout);
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
            loanId: loan[0].id,
            // @ts-ignore
            message: `${loan[0].firstName} loan has just been sent for termination processing.`,
            createdAt: DateTime.now(),
            meta: `amount to rrepay: ${loan[0].totalAmountToRepay}, request type : ${loan[0].requestType}`,
          };
          console.log("Timeline object line 2244:", timelineObject);
                let newTimeline = await Timeline.create(timelineObject);
                console.log("new Timeline object line 2246:", newTimeline);
                 await loan[0].save();

          console.log("Terminated Loanrecord loan data line 1521:", loan);
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
        let loanData = loan[0];
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
        // let timeline;
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
            if (rolloverType === "100") {
              // Save the payment data in payout table
              payload = loanData;
              console.log("Loanrecord loan data line 1619:", payload);
              // payout = await Loanrecord.create(payload)
              // payout.status = 'matured'
              // await payout.save()
              // console.log('Matured Loanrecord loan data line 1235:', payout)

              // check if payout request is existing
              let payoutRequestIsExisting = await Loanrecord.query().where({
                loan_id: loanId,
                wallet_id: walletId,
              });
              console.log(
                "Loan payout Request Is Existing data line 1631:",
                payoutRequestIsExisting
              );
              if (
                payoutRequestIsExisting.length < 1 &&
                // loan[0].requestType !== 'request loan' &&
                loan[0].approvalStatus !== "pending" &&
                loan[0].status !== "initiated"
              ) {
                console.log("Loanrecord loan data line 1781:", payload);
                payload.timeline = JSON.stringify(loan[0].timeline);
                console.log("Loanrecord loan data line 1783:", payload);

                payout = await Loanrecord.create(payload);
                payout.status = "payout";
                await payout.save();
                console.log("Matured Loanrecord loan data line 1788:", payout);
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
                  loanId:loan[0].id,
                  // @ts-ignore
                  message: `${loan[0].walletHolderDetails.firstName} loan has just been sent for payment processing.`,
                  createdAt: DateTime.now(),
                  meta: `amount to payout: ${loan[0].totalAmountToPayout}, request type : ${loan[0].requestType}`,
                };
                console.log("Timeline object line 2443:", timelineObject);
                      let newTimeline = await Timeline.create(timelineObject);
                      console.log("new Timeline object line 2445:", newTimeline);
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
                  loanId: loan[0].id,
                  // @ts-ignore
                  message: `${loan[0].firstName} loan has just been sent for termination processing.`,
                  createdAt: DateTime.now(),
                  meta: `amount to payout: ${loan[0].totalAmountToPayout}, request type : ${loan[0].requestType}`,
                };
                console.log("Timeline object line 2489:", timelineObject);
                      let newTimeline = await Timeline.create(timelineObject);
                      console.log("new Timeline object line 2491:", newTimeline); // Save
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
                loanData,
                amount,
                rolloverType,
                rolloverDone,
                rolloverTarget
              ) => {
                return new Promise(async (resolve, reject) => {
                  console.log(
                    "Datas line 1562 : ",
                    loanData,
                    amount,
                    rolloverType,
                    rolloverDone,
                    rolloverTarget
                  );
                  if (!loanData || rolloverTarget < 0) {
                    reject(
                      new Error(
                        "Incomplete parameters , or no rollover target was set, or is less than allowed range"
                      )
                    );
                  }
                  let amountToPayoutNow;
                  let amountToBeReinvested;
                  let timelineObject;
                  // let timeline;
                  let rolloverIsSuccessful;
                  let settings = await Setting.query().where({
                    tagName: "default setting",
                  });
                  console.log("Approval setting line 2081:", settings[0]);
                  if (rolloverDone >= rolloverTarget) {
                    let payload = loanData;
                    let payout;
                    let loanId = payload.id;
                    walletId = payload.walletId;
                    let requestType = "payout loan";
                    amountToPayoutNow =
                      amount + loanData.interestDueOnLoan;
                    // Send Loan Initiation Message to Queue
                    payload = loanData;
                    console.log("Loanrecord loan data line 2091:", payload);
                    // check if payout request is existing
                    let payoutRequestIsExisting = await Loanrecord.query().where({
                      loan_id: loanId,
                      wallet_id: walletId,
                    });
                    console.log(
                      "Loan payout Request Is Existing data line 2098:",
                      payoutRequestIsExisting
                    );
                    if (
                      payoutRequestIsExisting.length < 1 &&
                      // loan[0].requestType !== 'request loan' &&
                      payload.approvalStatus !== "pending" &&
                      payload.status !== "initiated"
                    ) {
                      console.log("Loanrecord loan data line 2107:", payload);
                      payload.timeline = JSON.stringify(loan[0].timeline);
                      console.log("Loanrecord loan data line 2109:", payload);

                      payout = await Loanrecord.create(payload);
                      payout.status = "payout";
                      payout.isPayoutAuthorized = loan[0].isPayoutAuthorized;
                      payout.isTerminationAuthorized =
                        loan[0].isTerminationAuthorized;

                      await payout.save();
                      console.log(
                        "Matured Loanrecord loan data line 2117:",
                        payout
                      );
                    } else {
                      payoutRequestIsExisting[0].requestType =
                        loan[0].requestType;
                      // payoutRequestIsExisting[0].isPayoutAuthorized =
                        // loan[0].isPayoutAuthorized;
                      // payoutRequestIsExisting[0].isTerminationAuthorized =
                        // loan[0].isTerminationAuthorized;
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
                        loanId:loan[0].id,
                        // @ts-ignore
                        message: `${loan[0].walletHolderDetails.firstName} loan has just been sent for payment processing approval.`,
                        createdAt: DateTime.now(),
                        meta: `amount to payout: ${loan[0].totalAmountToPayout}, request type : ${loan[0].requestType}`,
                      };
                      console.log("Timeline object line 2654:", timelineObject);
                            let newTimeline = await Timeline.create(
                              timelineObject
                            );
                            console.log(
                              "new Timeline object line 2659:",
                              newTimeline
                            ); // Save
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
                        loanId: loan[0].id,
                        // @ts-ignore
                        message: `${loan[0].firstName} loan has just been sent for payment processing.`,
                        createdAt: DateTime.now(),
                        meta: `amount to payout: ${loan[0].totalAmountToPayout}, request type : ${loan[0].requestType}`,
                      };
                      console.log("Timeline object line 2709:", timelineObject);
                            let newTimeline = await Timeline.create(
                              timelineObject
                            );
                            console.log(
                              "new Timeline object line 2714:",
                              newTimeline
                            ); // Save
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
                  loanData = loan[0];
                  let payload = loanData;
                  console.log("Payload line 1969 :", payload);
                  let payloadDuration = loanData.duration;
                  let payloadInvestmentType = loanData.investmentType;
                  let payout;
                  // let newTimeline: any[] = [];
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
                      loanData = loan[0];
                      // Save the payment data in payout table
                      payload = loanData;
                      console.log("Loanrecord loan data line 2475:", payload);
                      payload.timeline = JSON.stringify(loan[0].timeline);
                      console.log(
                        "Matured Loanrecord loan data line 2477:",
                        payload
                      );

                      payout = await Loanrecord.create(payload);
                      payout.status = "payout";
                      await payout.save();
                      console.log(
                        "Matured Loanrecord loan data line 2482:",
                        payout
                      );

                      // send payment details to transction service

                      // Send Notification

                      console.log(
                        " The Rate return for RATE line 2491: ",
                        await loanRate(
                          amountToBeReinvested,
                          payloadDuration,
                          // payloadInvestmentType
                        )
                      );
                      rate = await loanRate(
                        amountToBeReinvested,
                        payloadDuration,
                        // payloadInvestmentType
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
                          loanId: loan[0].id,
                          // @ts-ignore
                          message: `${loan[0].firstName} payment on loan has just been sent.`,
                          createdAt: DateTime.now(),
                          meta: `amount invested: ${
                            loan[0].amount
                          },amount paid: ${
                            loan[0].interestDueOnLoan + loan[0].amount
                          }, request type : ${loan[0].requestType}`,
                        };
                        console.log(
                          "Timeline object line 2806:",
                          timelineObject
                        );
                             let newTimeline = await Timeline.create(
                               timelineObject
                             );
                             console.log(
                               "new Timeline object line 2813:",
                               newTimeline
                             );  await loan[0].save();
                        rolloverIsSuccessful = false;
                        break;

                        // return response.status(400).json({
                        //   status: 'FAILED',
                        //   message: 'no loan rate matched your search, please try again.',
                        //   data: [],
                        // })
                      }
                      // initiate a new loan
                      var isNewInvestmentCreated = await createNewLoan(
                        amountToBeReinvested,
                        payloadDuration,
                        payloadInvestmentType,
                        loanData
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
                        //      loanData,
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
                        loanId: loan[0].id,
                        // @ts-ignore
                        message: `${loan[0].firstName} payment on loan has just been sent.`,
                        createdAt: DateTime.now(),
                        meta: `amount reinvested: ${loan[0].amount},amount paid: ${loan[0].totalAmountToPayout}, request type : ${loan[0].requestType}`,
                      };
                      console.log("Timeline object line 2867:", timelineObject);
                          let newTimeline = await Timeline.create(
                            timelineObject
                          );
                          console.log(
                            "new Timeline object line 2872:",
                            newTimeline
                          );   // Save
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
                      loanData = loan[0];
                      // Save the payment data in payout table
                      payload = loanData;
                      console.log("Loanrecord loan data line 2578:", payload);
                      payload.timeline = JSON.stringify(loan[0].timeline);
                      console.log(
                        "Matured Loanrecord loan data line 2580:",
                        payload
                      );
                      payout = await Loanrecord.create(payload);
                      payout.status = "payout";
                      await payout.save();
                      console.log(
                        "Matured Loanrecord loan data line 2584:",
                        payout
                      );

                      // send payment details to transction service

                      // Send Notification

                      console.log(
                        " The Rate return for RATE line 2591: ",
                        await loanRate(
                          amountToBeReinvested,
                          payloadDuration,
                        )
                      );
                      rate = await loanRate(
                        amountToBeReinvested,
                        payloadDuration,
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
                          loanId: loan[0].id,
                          // @ts-ignore
                          message: `${loan[0].firstName} payment on loan has just been sent.`,
                          createdAt: DateTime.now(),
                          meta: `amount paid back to wallet: ${amountToBeReinvested},interest: ${loan[0].totalAmountToPayout}, request type : ${loan[0].requestType}`,
                        };
                        console.log(
                          "Timeline object line 2941:",
                          timelineObject
                        );
                            let newTimeline = await Timeline.create(
                              timelineObject
                            );
                            console.log(
                              "new Timeline object line 2948:",
                              newTimeline
                            );   // Save
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
                      isNewInvestmentCreated = await createNewLoan(
                        amountToBeReinvested,
                        payloadDuration,
                        payloadInvestmentType,
                        loanData
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
                        //     loanData,
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
                        loanId: loan[0].id,
                        // @ts-ignore
                        message: `${loan[0].firstName} payment for matured loan has just been sent.`,
                        createdAt: DateTime.now(),
                        meta: `amount paid: ${loan[0].totalAmountToPayout},amount reinvested: ${amountToBeReinvested}, request type : ${loan[0].requestType}`,
                      };
                      console.log("Timeline object line 3006:", timelineObject);
                      //  Push the new object to the array

                           newTimeline = await Timeline.create(
                             timelineObject
                           );
                           console.log(
                             "new Timeline object line 3013:",
                             newTimeline
                           );  // Save
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
                    //   loanData = loan[0]
                    //   // Save the payment data in payout table
                    //   payload = loanData
                    //   console.log('Loanrecord loan data line 1941:', payload)
                    //   payout = await Loanrecord.create(payload)
                    //   payout.status = 'payout'
                    //   await payout.save()
                    //   console.log('Matured Loanrecord loan data line 1945:', payout)
                    //   // send payment details to transction service

                    //   // Send Notification

                    //   // initiate a new loan
                    //   investmentCreated = await createInvestment(
                    //     amountToBeReinvested,
                    //     payloadDuration,
                    //     payloadInvestmentType,
                    //     loanData
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
                    //     loanData,
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
                loanData,
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
              console.log("Loanrecord loan data line 2780:", payload);
              payload.timeline = JSON.stringify(loan[0].timeline);
              console.log("Terminated Loanrecord loan data line 2782:", payload);

              const payout = await Loanrecord.create(payload);
              payout.status = "terminated";
              await payout.save();
              console.log("Terminated Loanrecord loan data line 2787:", payout);
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
              console.log("Loanrecord loan data line 2825:", payload);
              payload.timeline = JSON.stringify(loan[0].timeline);
              console.log("Terminated Loanrecord loan data line 2827:", payload);

              let payout = await Loanrecord.create(payload);
              payout.status = "terminated";
              await payout.save();
              console.log("Terminated Loanrecord loan data line 2832:", payout);
              //  END
              loan = await Loan.query().where("id", loanId);
              loan[0].requestType = requestType;
              loan[0].status = "terminated";
              loan[0].approvalStatus = "approved";
              await loan[0].save();
              console.log("Terminated Loanrecord loan data line 2839:", loan);
            }
            // update timeline
            timelineObject = {
              id: uuid(),
              action: "terminated loan payout",
              loanId: loan[0].id,
              // @ts-ignore
              message: `${loan[0].firstName} payment on loan has just been sent.`,
              createdAt: DateTime.now(),
              meta: `amount invested: ${loan[0].totalAmountToPayout}, request type : ${loan[0].requestType}`,
            };
            console.log("Timeline object line 3219:", timelineObject);
                  let newTimeline = await Timeline.create(timelineObject);
                  console.log("new Timeline object line 3221:", newTimeline); // Save
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
        let phone = loan.phone;
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
      console.log("Loanrecord Payload: ", payload);

      // @ts-ignore
      // let { walletId, loanId, walletId } = request.all()
      let payoutRecord;
      payoutRecord = await Loanrecord.query().where({
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
      // payload.timeline = JSON.stringify(loan.timeline);
      console.log("Matured Loanrecord loan data line 3021:", payload);

      payoutRecord = await Loanrecord.create(payload);
      // update loan status
      // payout.status = 'paid'
      await payoutRecord.save();

      console.log("Loanrecord Record loan data line 3028:", payoutRecord);
      // @ts-ignore
      loan.datePayoutWasDone = payoutRecord.createdAt;

      // Update Loanrecord
      let payout = await Loanrecord.query()
        .where({
          loan_id: payload.loanId,
          wallet_id: walletId,
        })
        .first();
      console.log("Loanrecord loan data line 3040:", payout);
      if (payout) {
        // payout.totalAmountToPayout = payoutRecord.totalAmountPaid;
        // payout.isPayoutAuthorized = payoutRecord.isPayoutAuthorized;
        // payout.isTerminationAuthorized = payoutRecord.isTerminationAuthorized;
        payout.isDisbursementSuccessful = payoutRecord.isDisbursementSuccessful;
        payout.approvalStatus = payoutRecord.approvalStatus;
        // payout.datePayoutWasDone = payoutRecord.createdAt;
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
        loanId: loan.id,
        // @ts-ignore
        message: `${loan.firstName} payment on loan has just been made.`,
        createdAt: DateTime.now(),
        meta: `amount paid: ${loan.totalAmountToRepay}, request type : ${loan.requestType}`,
      };
      console.log("Timeline object line 3430:", timelineObject);
           let newTimeline = await Timeline.create(timelineObject);
           console.log("new Timeline object line 3432:", newTimeline);  // Save
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
