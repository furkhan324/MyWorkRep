var mongoose = require('mongoose');

var CommentSchema = new mongoose.Schema({
  body: String,
  author: String,
    upvotedBy:[String],
    date:{type: Number},
    datef:String,
    postid:String,
  upvotes: {type: Number, default: 0},
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' }
});

CommentSchema.methods.upvote = function(cb) {

  this.upvotes += 1;
  this.save(cb);
};

CommentSchema.methods.upvotePersistent = function(cb,username) {

  this.upvotes += 1;
    this.upvotedBy.push(username);
  this.save(cb);
};


CommentSchema.methods.downvote = function(cb) {
  this.upvotes -= 1;
  this.save(cb);
};

mongoose.model('Comment', CommentSchema);