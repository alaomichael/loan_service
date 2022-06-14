import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
  protected tableName = "approvals";

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid("id").primary().index().unique().notNullable();
      table.string("wallet_id", 255).notNullable().index();
      table.string("loan_id", 255).notNullable().index();
      table.string("request_type", 100).notNullable().index();
      table
        .string("approval_status", 100)
        .nullable()
        .index()
        .defaultTo("pending");
      table.string("assigned_to", 100).nullable().index();
      table.string("remark", 100).nullable().index();
      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp("created_at", { useTz: true });
      table.timestamp("updated_at", { useTz: true });

      table.index(
        ["wallet_id", "loan_id", "request_type", "approval_status"],
        "approval_index"
      );
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
