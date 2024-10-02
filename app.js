const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const userModel = require("./models/user");
const postModel = require("./models/post");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
app.use(cookieParser());
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/login", (req, res) => {
  res.render("login");
});
app.get("/profile", isLoggedIn, async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email }).populate("posts");
  res.render("profile", {user});
});

app.get("/like/:id", isLoggedIn, async (req, res) => {
  let post = await postModel.findOne({ _id: req.params.id }).populate("user");
  if(post.likes.indexOf(req.user.userId) ===  -1) {
    post.likes.push(req.user.userId)
  }else{
    post.likes.splice(post.likes.indexOf(req.user.userId), 1)
  }

  await post.save();
  res.redirect("/profile");
});

app.get("/edit/:id", isLoggedIn, async (req, res) => {
  let post = await postModel.findOne({ _id: req.params.id }).populate("user");
  await post.save();
  res.render("edit", {post});
});

app.post("/post", isLoggedIn, async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email });
  let {content} = req.body;
  let post = await postModel.create({    
    user: user._id,
    content
  })   

  user.posts.push(post._id)
  await user.save()
  res.redirect('/profile')

});
app.post("/update/:id", isLoggedIn, async (req, res) => {
  console.log("req.body", req.body);

  let user = await postModel.findOneAndUpdate({ _id: req.params.id }, {content: req.body.content});
  res.redirect('/profile')

});

app.post("/register", async function (req, res) {
  const { userName, name, password, email, age } = req.body;
  let user = await userModel.findOne({ email });
  if (user) return res.status(500).send("User already registered");

  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, async (err, hash) => {
      const createdUser = await userModel.create({
        name,
        userName,
        email,
        password: hash,
        age,
      });
      let token = jwt.sign({ email: email, userId: user._id }, "secret");
      res.cookie("token", token);
    });
  });
  res.send("Your are registered");
});

app.post("/login", async function (req, res) {
  const { password, email } = req.body;
  let user = await userModel.findOne({ email });
  if (!user) return res.status(500).send("Something went wrong");

  bcrypt.compare(password, user.password, function (err, result) {
    if (result) {
      let token = jwt.sign({ email: email, userId: user._id }, "secret");
      res.cookie("token", token);
      return res.status(200).redirect("/profile");
    } else return res.redirect("/login");
  });
});

app.get("/logout", (req, res) => {
  res.cookie("token", "");
  res.redirect("/login");
});

function isLoggedIn(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.redirect("/login");

  try {
    const data = jwt.verify(token, "secret");
    req.user = data;
    next();
  } catch (error) {
    return res.redirect("/login");
  }
}


app.listen(5000);
