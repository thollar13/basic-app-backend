const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
///32J8BqPoWuOomv5I
const mongoose = require('mongoose');

const postsRoutes = require('./routes/posts');
const userRoutes = require('./routes/user');

const app = express();

mongoose
	.connect(
		'mongodb+srv://thomas:32J8BqPoWuOomv5I@cluster0-cj3kl.mongodb.net/test?retryWrites=true'
	)
	.then(() => {
		console.log("Connected to database!");
	})
	.catch(() => {
		console.log("Error");
	});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/images', express.static(path.join("images")));

app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader(
		'Access-Control-Allow-Headers', 
		'Origin, X-Requested-With, Content-Type, Accept, Authorization'
	);
	res.setHeader(
		'Access-Control-Allow-Methods', 
		'GET, PUT, POST, PATCH, DELETE, OPTIONS'
	);
	next();
});

app.use('/api/posts', postsRoutes);
app.use('/api/user', userRoutes);


module.exports = app;