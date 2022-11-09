'use strict';

const inspector = require('util').inspect

const inspect = (label, obj) => {
  return `${label}: ${obj !== undefined ? inspector(obj, { showHidden: false, depth: null, colors: true }) : ''}`
}

module.exports = {
    async up (queryInterface, Sequelize) {
        const sequelize = queryInterface.sequelize

        const [results, metadata] = await sequelize.query(`SELECT COUNT(*) from blogposts`)
        const count = Number(results[0]?.count)
        // console.log(`${inspect('results', results)}`)
        console.log(`${inspect('count', count)}`)
        const limit = 20
        for (let offset = 0; offset < count; offset += limit) {
          const [results, metadata] = await sequelize.query(
            `SELECT * from blogposts ORDER BY id LIMIT ${limit} OFFSET ${offset}`
          )
          // console.log(`${inspect('results', results)}`)
          for (const post of results) {
            const id = post?.id
            let content = post?.content
            content = content.replaceAll(`src="/images/`, `src="https://cdn.formatlibrary.com/images/`)
            const [results, metadata] = await sequelize.query('UPDATE blogposts SET content = $content WHERE id = $id', {
              bind: { id, content },
              type: Sequelize.QueryTypes.SELECT
            })
          }
        }
    },
  
    async down (queryInterface, Sequelize) {
        return
    }
};
