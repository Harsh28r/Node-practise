const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const userModel = require("./models/user");
const mongoose = require('mongoose');
const postModel = require('./models/post')

const mongoURI = 'mongodb://127.0.0.1:27017/harsh';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
  // Wait a bit before querying users to ensure any new registrations are complete
  setTimeout(() => {
    userModel.find({}, '-password')
      .then(users => {
        console.log('Users in the database:');
        console.log(JSON.stringify(users, null, 2));
      })
      .catch(err => console.error('Error querying users:', err));
  }, 5000); // Wait 5 seconds before querying
})
.catch(err => console.error('Error:', err));

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.set("view engine", "ejs");
app.set("views", "./views");  // Add this line if it's not already there
app.use(express.urlencoded({extended:true}));

// Log cookies for every request
app.use((req, res, next) => {
  console.log('Cookies:', req.cookies);
  next();
});

// Routes
app.get('/', (req, res) => {
    res.render('index');
  });

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/register', async (req, res) => {
  try {
    const { email, password, username, age } = req.body;

    // Check if user already exists
    let user = await userModel.findOne({ email });
    if (user) return res.status(400).json({ message: "User already registered" });

    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    user = new userModel({
      email,
      password: hashedPassword,
      username,
      age
    });

    // Save user to database
    await user.save();

    // Create and send JWT token
    const token = jwt.sign({ userId: user._id }, 'hhhhh', { expiresIn: '1h' });
    res.cookie('token', token, { httpOnly: true });
    
    // Redirect to a success page or send a success message
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt:', username);

    // Check if user exists
    const user = await userModel.findOne({ email: username });
    console.log('User found:', user ? 'Yes' : 'No');

    if (!user) {
      console.log('User not found in database');
      return res.status(400).json({ message: "User not found" });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    console.log('Password valid:', validPassword);

    if (!validPassword) {
      console.log('Invalid password');
      return res.status(400).json({ message: "Invalid password" });
    }

    // Create and send JWT token
    const token = jwt.sign({ userId: user._id }, 'hhhhh', { expiresIn: '1h' });
    res.cookie('token', token, { httpOnly: true });

    console.log('Login successful');
    res.status(200).json({ message: "Logged in successfully" });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

app.get('/logout', (req, res) => {
  // Clear the token cookie
  res.clearCookie('token');
  
  // Send a JSON response instead of redirecting
  res.json({ message: "Logged out successfully" });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;
  if (token == null) return res.sendStatus(401); // Unauthorized

  jwt.verify(token, 'hhhhh', (err, user) => {
    if (err) return res.sendStatus(403); // Forbidden
    req.user = user;
    next();
  });
};

// Use this middleware for protected routes
app.get('/protected-route', authenticateToken, (req, res) => {
  res.json({ message: "This is a protected route" });
});

const isLoggedIn = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json({ loggedIn: false });
  }

  jwt.verify(token, 'hhhhh', (err, user) => {
    if (err) {
      return res.json({ loggedIn: false });
    }
    req.user = user;
    next();
  });
};

// Use this middleware for checking login status
app.get('/isLoggedIn', isLoggedIn, (req, res) => {
  res.json({ loggedIn: true, user: { userId: req.user.userId } });
});

// Add a new route for user profile
app.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await userModel.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});
