/**
 * Config source: https://git.io/JesV9
 *
 * Feel free to let us know via PR, if you find something broken in this config
 * file.
 */

import Env from '@ioc:Adonis/Core/Env'
import { DatabaseConfig } from '@ioc:Adonis/Lucid/Database'
import Url from 'url-parse'
const CLEARDB_DATABASE_URL = new Url(Env.get('CLEARDB_DATABASE_URL’))
const databaseConfig: DatabaseConfig = {
  /*
  |--------------------------------------------------------------------------
  | Connection
  |--------------------------------------------------------------------------
  |
  | The primary connection for making database queries across the application
  | You can use any key from the `connections` object defined in this same
  | file.
  |
  */
  connection: Env.get("DB_CONNECTION"),

  connections: {
    /*
    |--------------------------------------------------------------------------
    | MySQL config
    |--------------------------------------------------------------------------
    |
    | Configuration for MySQL database. Make sure to install the driver
    | from npm when using this connection
    |
    | npm i mysql2
    |
    */
    // mysql: {
    //   client: 'mysql2',
    //   connection: {
    //     host: Env.get('MYSQL_HOST'),
    //     port: Env.get('MYSQL_PORT'),
    //     user: Env.get('MYSQL_USER'),
    //     password: Env.get('MYSQL_PASSWORD', ''),
    //     database: Env.get('MYSQL_DB_NAME'),
    //   },
    //   migrations: {
    //     naturalSort: true,
    //   },
    //   healthCheck: false,
    //   debug: false,
    // },DATABASE_URL='mysql://username:password@hostname/database_name?reconnect=true'
    // mysql2://b233f6745ccd46:1fc481be@us-cdbr-east-05.cleardb.net/heroku_f6842c08b8f1279?reconnect=true
    mysql: {
      client: "mysql",
      connection: {
        host: Env.get("MYSQL_HOST"),
        port: Env.get("MYSQL_PORT"),
        user: Env.get("MYSQL_USER"),
        password: Env.get("MYSQL_PASSWORD", ""),
        database: Env.get("MYSQL_DB_NAME"),
      },
      migrations: {
        naturalSort: true,
      },
      healthCheck: false,
      debug: false,
    },
  },
};

export default databaseConfig
