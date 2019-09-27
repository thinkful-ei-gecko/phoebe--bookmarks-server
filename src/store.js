const uuid = require('uuid/v4');

const store = [
  {
    id: uuid(),
    title: 'GitHub',
    url: 'https://www.github.com',
    description: 'build projects',
    rating: 5
  },
  {
    id: uuid(),
    title: 'Gmail',
    url: 'https://www.gmail.com',
    description: 'send emails',
    rating: 3
  }
]

module.exports = store