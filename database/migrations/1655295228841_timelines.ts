import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'timelines'


  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid("id").primary().index().unique().notNullable();
  table
    .uuid("loan_id")
    .references("id")
    .inTable("loans")
    .notNullable()
    .index()
    .onDelete("CASCADE");
      table.string("action", 100).notNullable().index();
      table.text("message").nullable().index().defaultTo("pending");
      table.text("meta").nullable().index();
      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp("created_at", { useTz: true });
      table.timestamp("updated_at", { useTz: true });

      table.index(["loan_id", "action", "message",], "timeline_index");
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
