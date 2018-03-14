const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');

const aleWalletRoutes = require('./api/routes/Ale-wallets');
const aleTransactionsRoutes = require('./api/routes/Ale-transactions');
const aleUsersRoutes = require('./api/routes/Ale-users');
const aleOffersRoutes = require('./api/routes/Ale-offers');

mongoose.Promise = global.Promise;
mongoose.connect(
	'mongodb://admin:'+
	process.env.MONGO_ATLAS_PW
	+'@the-protocol-shard-00-00-hsfjj.mongodb.net:27017,the-protocol-shard-00-01-hsfjj.mongodb.net:27017,the-protocol-shard-00-02-hsfjj.mongodb.net:27017/test?ssl=true&replicaSet=the-protocol-shard-0&authSource=admin', {
	useMongoClient: true
});

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(bodyParser.json());

app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
	res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
	next();
});

app.use('/wallet', aleWalletRoutes);
app.use('/transactions', aleTransactionsRoutes);
app.use('/users', aleUsersRoutes);
app.use('/offers', aleOffersRoutes);
app.use(cors());

app.use((req, res, next) => {
	const error = new Error('Not found');
	error.status = 404;
	next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
  	error: {
  		message: error.message
  	}
  })
});

module.exports = app;