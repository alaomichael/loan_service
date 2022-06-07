import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
  protected tableName = "wallets";
  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid("id").primary().index().unique().notNullable();
      table.string("currency_code", 10).notNullable().index();
      table.float("balance", 255).unsigned().notNullable().index();
      table.string("bvn", 11).notNullable().index();
      table.boolean("is_bvn_verified").notNullable().defaultTo(false).index();
      table.jsonb("wallet_details").nullable().index();
      table.string("tag_name", 10).nullable().index();
      table.float("long").unsigned().nullable();
      table.float("lat").unsigned().nullable();
      table.float("credit_rating").unsigned().nullable();
      table.float("total_amount_to_repay").unsigned().nullable().index();

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp("created_at", { useTz: true }).index();
      table
        .string("request_type", 255)
        .notNullable()
        .defaultTo("create wallet")
        .index();
      table
        .string("approval_status", 255)
        .notNullable()
        .defaultTo("pending")
        .index();
      table.string("status", 255).notNullable().defaultTo("initiated").index();
      table.jsonb("timeline").nullable().index();

      // table.timestamp('date_payout_was_done', { useTz: true })
      table.timestamp("updated_at", { useTz: true });

      // indexes
      table.index(
        [
          "id",
          "long",
          "lat",
          "bvn",
          "balance",
          "is_bvn_verified",
          "wallet_details",
          "credit_rating",
          "total_amount_to_repay",
        ],
        "wallet_full_index"
      );
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
