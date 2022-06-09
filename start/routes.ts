/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer'
|
*/
import HealthCheck from "@ioc:Adonis/Core/HealthCheck";
import Route from "@ioc:Adonis/Core/Route";

Route.get("/", async () => {
  return { hello: "world" };
});

Route.get("health", async ({ response }) => {
  const report = await HealthCheck.getReport();
  return report.healthy ? response.ok(report) : response.badRequest(report);
});

Route.group(() => {
  Route.group(() => {
    // POST ROUTES
    Route.post("wallets", "WalletsController.store");
    Route.post("loans", "LoansController.store");
    Route.post("admin/loans/settings", "SettingsController.store");
    Route.post("admin/loans/rates", "RatesController.store");

    Route.post("investments/approvals", "ApprovalsController.store");
    Route.post("admin/investments", "InvestmentsController.store");
    Route.post("admin/investments/approvals", "ApprovalsController.store");
    Route.post(
      "admin/investments/transactions",
      "InvestmentsController.processPayment"
    );

    // GET ROUTES
    Route.get("wallets", "WalletsController.index");
    Route.get("wallets/:walletId", "WalletsController.showByWalletId");
    // Route.get("loans/rates", "LoansController.getLoanRate");;
    Route.get("loans", "LoansController.index");
    Route.get("loans/:walletId", "LoansController.showByWalletId");
    Route.get("admin/loans/settings", "SettingsController.index");
    Route.get("loans/rates", "RatesController.index");
    Route.get("admin/loans/rates", "RatesController.index");
    Route.get("admin/loans/approvals", "ApprovalsController.index");
    Route.get(
      "admin/loans/recommendations",
      "LoansController.getCreditRecommendations"
    );
    Route.get("loans/loan/:loanId", "LoansController.showByLoanId");

    // Route.get('investments/payouts', 'InvestmentsController.showPayouts')
    Route.get("investments/payouts", "PayoutsController.index");
    Route.get("admin/investments/payouts", "InvestmentsController.showPayouts");
    Route.get(
      "admin/investments/payoutrecords",
      "PayoutRecordsController.index"
    );
    Route.get("admin/investments/feedbacks", "InvestmentsController.feedbacks");
    Route.get(
      "admin/investments/transactionsfeedbacks",
      "InvestmentsController.transactionStatus"
    );
    Route.get(
      "admin/investments/:investmentId",
      "InvestmentsController.showByInvestmentId"
    );
    Route.get(
      "investments/:investmentId",
      "InvestmentsController.showByInvestmentId"
    );

    // PUT ROUTES
    Route.put("wallets", "WalletsController.update");
    Route.put("admin/loans/settings", "SettingsController.update");
    Route.put("loans", "LoansController.update");
    Route.put("admin/loans/rates", "RatesController.update");
    Route.put("admin/loans/approvals", "ApprovalsController.update");
    Route.put("loans/offers", "LoansController.updateOffer");

    Route.put("investments/payouts", "InvestmentsController.payout");
    Route.put("investments/terminates", "InvestmentsController.payout");
    Route.put("admin/investments/terminates", "InvestmentsController.payout");
    Route.put("admin/investments/payouts", "InvestmentsController.payout");
    Route.put("admin/investments", "InvestmentsController.update");
    Route.put("investments", "InvestmentsController.update");

    // DELETE ROUTES
    Route.delete("wallets", "WalletsController.destroy");
    Route.delete("admin/loans/settings", "SettingsController.destroy");
    Route.delete("admin/loans/rates", "RatesController.destroy");
    Route.delete("admin/loans/approvals", "ApprovalsController.destroy");

    Route.delete("admin/investments/:userId", "InvestmentsController.destroy");
    Route.delete("investments/:userId", "InvestmentsController.destroy");
  });
}).prefix("api/v2");
