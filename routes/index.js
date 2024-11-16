var express = require("express");
var router = express.Router();
const User = require("../models/userModel");
const UserInformation = require("../models/userInformationModel");
const bcrypt = require("bcrypt");
const isAutenticated = require('./middleware')

// ==========SIGNUP==========
let date 
let time 
router.get("/", function (req, res, next) {
  res.render("signUpForm", { message: null, errors: null });
});

router.post("/signupFormSubmit", (req, res) => {
  const { email, password, confirmPassword } = req.body;
  console.log(email, password, confirmPassword);

  const newUser = new User({
    email,
    password,
  });

  const validationError = newUser.validateSync();
  // console.log(validationError);
  if (password !== confirmPassword) {
    console.log("password not same");
    return res.render("signupForm", {
      message: "Password and Confirm Password do not match",
      errors: null,
    });
  }
  if (validationError) {
    console.log(validationError.errors);

    return res.render("signupForm", {
      message: null,
      errors: validationError.errors,
    });
  }

  User.findOne({ email })
    .then((existingUser) => {
      if (existingUser) {
        return res.render("signupForm", {
          message: "Email already taken",
          errors: null,
        });
      } else {
        return bcrypt.hash(password, 10);
      }
    })
    .then((hashpass) => {
      console.log(hashpass);
      const signupUser = new User({
        email: email,
        password: hashpass,
      });
      return signupUser.save();
    })
    .then(() => {
      return res.render("loginForm", { errors: [], message: null });
    })
    .catch((err) => {
      console.log(err);
    });
});

// ====================LOGIN=====================

router.get("/login", function (req, res, next) {
  res.render("loginForm", { message: null });
});

router.post("/loginFormSubmit", function (req, res) {
  const { email, password } = req.body;
  console.log(email);
  // console.log(req);

  User.findOne({ email })
    .then((user) => {
      if (!user) {
        return res.render("loginForm", {
          errors: [],
          message: "Incorrect Email Address.",
        });
      }

      return bcrypt.compare(password, user.password).then((isPasswordValid) => {
        if (!isPasswordValid) {
          return res.render("loginForm", {
            errors: [],
            message: "Incorrect password.",
          });
        }

        req.session.user_email = user.email;

        const currentDateObj = new Date();

        // Manually format the date as DD-MM-YYYY
        const day = currentDateObj.getDate();
        const month = currentDateObj.getMonth() + 1; // getMonth() is zero-based, so add 1
        const year = currentDateObj.getFullYear();
        const currentDate = `${day}/${month}/${year}`;

        const currentTime = new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        });

         date = `${currentDate}`;
         time = `${currentTime.toUpperCase()}`;
        console.log(date);
        console.log(time);
        return res.render("addWeight", {
          edit: false,
          currentDate: date,
          currentTime: time,
          message: null,
        });
      });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).send("Internal Server Error");
    });
});

// ==============Add weight page==================

router.get("/addWeight",(req,res)=>{
  res.render('addWeight',{
    edit: false,
    message: null,
    currentDate: date,
    currentTime: time,
  })
})
router.post("/addWeight",isAutenticated, (req, res) => {
  const { username, weight, date, time } = req.body;

  const email = req.session.user_email;
  console.log(email);

  const newUserInformation = new UserInformation({
    email,
    username,
    weight,
    date,
    time,
  });
  console.log(username, weight, date, time);

  UserInformation.find({ date, email })
    .then((existingDate) => {
      if (existingDate.length > 0) {
        return res.render("addWeight", {
          edit: false,
          message: "You have already submitted your weight for today",
          currentDate: date,
          currentTime: time,
        });
      } else {
        newUserInformation.save();
        return res.redirect('/listingPage');
      }
    })
    .catch((err) => {
      console.log("error", err);
    });
});

// ==============listingPage==================

// router.get('/listingPage',(req,res)=>{
//   const email = req.session.user_email;

//   UserInformation.find({email}).then(data=>{
//      data.forEach(user=>{
//       const userName = user.username
//       console.log(userName);
//      return res.render('listingPage',{data:data,username:userName})

//     })

//   })

// })
router.get("/listingPage",isAutenticated, (req, res) => {
  const { page = 1, limit = 1 } = req.query; // Default page and limit
  const email = req.session.user_email; // Fetch user email from session

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  // Paginate the weight entries for the logged-in user based on email
  UserInformation.paginate({email}, options)
    .then((result) => {
      // Pass the paginated result to the EJS file
      res.render("listingPage", {
        data: result.docs, // Paginated weight entries
        pagination: result, // Pagination info (page, totalPages, etc.)
        username: result.docs[0].username, // Get the user's name
        id: result.docs[0]._id, 
      });
      console.log(result);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Listing Page is Empty");
    });
});

// =============EDIT=================

router.get("/edit/:id",isAutenticated, (req, res) => {
  UserInformation.findById(req.params.id).then((data) => {
    console.log(data);

    const details = {
      id: data._id,
      weight: data.weight,
      date: data.date,
      time: data.time,
    };
    res.render("addWeight", { edit: true, data: details, errors: {} });
  });
});
router.post("/edit/:id", (req, res) => {
  const id = req.params.id;
  console.log(id);

  const { username, weight } = req.body;

  UserInformation.findByIdAndUpdate(id, { username, weight }).then((data) => {
    console.log(data);

    res.redirect("/listingPage");
  });
});

// =============DELETE===========

router.get("/confirmDelete/:id",isAutenticated, (req, res) => {
  console.log(req.params.id);
  UserInformation.findByIdAndDelete(req.params.id).then((data) => {
    res.redirect("/listingPage");
  });
});
// ==============AJAX=================

router.post("/calculateWeightLoss",isAutenticated, (req, res) => {
  const email = req.session.user_email;
  const startDate = req.body.startDate;
  const endDate = req.body.endDate;
  console.log(startDate, endDate);
  // UserInformation.findOne({
  //   email: email,
  //   date: startDate
  // }).then(first => {
  //   if (!first) {
  //     return res.send('First data not found')
  //   }
  //   UserInformation.findOne({
  //     email: email,
  //     date: endDate
  //   }).then(second => {
  //     if (!second) {
  //       return res.send('Second data not found')
  //     }
  //     console.log(first.weight,second.weight)
  //     console.log(Math.abs(first.weight-second.weight))
  //   })
  // })
  UserInformation.find({
    email: email,
    $or: [
      { date: startDate }, // Match documents with exact startDate
      { date: endDate }    // Match documents with exact endDate
    ]
    
  }).then(data => {
    if(data && data[0] && data[1])  {
    const result = Math.abs(data[0].weight - data[1].weight)
    res.json({result:result})
    console.log(result);
    } else {
      const result = "Invalid Date Entered"
      res.json({result:result})
    }
  })
  .catch(err => {
    console.error(err);
console.log(err);
  });

});

router.get('/logout' ,(req,res)=>{
  req.session.destroy() 
  res.redirect('/login')
  });
module.exports = router;
