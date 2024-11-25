
import { Sequelize } from 'sequelize'
import { db } from './db'

export const TriviaQuestion = db.define('triviaQuestions', {     
  content: {
    type: Sequelize.TEXT
  },
  answers: {
    type: Sequelize.TEXT
  },
  stringency: {
    type: Sequelize.FLOAT
  },
  category: {
    type: Sequelize.STRING
  },
  wasAskedRecently: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  order: {
    type: Sequelize.INTEGER
  }
})
