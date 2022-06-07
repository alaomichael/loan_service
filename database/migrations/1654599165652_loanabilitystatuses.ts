import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
  protected tableName = "loanabilitystatuses";

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid("id").primary().index().unique().notNullable();
      table.text("wallet_id").unsigned().nullable().index();
      table.float("balance", 255).unsigned().notNullable().index();
      table.float("amount_loanable", 255).unsigned().notNullable().index();
      table
        .enum("last_loan_duration", [
          "0",
          "7",
          "14",
          "21",
          "30",
          "45",
          "60",
          "90",
        ])
        .unsigned()
        .notNullable()
        .index();
      table.string("tag_name", 255).notNullable();
      table.string("currency_code", 10).notNullable().index();
      table.string("bvn", 11).notNullable().index();
      table.boolean("is_bvn_verified").notNullable().defaultTo(false).index();
      table.integer("total_number_of_loans_collected", 255).notNullable();
      table.integer("total_amount_of_loans_collected", 255).notNullable();
      table.integer("total_amount_of_loans_repaid", 255).notNullable();
      table
        .integer("total_amount_of_loans_yet_to_be_repaid", 255)
        .notNullable();
      table.jsonb("loan_history").notNullable().index();
      table.float("long").unsigned().nullable();
      table.float("lat").unsigned().nullable();
      table.float("credit_rating").unsigned().nullable();

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp("created_at", { useTz: true }).index();
      table.boolean("is_defaulter").notNullable().defaultTo(false).index();
      table.boolean("is_first_loan").notNullable().defaultTo(false).index();
       table.string("status", 255).notNullable().defaultTo("initiated").index();
      table.jsonb("timeline").nullable().index();

      // table.timestamp('date_payout_was_done', { useTz: true })
      table.timestamp("updated_at", { useTz: true });

      // indexes
      table.index(
        [
          "id",
          "wallet_id",
          "balance",
          "amount_loanable",
          "last_loan_duration",
          "tag_name",
          "currency_code",
          "bvn",
          "is_bvn_verified",
          "total_number_of_loans_collected",
          "total_amount_of_loans_collected",
          "total_amount_of_loans_repaid",
          "total_amount_of_loans_yet_to_be_repaid",
          "loan_history",
          "long",
          "lat",
          "credit_rating",
          "is_defaulter",
          "is_first_loan",
          "status",
        ],
        "loanability_full_index"
      );
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
