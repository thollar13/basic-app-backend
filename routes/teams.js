const express = require('express');
const multer = require('multer');
const router = express.Router();
const Team = require('../models/team');
const checkAuth = require("../middleware/check-auth");

router.get('/api/teams');

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
	const team = new Team({
		name: req.body.name,
		imagePath: url + "/images/" + req.file.filename,
		creator: req.userData.userId
	});
	team.save().then(createTeam => {
		res.status(201).json({
			message: "Team created successfully!",
			team: {
				...createTeam,
				id: createTeam._id
			}
		});
	});
});

//// READ
router.get('/member/:id', checkAuth, (req, res, next) => {
    const id = req.params.id;
    let fetchedTeams;
    const teamsQuery = Team.find({ creator: id });
    teamsQuery.then(documents => {
        fetchedTeams = documents;
        return;
    }).then(() => {
        res.status(200).json({
			message: 'Teams fetched successfully!',
			teams: fetchedTeams,
		});	
    });
});

//// READ
router.get('', (req, res, next) => {
	const pageSize = +req.query.pagesize;
	const currentPage = +req.query.page;
	const teamQuery = Team.find();
	let fetchedTeam;
	if (pageSize && currentPage) {
		teamQuery
			.skip(pageSize * (currentPage - 1))
			.limit(pageSize);
	}
	teamQuery.then(documents => {
		fetchedTeam = documents;
		return Team.count();
	}).then(count => {
		res.status(200).json({
			message: 'Teams fetched successfully!',
			teams: fetchedTeam,
			maxTeams: count
		});	
	});
});

router.get('/:id', (req, res, next) => {
	Team.findById(req.params.id).then(team => {
		if (team) {
			res.status(200).json(team);
		} else {
            console.log('error')
			res.status(404).json({message: 'Team not found!'});
		}
    });
    
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
		const team = new Team({
			_id: req.body.id,
			name: req.body.name,
			imagePath: imagePath,
			creator: req.userData.userId
		});
		Team.updateOne({ _id: req.params.id, creator: req.userData.userId }, team).then((result) => {
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
	Team.deleteOne({ _id: req.params.id, creator: req.userData.userId }).then(result => {
		if (result.n > 0){
			res.status(200).json({ message: 'Deletion successful!' });	
		} else {
			res.status(401).json({ message: 'Not Authorized!' });
		}
	})
});

module.exports = router;