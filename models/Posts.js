var mongoose = require('mongoose');

var PostSchema = new mongoose.Schema({
  title: String,
  link: String,
  upvotes: {type: Number, default: 0},
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    name: String,
    location:String,
    position:String,
    since:String,
    desc:String,
    upvotedBy:[String]
    
});

PostSchema.methods.upvote = function(cb) {
  this.upvotes += 1;
  this.save(cb);
};

PostSchema.methods.upvotePersistent = function(cb, username) {
  this.upvotes += 1;
this.upvotedBy.push(username);
  this.save(cb);
};


PostSchema.methods.downvote = function (cb) {
  this.upvotes -= 1;
  this.save(cb);
};

mongoose.model('Post', PostSchema);