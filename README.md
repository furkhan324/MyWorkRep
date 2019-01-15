# MyWorkRep

## Synopsis

Internal Management Review Tool. Developed for Robert White January 2016. (Web)


## Installation

Clone repo and run npm install/start.

```
git clone https://github.com/furkhan324/myworkrep.git
cd <into_directory_where_cloned>
npm install
```


## Routes

```JavaScript
/* GET home page. */
router.get('/', function (req, res) {
    res.render('index');
});

router.get('/posts', function (req, res, next) {
    Post.find(function (err, posts) {
        if (err) {
            return next(err);
        }

        res.json(posts);
    });
});

router.post('/posts', auth, function (req, res, next) {
    var post = new Post(req.body);
    post.author = req.payload.username;

    post.save(function (err, post) {
        if (err) {
            return next(err);
        }

        res.json(post);
    });
});
```
## Dependancies

API's and Frameworks used:

- Express.js [link](https://expressjs.com/ "Braintree"). Express used for REST routing
- Heroku [link](https://www.heroku.com/ "Firebase"). Node server hosted on Heroku
- MongoDB [link](https://docs.mongodb.com/ "MongoDB"). Storage, noSQL JSON based storage

## Contributors

Mohammed Abdulwahhab (@furkhan324), Taj Shaik(@tajshaik24)

## License

Code may not be copied, edited, or reproduced in any form without the consent of the contributors.
