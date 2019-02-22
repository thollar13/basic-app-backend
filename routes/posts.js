const express = require('express');
const multer = require('multer');
const router = express.Router();
const Post = require('../models/post');
const checkAuth = require("../middleware/check-auth");

router.get('/api/posts');

const MIME_TYPE_MAP = {
	'image/png': 'png',
	'image/jpeg': 'jpg',
	'image/jpg': 'jpg'
}

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		const isValid = MIME_TYPE_MAP[file.mimetype];
		let error = new Error("Invalid mime type");
		if(isValid) {
			error = null;
		};
		cb(error, "./images")
	},
	filename: (req, file, cb) => {
		const name = file.originalname.toLowerCase().split(' ').join('-');
		const ext = MIME_TYPE_MAP[file.mimetype];
		cb(null, name + '-' + Date.now() + '.' + ext);
	}
});


//// CREATE
router.post(
	'',
	checkAuth,
	multer({storage: storage}).single('image'),
	(req, res, next) => {
	const url = req.protocol + '://' + req.get("host");
	const post = new Post({
		title: req.body.title,
		content: req.body.content,
		imagePath: url + "/images/" + req.file.filename,
		creator: req.userData.userId
	});
	post.save().then(createdPost => {
		res.status(201).json({
			message: "Post created successfully!",
			post: {
				...createdPost,
				id: createdPost._id
			}
		});
	});
});

//// READ
router.get('', (req, res, next) => {
	const pageSize = +req.query.pagesize;
	const currentPage = +req.query.page;
	const postQuery = Post.find();
	let fetchedPosts;
	if (pageSize && currentPage) {
		postQuery
			.skip(pageSize * (currentPage - 1))
			.limit(pageSize);
	}
	postQuery.then(documents => {
		fetchedPosts = documents;
		return Post.count();
	}).then(count => {
		res.status(200).json({
			message: 'Posts fetched successfully!',
			posts: fetchedPosts,
			maxPosts: count
		});	
	});
});

router.get('/:id', (req, res, next) => {
	Post.findById(req.params.id).then(post => {
		if (post) {
			res.status(200).json(post);
		} else {
			res.status(404).json({message: 'Post not found!'});
		}
	})
});

//// UPDATE
router.put(
	'/:id',
	checkAuth,
	multer({storage: storage}).single('image'), 
	(req, res, next) => {
		let imagePath = req.body.imagePath;
		if(req.file) {
			const url = req.protocol + '://' + req.get("host");
			imagePath = url + "/images/" + req.file.filename;
		}
		const post = new Post({
			_id: req.body.id,
			title: req.body.title,
			content: req.body.content,
			imagePath: imagePath,
			creator: req.userData.userId
		});
		Post.updateOne({ _id: req.params.id, creator: req.userData.userId }, post).then(() => {
			if (result.nModified > 0){
				res.status(200).json({message: 'Update successful!'});	
			} else {
				res.status(401).json({message: 'Not Authorized!'});
			}
		});
	}
);

//// DELETE
router.delete(
	'/:id',
	checkAuth,
	(req, res, next) => {
	Post.deleteOne({ _id: req.params.id, creator: req.userData.userId }).then(result => {
		if (result.n > 0){
			res.status(200).json({ message: 'Deletion successful!' });	
		} else {
			res.status(401).json({ message: 'Not Authorized!' });
		}
	})
});

module.exports = router;