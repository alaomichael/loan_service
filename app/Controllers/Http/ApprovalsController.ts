import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import Approval from "App/Models/Approval";
import Loan from "App/Models/Loan";
import { schema, rules } from "@ioc:Adonis/Core/Validator";
import Event from "@ioc:Adonis/Core/Event";
import {
  loanDuration,
  // @ts-ignore
} from "App/Helpers/utils";

export default class ApprovalsController {
  public async index({ params, request, response }: HttpContextContract) {
    console.log("Approvals params: ", params);
    const { walletId, limit, loanId, requestType, approvalStatus, remark } =
      request.qs();
    console.log("Approvals query: ", request.qs());
    const countApprovals = await Approval.query()
      .where("approval_status", "pending")
      .getCount();
    console.log("Approval count: ", countApprovals);

    const approval = await Approval.all();
    let sortedApprovals = approval;
    if (walletId) {
      // @ts-ignore
      sortedApprovals = await Approval.query().where("wallet_id", walletId);
    }
    // if (loanId) {
    //   // @ts-ignore
    //   sortedApprovals = await Approval.query().where('loan_id', loanId)
    // }
    if (loanId) {
      sortedApprovals = sortedApprovals.filter((approval) => {
        // @ts-ignore
        return approval.loanId === loanId;
      });
    }

    if (requestType) {
      sortedApprovals = sortedApprovals.filter((approval) => {
        // @ts-ignore
        return approval.requestType!.startsWith(requestType);
        // return approval.requestType!.includes(requestType)
      });
    }

    if (remark && sortedApprovals.length > 0) {
      sortedApprovals = sortedApprovals.filter((approval) => {
        // @ts-ignore
        if (approval.remark !== null) {
          return approval.remark.startsWith(remark);
        } else {
          return;
        }
      });
    }

    if (approvalStatus) {
      sortedApprovals = sortedApprovals.filter((approval) => {
        // @ts-ignore
        return approval.approvalStatus === `${approvalStatus}`;
      });
    }

    if (limit) {
      sortedApprovals = sortedApprovals.slice(0, Number(limit));
    }
    if (sortedApprovals.length < 1) {
      return response.status(200).json({
        status: "FAILED",
        message: "no approval request matched your search",
        data: [],
      });
    }
    // return approval(s)
    return response.status(200).json({
      status: "OK",
      data: sortedApprovals.map((approval) => approval.$original),
    });
  }

  public async store({ request, response }: HttpContextContract) {
    try {
      const approvalSchema = schema.create({
        walletId: schema.string(),
        loanId: schema.string(),
        requestType: schema.string({ escape: true }, [rules.maxLength(50)]),
      });
      const payload: any = await request.validate({ schema: approvalSchema });
      // check if the request is not existing
      let approval;
      let loanIsExisting = await Loan.query().where({
        wallet_id: payload.walletId,
        id: payload.loanId,
      });
      if (loanIsExisting.length > 0) {
        let requestIsExisting = await Approval.query().where({
          wallet_id: payload.walletId,
          loan_id: payload.loanId,
        });

        console.log("Existing Approval Request details: ", requestIsExisting);
        if (requestIsExisting.length < 1) {
          approval = await Approval.create(payload);
          // @ts-ignore
          // approval.status = 'active'
          await approval.save();
          console.log("The new approval request:", approval);
          console.log("A New approval request has been Created.");

          // Save approval new status to Database
          await approval.save();
          // Send approval Creation Message to Queue
          // @ts-ignore
          Event.emit("new:approval", {
            id: approval.id,
            extras: approval.requestType,
          });
          return response
            .status(201)
            .json({ status: "OK", data: approval.$original });
        } else {
          //  Update approval request
          approval = requestIsExisting;
          if (approval[0].requestType === payload.requestType) {
            console.log(
              "No update was made, because the request is similar to the current one."
            );
            return response
              .status(201)
              .json({ status: "OK", data: approval[0].$original });
          }
          approval[0].requestType = payload.requestType;
          approval[0].approvalStatus = "pending"; //payload.approvalStatus
          approval[0].remark = "";

          await approval[0].save();
          // @ts-ignore
          Event.emit("new:approval", {
            id: approval.id,
            extras: approval[0].requestType,
          });
          return response
            .status(201)
            .json({ status: "OK", data: approval[0].$original });
        }
      } else {
        return response.status(404).json({
          status: "FAILED",
          message:
            "No loan data matched your approval request, please try again.",
        });
      }
    } catch (error) {
      console.error(error);
      return response.status(404).json({
        status: "FAILED",
        message: "your approval request was not successful, please try again.",
      });
    }
  }

  public async update({ request, response }: HttpContextContract) {
    try {
      const { loanId, walletId } = request.qs();
      console.log("Approval query: ", request.qs());

      let approval = await Approval.query().where({
        loan_id: loanId,
        wallet_id: walletId,
      });
      console.log(" QUERY RESULT: ", approval);
      let loan = await Loan.query().where({
        id: loanId,
        wallet_id: walletId,
      });
      if (approval.length < 1 || loan === undefined) {
        return response
          .status(404)
          .json({ status: "FAILED", message: "Not Found,try again." });
      }
      console.log(" QUERY RESULT for loan: ", loan[0].$original);

      if (approval.length > 0) {
        console.log(
          "Loan approval Selected for Update line 160:",
          approval
        );
        if (approval) {
          approval[0].approvalStatus = request.input("approvalStatus")
            ? request.input("approvalStatus")
            : approval[0].approvalStatus;
          approval[0].remark = request.input("remark")
            ? request.input("remark")
            : approval[0].remark;
          if (approval) {
            let newStatus;
            await approval[0].save();
            console.log("Update Approval Request line 171:", approval);
            if (
              approval[0].requestType === "start loan" &&
              approval[0].approvalStatus === "approved"
            ) {
              newStatus = "initiated";
              loan[0].status = newStatus;
              loan[0].approvalStatus = approval[0].approvalStatus;
              // Save the updated loan
              await loan[0].save();
            } else if (
              approval[0].requestType === "terminate loan" &&
              approval[0].approvalStatus === "approved"
            ) {
              // newStatus = 'terminated'
              // loan[0].status = newStatus
              loan[0].approvalStatus = approval[0].approvalStatus;
              loan[0].isPayoutAuthorized = true;
              loan[0].isTerminationAuthorized = true;
              // Calculate the Total Amount to payout by pro-rata
              let startDate = loan[0].startDate;
              let currentDate = new Date().toISOString();
              let daysOfLoan = await loanDuration(
                startDate,
                currentDate
              );
              let expectedDuration = loan[0].duration;
              let expectedInterestOnMaturity =
                loan[0].interestDueOnLoan;
              let amountInvested = loan[0].amount;
              if (parseInt(expectedDuration) > daysOfLoan) {
                // Pro-rata the Interest Due on Loan
                let interestDuePerDay =
                  expectedInterestOnMaturity / parseInt(expectedDuration);
                let newInterestDueToTermination =
                  daysOfLoan * interestDuePerDay;
                let formerTotalAmountToPayout =
                  loan[0].totalAmountToPayout;
                console.log(
                  "Former Total Amount Due for payout if Matured is, line 203: ",
                  formerTotalAmountToPayout
                );
                loan[0].totalAmountToPayout =
                  amountInvested + newInterestDueToTermination;
                // Save the updated loan
                await loan[0].save();
                let newTotalAmountToPayout = loan[0].totalAmountToPayout;
                console.log(
                  "Total Amount Due for payout due to Termination, line 211: ",
                  newTotalAmountToPayout
                );
              }
            } else if (
              approval[0].requestType === "payout loan" &&
              approval[0].approvalStatus === "approved"
            ) {
              // newStatus = 'payout'
              // loan[0].status = newStatus
              loan[0].approvalStatus = approval[0].approvalStatus;
              loan[0].isPayoutAuthorized = true;
              loan[0].isTerminationAuthorized = true;
              // Save the updated loan
              await loan[0].save();
            } else if (
              approval[0].requestType === "start loan" &&
              approval[0].approvalStatus === "declined"
            ) {
              newStatus = "initiated";
              loan[0].status = newStatus;
              loan[0].approvalStatus = approval[0].approvalStatus;
              // Save the updated loan
              await loan[0].save();
            } else if (
              approval[0].requestType === "terminate loan" &&
              approval[0].approvalStatus === "declined"
            ) {
              // newStatus = 'active'
              // loan[0].status = newStatus
              loan[0].approvalStatus = approval[0].approvalStatus;
              loan[0].isPayoutAuthorized = false;
              loan[0].isTerminationAuthorized = false;
              // Save the updated loan
              await loan[0].save();
            } else if (
              approval[0].requestType === "payout loan" &&
              approval[0].approvalStatus === "declined"
            ) {
              // newStatus = 'active'
              // loan[0].status = newStatus
              loan[0].approvalStatus = approval[0].approvalStatus;
              loan[0].isPayoutAuthorized = false;
              loan[0].isTerminationAuthorized = false;
              // Save the updated loan
              await loan[0].save();
            }
            // Update Loan data
            console.log(
              " Updated loan line 259: ",
              loan[0].$original
            );
            // send to user
            return response
              .status(200)
              .json({
                status: "OK",
                data: approval.map((inv) => inv.$original),
              });
          }
          return; // 422
        } else {
          return response
            .status(304)
            .json({ status: "FAILED", data: approval });
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
    const { walletId, loanId, approvalId } = request.qs();
    console.log("approval query: ", request.qs());

    let approval = await Approval.query().where({
      loan_id: loanId,
      wallet_id: walletId,
      id: approvalId,
    });
    console.log(" QUERY RESULT: ", approval);

    if (approval.length > 0) {
      approval = await Approval.query()
        .where({ loan_id: loanId, wallet_id: walletId, id: approvalId })
        .delete();
      console.log("Deleted data:", approval);
      return response
        .status(200)
        .json({ status: "OK", message: "Approval Request Deleted." });
    } else {
      return response
        .status(404)
        .json({ status: "FAILED", message: "Invalid parameters" });
    }
  }
}
