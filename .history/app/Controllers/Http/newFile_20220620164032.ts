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
      let paymentProcessingIsAutomated = settings[0].isDisbursementAutomated;
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
          let rate = await sendPaymentDetails(amount, duration, investmentType);
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
          loanId: loan[0].id,
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
            amountToPayoutNow = amount + loanData.interestDueOnLoan;
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
              payout.isTerminationAuthorized = loan[0].isTerminationAuthorized;

              await payout.save();
              console.log("Matured Loanrecord loan data line 2117:", payout);
            } else {
              payoutRequestIsExisting[0].requestType = loan[0].requestType;
              payoutRequestIsExisting[0].status = "payout";
              // loan[0]
              payload.status = "payout";
              //  Save
              await payoutRequestIsExisting[0].save();
              await payload.save();
            }

            let isDisbursementAutomated = settings[0].isDisbursementAutomated;
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
                loanId: loan[0].id,
                // @ts-ignore
                message: `${loan[0].walletHolderDetails.firstName} loan has just been sent for payment processing approval.`,
                createdAt: DateTime.now(),
                meta: `amount to payout: ${loan[0].totalAmountToPayout}, request type : ${loan[0].requestType}`,
              };
              console.log("Timeline object line 2654:", timelineObject);
              let newTimeline = await Timeline.create(timelineObject);
              console.log("new Timeline object line 2659:", newTimeline); // Save
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
                  isTransactionInProcess: isTransactionSentForProcessing,
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
              let newTimeline = await Timeline.create(timelineObject);
              console.log("new Timeline object line 2714:", newTimeline); // Save
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
              console.log("Matured Loanrecord loan data line 2477:", payload);

              payout = await Loanrecord.create(payload);
              payout.status = "payout";
              await payout.save();
              console.log("Matured Loanrecord loan data line 2482:", payout);

              // send payment details to transction service
              // Send Notification
              console.log(
                " The Rate return for RATE line 2491: ",
                await loanRate(
                  amountToBeReinvested,
                  payloadDuration
                  // payloadInvestmentType
                )
              );
              rate = await loanRate(
                amountToBeReinvested,
                payloadDuration
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
                  meta: `amount invested: ${loan[0].amount},amount paid: ${loan[0].interestDueOnLoan + loan[0].amount
                    }, request type : ${loan[0].requestType}`,
                };
                console.log("Timeline object line 2806:", timelineObject);
                let newTimeline = await Timeline.create(timelineObject);
                console.log("new Timeline object line 2813:", newTimeline);
                await loan[0].save();
                rolloverIsSuccessful = false;
                break;
              }
              // initiate a new loan
              var isNewInvestmentCreated = await createNewLoan(
                amountToBeReinvested,
                payloadDuration,
                payloadInvestmentType,
                loanData
              );
              console.log("new loan is created: ", isNewInvestmentCreated);
              if (isNewInvestmentCreated === undefined) {
                // send the money to the user
                // send payment details to transction service
                // Send Notification
                rolloverIsSuccessful = false;
                break;
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
              let newTimeline = await Timeline.create(timelineObject);
              console.log("new Timeline object line 2872:", newTimeline); // Save
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
              console.log("Matured Loanrecord loan data line 2580:", payload);
              payout = await Loanrecord.create(payload);
              payout.status = "payout";
              await payout.save();
              console.log("Matured Loanrecord loan data line 2584:", payout);

              // send payment details to transction service
              // Send Notification
              console.log(
                " The Rate return for RATE line 2591: ",
                await loanRate(amountToBeReinvested, payloadDuration)
              );
              rate = await loanRate(amountToBeReinvested, payloadDuration);
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
                console.log("Timeline object line 2941:", timelineObject);
                let newTimeline = await Timeline.create(timelineObject);
                console.log("new Timeline object line 2948:", newTimeline); // Save
                await loan[0].save();
                rolloverIsSuccessful = false;
                break;
              }

              // initiate a new loan
              isNewInvestmentCreated = await createNewLoan(
                amountToBeReinvested,
                payloadDuration,
                payloadInvestmentType,
                loanData
              );
              console.log("new loan is created 2628: ", isNewInvestmentCreated);
              if (isNewInvestmentCreated === undefined) {
                // send the money to the user
                // send payment details to transction service
                // Send Notification
                rolloverIsSuccessful = false;
                break;
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
              newTimeline = await Timeline.create(timelineObject);
              console.log("new Timeline object line 3013:", newTimeline); // Save
              await loan[0].save();
              rolloverIsSuccessful = true;
              break;
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
        let rate = await sendPaymentDetails(amount, duration, investmentType);
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
    message: "no loan matched your search, or payment has been processed.",
    data: {
      paymentStatus: loan.map((inv) => inv.$original.status),
      amountPaid: loan.map((inv) => inv.$original.totalAmountToPayout),
    },
  });
}
