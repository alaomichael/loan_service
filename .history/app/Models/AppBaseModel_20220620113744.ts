import {BaseModel} from '@ioc:Adonis/Lucid/Orm'
import CamelCaseNamingStrategy from 'App/Strategies/CamelCaseNamingStrategy'

export default AppBaseModel extends BaseModel {
public static namingStrategy = new CamelCaseNamingStrategy()
}