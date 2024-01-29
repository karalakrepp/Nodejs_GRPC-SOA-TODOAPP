const client = require("./client");
require('dotenv').config();
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const validator =require("validator")
const jwt = require('jsonwebtoken');
const { time, timeStamp } = require("console");
const app = express();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
const secretKey = "veryverysecret";
//middleware 


var owner_ids;

function authenticateToken(req, res, next) {
  let token;

  // Check for token in Authorization header
  if (req && req.headers && req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
    token = req.headers.authorization.split(' ')[1];
  }
  // Check for token in cookies
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ message: 'Yetkilendirme başarısız, token bulunamadı' });
  }

  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token geçersiz' });
    }
    
    console.log(user)
    req.user = user;
  
    next();
  });
}

-




app.post("/register", (req, res) => {
    const { username, password, email,tcKimlik,name,surname,year } = req.body;
    if (!validator.isEmail(email)) {
        return res.status(400).json({ error: 'Invalid email address' });
      }
    
      // Validate password
      if (!validator.isLength(password, { min: 8 })) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
      }
    
      // Validate TC Kimlik
      if (!validator.isNumeric(tcKimlik) || !validator.isLength(tcKimlik, { min: 11, max: 11 })) {
        return res.status(400).json({ error: 'TC Kimlik must be a numeric value and exactly 11 characters long' });
      }


    
    // `usersProto` içinde doğrudan servise erişim sağlanır
    client.Register({
        username,
        password,
        email,
        tcKimlik,
        name,
        surname,
        year
      }, (err, response) => {
        if (err) {
            return res.status(500).json({ error:err });
          }
    
          
      
          const { message } = response;
          return res.json({ message });
        // Handle response
      })})
      
     



app.post("/login", (req, res) => {
    const { email, password } = req.body;

    client.Login({ email, password }, (err, response) => {
        if (err) {
            return res.status(500).json({ error: "Internal Server Error" });
        }

        // Check if the response contains the 'token' field
     

        // Validate the token or use it as needed
        const token = response.token;

        // Respond with the token
        return res.json({ token });
    });
});



app.get("/", authenticateToken, (req, res) => {
  // Express.js ile owner_id'yi URL'den almak
  const owner_id = req.user.userId;

  // Convert owner_id to an integer
 
  // getAll fonksiyonunu çağırmadan önce owner_id'yi client.getAll çağrısına ekleyin
  client.getAll({ owner_id }, (err, data) => {
    if (!err) {
     res.send(data.todo)
  }

    console.log("data:",data);
    
    
  
   
  });
});



app.post("/save", authenticateToken, (req, res) => {
  // Your existing code to extract date and create todo

  
  
  const owner_id = req.user.userId; // Assuming 'userId' is the correct property

  console.log("ownerId =", owner_id);

  let todo = {
    name: req.body.name,
    isAktive: true,
    title: req.body.title,
    ownerID: owner_id,
  };

  // The authenticateToken middleware will ensure authentication before reaching this point

  client.insert(todo, (err, data) => {
    if (err) {
      console.error("Error creating todo:", err);
      return res.status(500).json({ message: 'Internal Server Error' });
    }

    console.log("Todo created successfully", data);
    res.json({ message: "Created todo", response: data });
  });
});



app.put("/update/:id", authenticateToken, (req, res) => {
  const id = req.params.id;
  const owner_id = req.user.userId;
  const updatedTodo = {
    id: id,
    name: req.body.name,
    isAktive: true,
    title: req.body.title,
    ownerID: owner_id,
  };

  // gRPC servisi çağrısı
  client.update(updatedTodo, (err, data) => {
    if (err) {
      console.error('Error during update:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    console.log('Todo updated successfully', data);
    res.json({ message: 'Todo updated successfully', updatedTodo: data });
  });
});


app.delete("/remove", authenticateToken, (req, res) => {


  client.remove({ id: req.body.id}, (err, _) => {
    if (err) {
      console.error('Error removing todo:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    console.log("Todo removed successfully");
    res.json('Todo removed successfully');
  });
});





const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server running at port %d", PORT);
});

