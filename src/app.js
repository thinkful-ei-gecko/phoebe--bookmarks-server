require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { NODE_ENV } = require('./config');
const logger = require('./logger');
const store = require('./store');
const validUrl = require('valid-url');
const uuid = require('uuid/v4');

const app = express();

const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';

app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());
app.use(express.json())

app.use(function validateBearerToken(req, res, next) {
  const apiToken = process.env.API_TOKEN
  const authToken = req.get('Authorization')

  if(!authToken || authToken.split(' ')[1] !== apiToken) {
    logger.error(`Unauthorized request to path: ${req.path}`)
    return res.status(401).json({error: 'Unauthorized request'})
  }
  next()
})

app.get('/bookmarks', (req, res) => {
  res.json(store)
});

app.get('/bookmarks/:id', (req, res) => {
  const { id } = req.params;
  console.log(id)
  const bookmark = store.find(b => b.id == id)
  
  if(!bookmark) {
    logger.error(`Bookmark with id ${id} not found`)
    return res.status(404).send('Bookmark not found')
  }
  res.json(bookmark)
})

app.post('/bookmarks', (req, res) => {
  const { title, url, description, rating } = req.body;
  
  //validations
  [title, url, description, rating].forEach(key => {
    if(!key){
      logger.error(`${key} is required`)
      return res.status(400).send(`Invalid data`)
    };
  });
  if(!validUrl.isUri(url)) {
    logger.error('Invalid url')
    return res.status(400).send('Invalid data')
  }
  if(!Number.isInteger(rating) || rating < 1 || rating > 5) {
    logger.error('Invalid rating')
    return res.status(400).send(`Invalid data`)
  }
  const id = uuid();
  const bookmark = {
    id,
    title,
    url,
    description,
    rating
  }

  store.push(bookmark);
  logger.info(`Bookmark with id ${id} created`)
  res.status(201).location(`http://localhost:8000/bookmarks/${id}`).json(bookmark);

});

app.delete('/bookmarks/:id', (req, res) => {
  const { id } = req.params;

  const bookmarkIndex = store.findIndex(bookmark => bookmark.id === id);

  if (bookmarkIndex === -1) {
    logger.error(`Bookmark with id ${id} not found`);
    return res.status(404).send('Not found');
  }

  store.splice(bookmarkIndex, 1);

  logger.info(`Bookmark with id ${id} deleted`);
  res.status(204).end();
})

app.use(function errorHandler(error, req, res, next)  {
  let response;
  if(NODE_ENV === 'production') {
    response = {error: {message: 'server error'}}
  }
  else {
    console.log(error)
    response = {message: error.message, error}
  }
  res.status(500).json(response)
});

module.exports = app;