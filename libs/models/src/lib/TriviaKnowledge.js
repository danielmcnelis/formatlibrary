
import { Sequelize } from 'sequelize'
import { db } from './db'

export const TriviaKnowledge = db.define('triviaKnowledges', {     
    playerName: {
        type: Sequelize.STRING
    },  
    playerId: {
        type: Sequelize.STRING
    },
    triviaQuestionId: {
        type: Sequelize.INTEGER
  }
})
