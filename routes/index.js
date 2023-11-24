var express = require("express");
var router = express.Router();
const userModel = require("./users");
const passport = require("passport");
const mailer = require("../nodemailer");
const crypto = require("crypto");
const multer = require("multer")
const multer = require("multer")



const localStrategy = require("passport-local");
passport.use(new localStrategy(userModel.authenticate()));

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});
router.get("/login", function (req, res, next) {
  res.render("login");
});
router.get("/profile", isLoggedIn, function (req, res, next) {
  userModel
    .findOne({ username: req.session.passport.user })
    .then(function (founduser) {
      console.log(founduser);
      res.render("profile", { founduser });
    });
});
router.get("/feed", isLoggedIn, function (req, res, next) {
  res.render("feed");
});
router.get("/create", isLoggedIn, function (req, res, next) {
  res.render("create");
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
