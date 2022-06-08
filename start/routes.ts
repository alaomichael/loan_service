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
    // Route.resource('investments/payouts', 'PayoutsController').apiOnly()
    // Route.resource('users.investment', 'InvestmentsController').apiOnly()
    // Route.resource('investment', 'InvestmentsController').apiOnly()

    // POST ROUTES
    Route.post("wallets", "WalletsController.store");
    Route.post("loans", "LoansController.store");
    Route.post("admin/loans/settings", "SettingsController.store");

    Route.post("investments/approvals", "ApprovalsController.store");
    Route.post("admin/investments", "InvestmentsController.store");
    Route.post("admin/investments/rates", "RatesController.store");
    // Route.post('admin/investments/taxes', 'TaxesController.store')
    // Route.post('admin/investments/taxrecords', 'TaxRecordsController.store')
    Route.post("admin/investments/approvals", "ApprovalsController.store");
    Route.post(
      "admin/investments/transactions",
      "InvestmentsController.processPayment"
    );

    // GET ROUTES
    Route.get("wallets", "WalletsController.index");
    Route.get("wallets/:walletId", "WalletsController.showByWalletId");
    Route.get("loans/rates", "LoansController.getLoanRate");;
    Route.get("loans", "LoansController.index");
    // Route.get("loans/:walletId", "LoansController.showByWalletId");
    Route.get("loans/:loanId", "LoansController.showByLoanId");
    Route.get("admin/loans/settings", "SettingsController.index");

    Route.get("investments", "InvestmentsController.index");
    Route.get("admin/investments", "InvestmentsController.index");
    Route.get("investments/rates", "RatesController.index");
    Route.get("admin/investments/rates", "RatesController.index");
    Route.get("admin/investments/taxes", "TaxesController.index");
    Route.get("admin/investments/taxrecords", "TaxRecordsController.index");
    Route.get("admin/investments/approvals", "ApprovalsController.index");
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
    // Route.get('admin/investments/:userId', 'InvestmentsController.show')
    Route.get(
      "admin/investments/:investmentId",
      "InvestmentsController.showByInvestmentId"
    );
    Route.get(
      "investments/:investmentId",
      "InvestmentsController.showByInvestmentId"
    );
    // Route.get('investments/:userId', 'InvestmentsController.show')

    // Route.get('investments/rates', 'InvestmentsController.rate')

    // PUT ROUTES
    Route.put("wallets", "WalletsController.update");
    Route.put("admin/loans/settings", "SettingsController.update");

    Route.put("investments/payouts", "InvestmentsController.payout");
    Route.put("investments/terminates", "InvestmentsController.payout");
    Route.put("admin/investments/terminates", "InvestmentsController.payout");
    Route.put("admin/investments/payouts", "InvestmentsController.payout");
    Route.put("admin/investments/rates", "RatesController.update");
    // Route.put('admin/investments/taxes', 'TaxesController.update')
    // Route.put('admin/investments/taxrecords', 'TaxRecordsController.update')
    Route.put("admin/investments/approvals", "ApprovalsController.update");
    Route.put("admin/investments", "InvestmentsController.update");
    Route.put("investments", "InvestmentsController.update");

    // DELETE ROUTES
    Route.delete("wallets", "WalletsController.destroy");
    Route.delete("admin/loans/settings", "SettingsController.destroy");

    Route.delete("admin/investments/rates", "RatesController.destroy");
    Route.delete("admin/investments/taxes", "TaxesController.destroy");
    Route.delete(
      "admin/investments/taxrecords",
      "TaxRecordsController.destroy"
    );
    Route.delete("admin/investments/approvals", "ApprovalsController.destroy");
    Route.delete("admin/investments/:userId", "InvestmentsController.destroy");
    Route.delete("investments/:userId", "InvestmentsController.destroy");
    // Route.delete('investments/:id', 'InvestmentsController.destroy')
  });
}).prefix("api/v2");
