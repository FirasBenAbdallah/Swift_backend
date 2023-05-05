// include express framework
const express = require("express");

// create an instance of it
const app = express();

// create http server from express instance
const http = require("http").createServer(app);

// database module
const mongodb = require("mongodb");

// client used to connect with database
const MongoClient = mongodb.MongoClient;

// each Mongo document's unique ID
const ObjectId = mongodb.ObjectId;
// Add headers before the routes are defined
app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Request methods you wish to allow
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );

  // Request headers you wish to allow
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type,Authorization"
  );

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader("Access-Control-Allow-Credentials", true);

  // Pass to next layer of middleware
  next();
});

// module required for parsing FormData values
const expressFormidable = require("express-formidable");

// setting the middleware
app.use(expressFormidable());

const bcryptjs = require("bcryptjs");

// JWT used for authentication
const jwt = require("jsonwebtoken");
// secret JWT key
global.jwtSecret = "jwtSecret1234567890";

const auth = require("./modules/auth");
const contacts = require("./modules/contacts");
const chats = require("./modules/chats");

const nodemailer = require("nodemailer");
const { KeyObject } = require("crypto");
const { isKeyObject } = require("util/types");
const nodemailerFrom = "contactvidoc@gmail.com"; //"doit4sim3@gmail.com";
const transport = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true pour TLS
  auth: {
    user: "contactvidoc@gmail.com",
    pass: "jdamnkrgupsizehj",
  },
});
/* const transport = nodemailer.createTransport({
 /*  host: "smtp.gmail.com",
  port: 2525, 
  service: "gmail",
  auth: {
    // user: "a8ecad9759966f",
    // pass: "27fc2618ee4761"
    user: "doit4sim3@gmail.com",
    pass: "fqvcjyqtowvhaydq",
    // "ufmtxmtemtpqwdkd"
  },
}); */

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
global.apiUrl = "http://localhost:3000";
const port = process.env.PORT || 3000;

// start the server at port 3000 (for local) or for hosting server port
http.listen(port, function () {
  console.log("Server has been started at: " + port);

  // connect with database
  MongoClient.connect("mongodb://localhost:27017", function (error, client) {
    if (error) {
      console.error(error);
      return;
    }

    // database name
    global.db = client.db("iOS-App");
    console.log("Connected to " + global.db.databaseName);

    contacts.init(app);
    chats.init(app);
    app.post("/verifyAccount", async function (request, result) {
      const email = request.fields.email;
      const code = request.fields.code;

      if (!email || !code) {
        result.json({
          status: "error",
          message: "Please fill all fields.",
        });

        return;
      }

      // update JWT of user in database
      const user = await db.collection("users").findOne({
        $and: [
          {
            email: email,
          },
          {
            verificationToken: parseInt(code),
          },
        ],
      });

      if (user == null) {
        result.json({
          status: "error",
          message: "Invalid email code.",
        });

        return;
      }

      await db.collection("users").findOneAndUpdate(
        {
          _id: user._id,
        },
        {
          $set: {
            isVerified: true,
          },

          $unset: {
            verificationToken: "",
          },
        }
      );

      result.json({
        status: "success",
        message: "Account has been account. Kindly login again.",
      });
    });

    app.post("/resetPassword", async function (request, result) {
      //const email = request.fields.email
      const code = request.fields.code;
      const password = request.fields.password;
      const conf = request.fields.conf;

      if (!code || !password || !conf) {
        result.json({
          status: "error",
          message: "Please fill all fields.",
        });
        console.log("Please fill all fields.");
        return;
      }

      // update JWT of user in database
      const user = await db.collection("users").findOne({
        $and: [
          {
            code: code,
          },
          {
            code: parseInt(code),
          },
        ],
      });

      if (user == null) {
        result.json({
          status: "error",
          message: "Invalid email code.",
        });
        console.log("Invalid email code.");
        return;
      }

      const salt = bcryptjs.genSaltSync(10);
      const hash = await bcryptjs.hashSync(password, salt);

      await db.collection("users").findOneAndUpdate(
        {
          _id: user._id,
        },
        {
          $set: {
            password: hash,
          },

          $unset: {
            code: "",
          },
        }
      );

      result.json({
        status: "success",
        message: "Password has been changed.",
      });
    });

    app.post("/sendPasswordRecoveryEmail", async function (request, result) {
      const email = request.fields.email;

      if (!email) {
        result.json({
          status: "error",
          message: "Please enter your e-mail address.",
        });

        return;
      }

      // update JWT of user in database
      const user = await db.collection("users").findOne({
        email: email,
      });

      if (user == null) {
        result.json({
          status: "error",
          message: "Email does not exists.",
        });

        return;
      }

      const minimum = 0;
      const maximum = 999999;
      const randomNumber =
        Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;

      await db.collection("users").findOneAndUpdate(
        {
          _id: user._id,
        },
        {
          $set: {
            code: randomNumber,
          },
        }
      );

      const emailHtml =
        "Your password reset code is: <b style='font-size: 30px;'>" +
        randomNumber +
        "</b>.";
      const emailPlain = "Your password reset code is: " + randomNumber + ".";

      let mailOptions = {
        from: nodemailerFrom,
        to: email,
        subject: "Password reset code",
        text: emailPlain,
        html: emailHtml,
      };
      // void function (error, info) {
      //     console.log("Mail sent: ", info)
      // }
      // Send the email
      transport.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
        } else {
          console.log(`Email sent: ${info.response}`);
        }
      });

      result.json({
        status: "success",
        message: "A verification code has been sent on your email address.",
      });
    });

    // route for logout request
    app.post("/logout", auth, async function (request, result) {
      const user = request.user;

      // update JWT of user in database
      await db.collection("users").findOneAndUpdate(
        {
          _id: user._id,
        },
        {
          $set: {
            accessToken: "",
          },
        }
      );

      result.json({
        status: "success",
        message: "Logout successfully.",
      });
    });

    app.post("/getUser", auth, async function (request, result) {
      const user = request.user;

      result.json({
        status: "success",
        message: "Data has been fetched.",
        user: user,
      });
    });

    app.get("/getuser", async function (request, result) {
      const users = await db.collection("users").find().toArray();
      result.send({
        users: users,
      });
    });

    // route for login requests
    app.post("/login", async function (request, result) {
      // get values from login form
      const phone = request.fields.phone;
      const password = request.fields.password;

      if (!phone || !password) {
        result.status(400).json({
          status: "error",
          message: "Please fill all fields.",
        });
        console.log("Please fill all fields.");
        return;
      }

      // check if email exists
      const user = await db.collection("users").findOne({
        phone: phone,
      });

      if (user == null) {
        result.status(404).json({
          status: "error",
          message: "phone does not exists.",
        });
        console.log("phone does not exists.");
        return;
      }

      /* if (!user.isVerified) {
                result.json({
                    status: "verificationRequired",
                    message: "Please verify your email first."
                })

                return
            }
            */

      // check if password is correct
      const isVerify = await bcryptjs.compareSync(password, user.password);

      if (isVerify) {
        // generate JWT of user
        const accessToken = jwt.sign(
          {
            userId: user._id.toString(),
          },
          jwtSecret
        );

        // update JWT of user in database
        await db.collection("users").findOneAndUpdate(
          {
            phone: phone,
          },
          {
            $set: {
              accessToken: accessToken,
            },
          }
        );

        result.status(202).json({
          status: "success",
          message: "Login successfully.",
          accessToken: accessToken,
          user: {
            _id: user._id,
            name: user.name,
            phone: user.phone,
          },
        });
        console.log("Login successful!");
        return;
      }

      result.status(401).json({
        status: "error",
        message: "Password is not correct.",
      });
      console.log("Password is not correct.");
    });

    app.post("/signup", async function (request, result) {
      const name = request.fields.name;
      const phone = request.fields.phone;
      const email = request.fields.email;
      const birth_date = request.fields.birth_date;
      const address = request.fields.address;
      const password = request.fields.password;
      const conf_password = request.fields.conf_password;
      const pdp = request.fields.pdp;

      const createdAt = new Date().getTime();

      if (!phone || !name || !email || !password) {
        result.json({
          status: "error",
          message: "Please enter all values.",
        });
        console.log("Please enter all values.");
        return;
      }

      // check if phone already exists
      const user = await db.collection("users").findOne({
        phone: phone,
      });

      if (user != null) {
        result.json({
          status: "error",
          message: "phone already exists.",
        });
        console.log("phone already exists.");
        return;
      }

      const salt = bcryptjs.genSaltSync(10);
      const hash = await bcryptjs.hashSync(password, salt);
      const hash2 = await bcryptjs.hashSync(conf_password, salt);

      const minimum = 0;
      const maximum = 999999;
      const verificationToken =
        Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;

      // insert in database
      await db.collection("users").insertOne({
        name: name,
        phone: phone,
        email: email,
        birth_date: birth_date,
        address: address,
        password: hash,
        conf_password: hash2,
        pdp: pdp,
        accessToken: "",
        createdAt: createdAt,
      });

      /* const emailHtml = "Your email verification code is: <b style='font-size: 30px;'>" + verificationToken + "</b>."
            const emailPlain = "Your email verification code is: " + verificationToken + "."

            transport.sendMail({
                from: nodemailerFrom,
                to: phone,
                subject: "Email verification",
                text: emailPlain,
                html: emailHtml
            }, function (error, info) {
                console.log("Email sent: ", info)
            })
            */

      result.json({
        status: "success",
        message: "Account has been created.",
      });
      console.log("Account has been created.");
    });

    const mongoose = require("mongoose");
    const Publication = mongoose.model("Event", {
      name: {
        type: String,
      },
      address: {
        type: String,
      },
      start: {
        type: String,
      },
      end: {
        type: String,
      },
      description: {
        type: String,
      },
      pde: {
        type: String,
      },
    });
    app.post("/addevent", async (request, result) => {
      const publication = new Publication({
        name: request.fields.name,
        address: request.fields.address,
        start: request.fields.start,
        end: request.fields.end,
        description: request.fields.description,
        pde: request.params.pde,
      });
      const createdAt = new Date().getTime();

      if (
        !publication.name ||
        !publication.address ||
        !publication.start ||
        !publication.end ||
        !publication.description
      ) {
        result.json({
          status: "error",
          message: "Please enter all values.",
        });
        console.log("Please enter all values of this event.");
        return;
      }
      await db.collection("events").insertOne({
        name: publication.name,
        address: publication.address,
        start: publication.start,
        end: publication.end,
        description: publication.description,
        pde: publication.pde,
        createdAt: createdAt,
      });
      result.json({
        status: "success",
        message: "Event has been created.",
      });
      console.log("Event has been created.");
    });

    app.get("/getevent", async function (request, result) {
      const events = await db.collection("events").find().toArray();
      result.send({
        events: events,
        status: "success",
        message: JSON.stringify(events),
      });
    });
  });
});
