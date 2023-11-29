var mongoose = require("mongoose");


var postSchema = mongoose.Schema({
 userid : {type:mongoose.Schema.Types.ObjectId , ref: 'user'},
 post: String,
 likes: [
   {type:mongoose.Schema.Types.ObjectId , ref:'user'}
 ],
 comments:[
   {type:mongoose.Schema.Types.ObjectId , ref:'comment'}
 ],
 date:{
   type:Date,
   default:Date.now(),
 },
 caption:String,
 size:String, 
});


module.exports = mongoose.model("post", postSchema);
