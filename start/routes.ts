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
    Route.post("admin/loans/products", "ProductsController.store");
     Route.post(
       "admin/loans/recommendations",
       "LoanabilitystatusesController.store"
     );

    Route.post("loans/approvals", "ApprovalsController.store");
    Route.post("admin/loans", "LoansController.store");
    Route.post("admin/loans/approvals", "ApprovalsController.store");
    Route.post(
      "admin/loans/transactions",
      "LoansController.processPayment"
    );

    // GET ROUTES
    Route.get("wallets", "WalletsController.index");
    Route.get("wallets/:walletId", "WalletsController.showByWalletId");
    // Route.get("loans/products", "LoansController.getLoanRate");;
    Route.get("loans", "LoansController.index");
    Route.get("admin/loans", "LoansController.index");
    Route.get("admin/loans/settings", "SettingsController.index");
    Route.get("loans/products", "ProductsController.index");
     Route.get("loans/products/:id", "ProductsController.show");
    Route.get("admin/loans/products", "ProductsController.index");
    Route.get("admin/loans/products/:id", "ProductsController.show");
    Route.get("admin/loans/approvals", "ApprovalsController.index");
    Route.get(
      "admin/loans/recommendations/rating",
      "LoansController.getCreditRecommendations"
      );
      Route.get(
        "admin/loans/recommendations",
        "LoanabilitystatusesController.index"
      );
      Route.get(
        "admin/loans/recommendations/:walletId",
        "LoanabilitystatusesController.showByWalletId"
      );
    Route.get("loans/:walletId", "LoansController.showByWalletId");
    Route.get("loans/loan/:loanId", "LoansController.showByLoanId");
    Route.get("admin/loans/loan/:loanId", "LoansController.showByLoanId");
    Route.get("admin/loans/feedbacks", "LoansController.feedbacks");
    Route.get("admin/loans/:walletId", "LoansController.showByWalletId");

    // Route.get('loans/payouts', 'LoansController.showPayouts')
    Route.get("loans/payouts", "PayoutsController.index");
    Route.get("admin/loans/payouts", "LoansController.showPayouts");
    Route.get(
      "admin/loans/payoutrecords",
      "PayoutRecordsController.index"
    );
    Route.get(
      "admin/loans/transactionsfeedbacks",
      "LoansController.transactionStatus"
    );
    Route.get(
      "admin/loans/:loanId",
      "LoansController.showByLoanId"
    );
    Route.get(
      "loans/:loanId",
      "LoansController.showByLoanId"
    );

    // PUT ROUTES
    Route.put("wallets", "WalletsController.update");
    Route.put("admin/loans/settings", "SettingsController.update");
    Route.put("loans", "LoansController.update");
    Route.put("admin/loans", "LoansController.update");
    Route.put("admin/loans/products", "ProductsController.update");
      Route.put(
        "admin/loans/recommendations",
        "LoanabilitystatusesController.update"
      );
    Route.put("admin/loans/approvals", "ApprovalsController.update");
    Route.put("admin/loans/offers", "LoansController.updateOffer");

    Route.put("loans/payouts", "LoansController.payout");
    Route.put("loans/terminates", "LoansController.payout");
    Route.put("admin/loans/terminates", "LoansController.payout");
    Route.put("admin/loans/payouts", "LoansController.payout");

    // DELETE ROUTES
    Route.delete("wallets", "WalletsController.destroy");
    Route.delete("admin/loans/settings", "SettingsController.destroy");
    Route.delete("admin/loans/products", "ProductsController.destroy");
    Route.delete("admin/loans/approvals", "ApprovalsController.destroy");
     Route.delete(
       "admin/loans/recommendations",
       "LoanabilitystatusesController.destroy"
     );
    Route.delete("admin/loans/:loanId", "LoansController.destroy");
    Route.delete("loans/:loanId", "LoansController.destroy");
  });
}).prefix("api/v2");
