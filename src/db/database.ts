import Dexie, { type EntityTable } from 'dexie'
import type { Recipe, Starter, BakeSession } from '../models'

const db = new Dexie('BreadMateDB') as Dexie & {
  recipes: EntityTable<Recipe, 'id'>
  starters: EntityTable<Starter, 'id'>
  bakeSessions: EntityTable<BakeSession, 'id'>
}

db.version(1).stores({
  recipes: 'id, name, breadType, flourType, leavening, complexity, createdAt',
  starters: 'id, name, createdAt',
  bakeSessions: 'id, recipeId, status, startedAt',
})

export { db }
