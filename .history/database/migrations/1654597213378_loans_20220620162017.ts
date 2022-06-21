import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
  protected tableName = "loans";

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid("id").primary().index().unique().notNullable();

      table.float("amount_requested").unsigned().notNullable();
      table.float("amount_approved", 255).unsigned().notNullable().defaultTo(0);
      table.string("wallet_id", 255).nullable().index();
      table.string("user_id", 255).nullable();
      table.string("first_name", 255).notNullable().index();
      table.string("last_name", 255).nullable();
      table.string("phone", 255).notNullable().index();
      table.string("email", 255).notNullable();
      table.string("savings_account_number", 255).notNullable();
      table.string("loan_account_number", 255).notNullable();
      table.string("beneficiary_account_number", 255).notNullable();
      table.string("beneficiary_account_name", 255).notNullable();
      table.string("beneficiary_account_bank", 255).notNullable();
      table.string("duration", 255).notNullable();
      table.string("tag_name", 255).notNullable();
      table.string("currency_code", 10).notNullable();
      table.string("bvn", 11).notNullable().index();
      table.boolean("is_bvn_verified").notNullable().defaultTo(false);
      // table.jsonb("loan_account_details").notNullable().index();
      table.float("long").nullable();
      table.float("lat").nullable();
      table.float("credit_rating").nullable();
      table.float("interest_rate").nullable();
      table.float("interest_due_on_loan").nullable();
      table.float("total_amount_to_repay").nullable();

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp("created_at", { useTz: true });
      table.date("start_date").nullable().index();
      table.date("repayment_date").nullable().index();
      table.boolean("is_loan_approved").notNullable().defaultTo(false);
      table.boolean("is_offer_accepted").notNullable().defaultTo(false);
      table
        .boolean("is_disbursement_successful")
        .notNullable()
        .defaultTo(false);
      table.boolean("is_repayment_successful").notNullable().defaultTo(false);
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
      table.string("timeline").nullable();
      table.string("date_disbursement_was_done").nullable().index();
      table.timestamp("updated_at", { useTz: true });

      // indexes
      table.index(
        ["id", "wallet_id", "duration", "tag_name", "bvn"],
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
