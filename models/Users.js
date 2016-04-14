var mongoose = require('mongoose');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');


var UserSchema = new mongoose.Schema({
  username: {type: String, lowercase: true, unique: true},
    name:String,
    position:String,
    location:String,
    since:String,
    desc:String,
  hash: String,
  salt: String,
    postid:String
});

UserSchema.methods.generateJWT = function() {

  // set expiration to 60 days
  var today = new Date();
  var exp = new Date(today);
  exp.setDate(today.getDate() + 60);

  return jwt.sign({
    _id: this._id,
    username: this.username,
      name:this.name,
      position:this.position,
      location:this.location,
      since:this.since,
      desc:this.desc,
      postid:this.postid,
      
    exp: parseInt(exp.getTime() / 1000),
  }, 'SECRET');
};

UserSchema.methods.setPassword = function(password){
  this.salt = crypto.randomBytes(16).toString('hex');

  this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');
};
UserSchema.methods.setuserid = function(myid){
  this.postid=myid;
    this.save();
};

UserSchema.methods.validPassword = function(password) {
  var hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');

  return this.hash === hash;
};

mongoose.model('User', UserSchema);