const express = require("express");
const app = express();
const port = 8080;
const path = require("path");
const methodOverride = require("method-override");
const mongoose = require("mongoose");

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

const passport = require("passport");
const LocalStrategy = require("passport-local");
const session = require("express-session");
const User = require("./models/user");
const Post = require("./models/posts");

const wrapAsync = require('./wrapAsync.js')
// let posts = [

//     {
//         id: uuidv4(),
//         username: "rachna",
//         content: "I got selected for my first interview!"
//     },
//     {
//         id: uuidv4(),
//         username: "anuradha",
//         content: "Hard work is important to achive success!"
//     },
// ]

const dbUrl = "mongodb://127.0.0.1:27017/Blog-page";
main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(dbUrl);
}

const sessionOptions = {
  secret: "kdjfknvkdjskdjkkdnek",
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};
app.use(session(sessionOptions));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
	res.locals.currUser = req.user;
	next();
});

app.get("/", (req, res) => {
  res.redirect("/posts");
});

// user route  ---------------------
app.get("/signup", async (req, res) => {
  res.render("user/signup.ejs");
});
app.get("/signin", async (req, res) => {
  res.render("user/signin.ejs");
});
app.post("/signup",wrapAsync(async (req, res) => {
    try {
      let { username, email, password } = req.body;
      const newUser = new User({ email, username });
      const registeredUser = await User.register(newUser, password);
      console.log(registeredUser);
      req.login(registeredUser, (err) => {
        if(err) {
          return;
        }
        res.redirect("/posts");
      });
    } catch(e) {
      res.redirect("/signup");
    }
      
  }))

app.post(
  "/signin",
  passport.authenticate("local", {
    failureRedirect: "/login",
  }),wrapAsync(
  async (req, res) => {
    res.redirect("/posts")
  }
));

app.get("/logout", (req, res) => {
    req.logout((err) => {
        if(err) {
          return;
        }
        res.redirect("/posts");
    })
});

// post route  ---------------------
app.get("/posts",wrapAsync( async (req, res) => {
  let posts = await Post.find().populate('user')
  console.log(posts);
  res.render("index.ejs", { posts });
}));

app.get("/posts/new", (req, res) => {
  res.render("new.ejs");
});

app.post("/posts",wrapAsync( async (req, res) => {
    let user = req.user._id;
  let { title, descreption } = req.body;
  const post = new Post({
    title: title,
    user: user,
    descreption: descreption,
  });
  await post.save();
  res.redirect("/posts");
}));

app.get("/posts/:id",wrapAsync( async (req, res) => {
  let { id } = req.params;
  let post = await Post.findById(id).populate("user")
  console.log(post);
  res.render("show.ejs", { post });
}));

app.patch("/posts/:id", wrapAsync( async (req, res) => {
  let { id } = req.params;

  let post = await Post.findByIdAndUpdate(id, req.body);
  console.log(post);
  res.redirect(`/posts/${id}`);
}));

app.get("/posts/:id/edit", wrapAsync( async (req, res) => {
  let { id } = req.params;
  let post = await Post.findById(id);
  res.render("edit.ejs", { post });
}));

app.delete("/posts/:id", wrapAsync( async (req, res) => {
  let { id } = req.params;
  let posts = await Post.findByIdAndDelete(id);
  res.redirect("/posts");
}));

app.use("*",(req,res)=>{
    res.send("Something went wrong")
})

app.use((err, req,res, next)=>{
    console.log(err)
    
    let message = err.message
    res.render("error",{message})
})
app.listen(port, () => {
  console.log("listening to port : 8080");
});
