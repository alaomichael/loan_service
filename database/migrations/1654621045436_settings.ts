import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class Settings extends BaseSchema {
  protected tableName = "settings";

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid("id").primary().index().unique().notNullable();
      table.text("funding_wallet_id").unsigned().notNullable().index();
      table
        .boolean("is_disbursement_automated")
        .notNullable()
        .defaultTo(false)
        .index();
      table.string("funding_source_terminal", 100).notNullable().index();
      table
        .boolean("is_loan_automated")
        .notNullable()
        .defaultTo(false)
        .index();
      table
        .boolean("is_termination_automated")
        .notNullable()
        .defaultTo(false)
        .index();
      table.string("tag_name", 255).nullable();
      table.string("currency_code", 10).notNullable().index();

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp("created_at", { useTz: true }).index();

      // table.timestamp('date_payout_was_done', { useTz: true })

      table.timestamp("updated_at", { useTz: true });

      // indexes
      table.index(
        [
          "id",
          "funding_wallet_id",
          "is_disbursement_automated",
          "funding_source_terminal",
          "is_loan_automated",
          "is_termination_automated",
          "currency_code",
        ],
        "setting_full_index"
      );
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
