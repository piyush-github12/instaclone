var express = require("express");
var router = express.Router();
const userModel = require("./users");
const postModel = require("./posts");
const passport = require("passport");
const mailer = require("../nodemailer");
const crypto = require("crypto");
const multer = require("multer")
const path = require("path");
const mongoose = require('mongoose')
const { GridFsStorage } = require("multer-gridfs-storage");
const {Readable} = require('stream')

mongoose
  .connect("mongodb://127.0.0.1:27017/instaclone")
  .then(() => {
    console.log("connected to database");
  })
  .catch((err) => {
    console.log(err);
  });

const conn = mongoose.connection;
var gfsbucket ;
conn.once('open' , ()=>{
  gfsbucket = new mongoose.mongo.GridFSBucket(conn.db ,{
    bucketName:"uploads"
  })
})

// var storage = new GridFsStorage({
//   url: "mongodb://127.0.0.1:27017/instaclone",
//   file: (req, file) => {
//     return new Promise((resolve, reject) => {
//       crypto.randomBytes(16, (err, buf) => {
//         if (err) {
//           return reject(err);
//         }
//         const filename = buf.toString("hex") + path.extname(file.originalname);
//         const fileInfo = {
//           filename: filename,
//           bucketName: "uploads",
//         };
//         resolve(fileInfo);
//       });
//     });
//   },
// });

const storage = multer.memoryStorage()
const upload = multer({ storage:storage });

const localStrategy = require("passport-local");
passport.use(new localStrategy(userModel.authenticate()));


router.post("/uploadpost",isLoggedIn,upload.single("photo"),async function (req, res, next) {
  console.log(req.file);
  console.log(req.body);
  
  var user = await userModel.findOne({username : req.session.passport.user})
  
  const Randomname = crypto.randomBytes(20).toString("hex")

  await Readable.from(req.file.buffer).pipe(gfsbucket.openUploadStream(Randomname));

  await postModel.create({
    post: Randomname,
    size: req.file.size,
    caption : req.body.caption,
    userid : user._id,
    filetype: req.file.mimetype,
  })
  const post = await postModel.findOne({post: Randomname})
  user.posts.push(post._id)
  user.save()

  res.redirect("/profile");

});


/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});
router.get("/login", function (req, res, next) {
  res.render("login");
});

router.get("/profileimage/:imagename" , (req,res,next) =>{


  gfsbucket.openDownloadStreamByName(req.params.imagename).pipe(res)


      // const videoStream = gfsbucket.openDownloadStreamByName(
      //   req.params.imagename
      // );

      // videoStream.on("error", (err) => {
      //   console.error("Error streaming video file:", err);
      //   res.status(404).send("Video not found");
      // });

      // videoStream.pipe(res);



})
router.get("/profile", isLoggedIn, function (req, res, next) {
  userModel
    .findOne({ username: req.session.passport.user })
    .populate("posts")
    .then(function (founduser) {
      res.render("profile", { founduser });
      console.log(founduser)
    });
});

router.get('/openpost/:postname',isLoggedIn, function(req,res,next){
  res.render("openpost")
})

router.get("/feed", isLoggedIn, function (req, res, next) {
  res.render("feed");
});
router.get("/create", isLoggedIn, async function (req, res, next) {
  var founduser = await userModel.findOne({username : req.session.passport.user})
  res.render("create" , {founduser} );
});

router.get("/editback", isLoggedIn, function (req, res, next) {
   res.redirect("profile")
});

router.get("/edit", isLoggedIn, function (req, res, next) {
  userModel
    .findOne({ username: req.session.passport.user })
    .then(function (user) {
      res.render("edit", { user });
    });
});

router.get("/valininput/:usernamevalue", function (req, res, next) {
  userModel
    .findOne({ username: req.params.usernamevalue })
    .then(function (user) {
      if (user) {
        res.json(true);
      } else {
        res.json(false);
      }
    });
});


router.post("/updateprofile", isLoggedIn, function (req, res, next) {
  userModel.findOneAndUpdate(
    { username: req.session.passport.user },
    {$set :{ username: req.body.username , profession: req.body.profession }},
    { new: true }
  ).then(function(updatedsuer){
    req.login(updatedsuer, function(err){
      if(err){
        return next(err)
      }
      return res.redirect("/profile")
    })

  })
});
router.post("/uploadprofileimage",isLoggedIn,upload.single("upimage") , async function (req, res, next) {

  const nn = crypto.randomBytes(20).toString("hex")

  await Readable.from(req.file.buffer).pipe(gfsbucket.openUploadStream(nn));

  userModel
    .findOneAndUpdate(
      { username: req.session.passport.user },
      { $set: { image: nn } },
      { new: true }
    )
    .then(function (updatedsuer) {
      req.login(updatedsuer, function (err) {
        if (err) {
          return next(err);
        }
        return res.redirect("/profile");
      });
    });

});





/* password forgot */
router.get('/forgotpass-step1' , function(req , res , next){
  res.render('forgotpass-step1')
})
router.post('/sendmail' , async function(req , res , next){
  let user = await userModel.findOne({email : req.body.email})
  if(!user){
    res.send('Mail is sent to your Email if Exist')
  }
  else{
        crypto.randomBytes(50, async function (err, buff) {
          let newkey = buff.toString("hex");
          user.key = newkey;
          await user.save();
          mailer(req.body.email, user._id, newkey);
          res.send("mail sent");
        }); 
  }
  
})
router.get("/forgot/:userid/:key", async function (req, res, next) {
   let user = await userModel.findOne({_id : req.params.userid})
   if(user.key === req.params.key){
    res.render('resetpassword' , {user})
   }
   else{
    res.send('Wrong Link')
   }
});
router.post("/resetpassword/:userid", async  function (req, res, next) {
  let user = await userModel.findOne({_id : req.params.userid})

  user.setPassword(req.body.newpassword, async function () {
     await user.save();
     req.login(user, function () {
       res.redirect("/profile");
     });
  });
  
});
/* password forgot */

/* search user */
router.get("/search", isLoggedIn, function (req, res, next) {
  res.render("search")
});
router.post("/searchquery", isLoggedIn, async function (req, res, next) {
  if( req.body.search.length > 0){
    const serachedusers = await userModel.find({
      username : {$regex : req.body.search}
    })
    res.json({
      users : serachedusers
    })
  }
  else{
    res.json({
      users:""
    })
  }
});
router.get("/usersprofile/:user", isLoggedIn,async function (req, res, next) {
  var user = await userModel.findOne({username: req.session.passport.user,});
  var otheruser = await userModel.findOne({username : req.params.user})
  if(user.username === otheruser.username){
    res.redirect('/profile')
  }
  else{
    res.render("usersprofile" , {otheruser , user });
  }
  
});

/* Follow / unfollow other users  */
router.get("/follow/:userid", isLoggedIn, async function (req, res, next) {
  var ujf_kar_raha = await userModel.findOne({username: req.session.passport.user,});
  var ujf_ho_raha = await userModel.findOne({_id : req.params.userid})
 
 if (ujf_kar_raha.following.indexOf(req.params.userid) === -1){
   ujf_ho_raha.followers.push(ujf_kar_raha._id);
   ujf_ho_raha.save()
   ujf_kar_raha.following.push(ujf_ho_raha._id);
   ujf_kar_raha.save()
 }
 else{
  ujf_ho_raha.followers.splice(ujf_kar_raha._id , 1);
  ujf_ho_raha.save();
  ujf_kar_raha.following.splice(ujf_ho_raha._id , 1);
  ujf_kar_raha.save();
 }
  
  
  res.redirect("back");
});


router.get('/explore', function(req , res , next){
  res.render('explore')
})



router.post("/login",
  passport.authenticate("local", {
    successRedirect: "/profile",
    failureRedirect: "/login",
  }),
  function (req, res, next) {}
);

router.get("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/login");
  });
});

router.get("/email-exist/:email",function(req, res ,next){
  userModel.findOne({ email: req.params.email })
  .then(function(user){
    if(user){
      res.json(true)
    }
    else{
      res.json(false)
    }
  })
 
});

router.post("/register", function (req, res, next) {
    var newUser = new userModel({
      username: req.body.username,
      email: req.body.email,

    });
    userModel
      .register(newUser, req.body.password)
      .then(function (u) {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/profile");
        });
      })
      .catch(function (e) {
        res.send(e);
      });
  

});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect("/login");
  }
}

module.exports = router;
