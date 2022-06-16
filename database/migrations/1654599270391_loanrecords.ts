import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
  protected tableName = "loanrecords";

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid("id").primary().index().unique().notNullable();
      table.string("wallet_id", 255).nullable().index();
      table.string("user_id", 255).nullable().index();
      table.float("amount_requested", 255).unsigned().notNullable().index();
      table.float("amount_approved", 255).unsigned().notNullable().index();
      table.string("duration", 255).notNullable().index();
      table.string("tag_name", 255).notNullable();
      table.string("currency_code", 10).notNullable().index();
      table.string("bvn", 11).notNullable().index();
      table.boolean("is_bvn_verified").notNullable().defaultTo(false).index();
      table.string("loan_account_details").notNullable().index();
      table.float("loan_account_balance").nullable();
      table.float("long").unsigned().nullable();
      table.float("lat").unsigned().nullable();
      table.float("credit_rating").unsigned().nullable();
      table.float("interest_rate").unsigned().nullable();
      table.float("interest_due_on_loan").unsigned().nullable();
      table.float("total_amount_to_repay").unsigned().nullable().index();

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp("created_at", { useTz: true }).index();
      table.date("start_date").nullable().index();
      table.date("repayment_date").nullable().index();
      table.boolean("is_loan_approved").notNullable().defaultTo(false).index();
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
      table.string("timeline").nullable().index();

      // table.timestamp('date_payout_was_done', { useTz: true })
      table.string("date_disbursement_was_done").nullable().index();
      table.string("date_repayment_was_done").nullable().index();
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
        ],
        "loanrecord_index"
      );
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
