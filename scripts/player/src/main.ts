import { TriviaQuestion } from '@fl/models'
import * as trivia from '../../../trivia.json'
import { shuffleArray } from '@fl/bot-functions'

;(async () => {
    const values = shuffleArray(Object.values(trivia))
    for (let i = 0; i < values.length; i++) {
        const value: any = values[i]
        await TriviaQuestion.create({
            content: value.question,
            answers: JSON.stringify(value.answers),
            stringency: value.stringency,
            order: i + 1
        })
    }
})()
