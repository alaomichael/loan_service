import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
  protected tableName = "rates";

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid("id").primary().index().unique().notNullable();
      table.string("product_name", 50).notNullable().index();
      table.float("lowest_amount", 12).unsigned().notNullable().index();
      table.float("highest_amount", 12).unsigned().notNullable().index();
      // table.string("duration").notNullable().index();
      table.string("tag_name", 100).notNullable().index();
      table.string("currency_code", 10).notNullable().index();
      table.string("additional_details").nullable().index();
      table.float("long").unsigned().nullable().index();
      table.float("lat").unsigned().nullable().index();
      table.float("interest_rate").unsigned().nullable().index();

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.string("status", 255).notNullable().index();
      table.timestamp("created_at", { useTz: true });
      table.timestamp("updated_at", { useTz: true });

      table.index(
        [
          "id",
          "product_name",
          "lowest_amount",
          "highest_amount",
          "tag_name",
          "currency_code",
          "additional_details",
        ],
        "rate_full_index"
      );
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
