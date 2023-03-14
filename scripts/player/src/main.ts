import { TriviaQuestion } from '@fl/models'
const trivia = require('../../../trivia.json')

const shuffleArray = (arr) => {
    let i = arr.length
    let temp
    let index

    while (i--) {
        index = Math.floor((i + 1) * Math.random())
        temp = arr[index]
        arr[index] = arr[i]
        arr[i] = temp
    }

    return arr
}

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
