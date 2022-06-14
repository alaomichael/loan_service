import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
  protected tableName = "loanabilitystatuses";

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid("id").primary().index().unique().notNullable();
      table.string("wallet_id",255).nullable().index();
      table.string("user_id",255).nullable().index();
      table.float("balance", 255).unsigned().nullable().index();
      table
        .float("recommendation", 255)
        .unsigned()
        .notNullable()
        .index()
        .defaultTo(4500);
      table
        .float("amount_loanable", 255)
        .unsigned()
        .notNullable()
        .index()
        .defaultTo(4500);
      table.timestamp("recommendation_updated_at", { useTz: true });
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

        .notNullable()
        .defaultTo(0)
        .index();
      table.string("currency_code", 10).notNullable().defaultTo('NGN').index();
      table.string("bvn", 11).nullable().index();
      table.boolean("is_bvn_verified").notNullable().defaultTo(false).index();
      table.integer("total_number_of_loans_collected", 255).notNullable().defaultTo(0);
      table.integer("total_amount_of_loans_collected", 255).notNullable().defaultTo(0);
      table.integer("total_amount_of_loans_repaid", 255).notNullable().defaultTo(0);
      table
        .integer("total_amount_of_loans_yet_to_be_repaid", 255)
        .notNullable()
        .defaultTo(0);
      table.string("loan_history").nullable().index();
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
      table.string("timeline").nullable().index();

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
          "bvn",
          "is_bvn_verified",
        ],
        "loanability_full_index"
      );
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
