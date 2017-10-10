require('dotenv').config()

console.log(process.env.DB)

module.exports = () => ({
  date: new Date
})