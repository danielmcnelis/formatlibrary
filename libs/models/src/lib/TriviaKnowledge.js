
import { Sequelize } from 'sequelize'
import { db } from './db'

export const TriviaKnowledge = db.define('triviaKnowledges', {     
  triviaQuestionId: {
    type: Sequelize.INTEGER
  },
  playerId: {
    type: Sequelize.STRING
  }
})
