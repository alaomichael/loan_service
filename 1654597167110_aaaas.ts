import BaseSchema from "@ioc:Adonis/Lucid/Schema";

// export default class SetupExtensions extends BaseSchema {
//   public up() {
//     this.schema.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
//   }

//   public down() {
//     this.schema.raw('DROP EXTENSION IF EXISTS "uuid-ossp"');
//   }
// }

export default class Extensions extends BaseSchema {
  public async up() {
    await this.db.rawQuery('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
      .knexQuery;
  }

  public async down() {
    await this.db.rawQuery('DROP EXTENSION IF EXISTS "uuid-ossp";')
      .knexQuery;
  }
}
