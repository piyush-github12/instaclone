var mongoose = require('mongoose');
var plm  = require("passport-local-mongoose");

mongoose.connect('mongodb://127.0.0.1:27017/instaclone');

var userSchema = mongoose.Schema({
  username : String,
  password:String,
  email: String,
  image:String,
  profession: String,
  posts:[
    {type: mongoose.Schema.Types.ObjectId , ref:'post'}
  ],
  savedposts:[
    {type :mongoose.Schema.Types.ObjectId , ref:'post'}
  ],
  followers:[
    {type:mongoose.Schema.Types.ObjectId , ref:'user' }
  ],
  following:[
    {type:mongoose.Schema.Types.ObjectId , ref:'user' }
  ],
  key: String
})

userSchema.plugin(plm);

module.exports = mongoose.model('user',userSchema)