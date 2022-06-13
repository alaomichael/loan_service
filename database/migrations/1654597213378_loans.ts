import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
  protected tableName = "loans";

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid("id").primary().index().unique().notNullable();

      table
        .float("amount_approved", 255)
        .unsigned()
        .notNullable()
        .defaultTo(0)
        .index();
      table.text("wallet_id").nullable().index();
      table.float("amount_requested").unsigned().notNullable().index();
      table
        .enum("duration", ["7", "14", "21", "30", "45", "60", "90"])
        .notNullable()
        .index();
      table.string("tag_name", 255).notNullable();
      table.string("currency_code", 10).notNullable().index();
      table.string("bvn", 11).notNullable().index();
      table.boolean("is_bvn_verified").notNullable().defaultTo(false).index();
      // table.jsonb("loan_account_details").notNullable().index();
      table.float("long").nullable();
      table.float("lat").nullable();
      table.float("credit_rating").nullable();
      table.float("interest_rate").nullable();
      table.float("interest_due_on_loan").nullable();
      table.float("total_amount_to_repay").nullable().index();

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp("created_at", { useTz: true }).index();
      table.date("start_date").nullable().index();
      table.date("repayment_date").nullable().index();
      table.boolean("is_loan_approved").notNullable().defaultTo(false).index();
      table.boolean("is_offer_accepted").notNullable().defaultTo(false).index();
      table
        .boolean("is_disbursement_successful")
        .notNullable()
        .defaultTo(false)
        .index();
      table
        .boolean("is_repayment_successful")
        .notNullable()
        .defaultTo(false)
        .index();
      table
        .string("request_type", 255)
        .notNullable()
        .defaultTo("request loan")
        .index();
      table
        .string("approval_status", 255)
        .notNullable()
        .defaultTo("pending")
        .index();
      table.string("status", 255).notNullable().defaultTo("initiated").index();
      table.jsonb("timeline").nullable().index();

      // table.timestamp('date_payout_was_done', { useTz: true })
      table.string("date_disbursement_was_done").nullable().index();
      table.timestamp("updated_at", { useTz: true });

      // indexes
      table.index(
        [
          "id",
          "wallet_id",
          "amount_requested",
          "amount_approved",
          "duration",
          "tag_name",
          "currency_code",
          "bvn",
          "is_bvn_verified",
          "credit_rating",
          "interest_rate",
          "interest_due_on_loan",
          "total_amount_to_repay",
          "repayment_date",
          "is_loan_approved",
          "is_repayment_successful",
          "is_disbursement_successful",
          "request_type",
          "approval_status",
          "status",
          "timeline",
          "date_disbursement_was_done",
          "is_offer_accepted",
        ],
        "loan_full_index"
      );
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
// function uuid(): import("knex").Knex.Value {
//   throw new Error("Function not implemented.");
//}
