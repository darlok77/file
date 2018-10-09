const { createServer } = require('https')
const fs = require('fs')
const express = require('express')
const helmet = require('helmet')
const bodyParser = require('body-parser')
const session = require('express-session')
const crypto = require('crypto')
const csrf = require('csurf')
const cookieParser = require('cookie-parser')
const fileUpload = require('express-fileupload')
const uuidv4 = require('uuid/v4')
const auth = require('basic-auth')
const escape = require('escape-html')

const { homePage } = require('./home_page.js')

const app = express()
app.use(fileUpload({
  limits: {
    fileSize: 4000000 //4mb
  }
}))
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ['*'],
      upgradeInsecureRequests: true,
    },
  })
)
app.use(helmet.frameguard({ action: 'deny' }))
app.use(helmet.noSniff())
app.use(
  helmet.hsts({ maxAge: 31536000, includeSubDomains: true, preload: true })
)
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Content-Type", "text/html")
  next()
})
app.use(helmet.ieNoOpen())
app.use(helmet.referrerPolicy({ policy: 'no-referrer' }))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(csrf({ cookie: true }))
const SESSION_SECRET =
  process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex')
app.use(
  session({
    name: 'SSID',
    secret: SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: true, httpOnly: true, domain: '.myapp.dev', path: '/' },
  })
);

app.get('/', function(req, res) {
  try {
    res.send(
      homePage({csrfToken: req.csrfToken()})
    );
  }catch(err){
    res.send('internal server error.');
    return;
  }
});

app.get('/images', function (req, res) {
  if (!auth(req)) {
    res.set('WWW-Authenticate', 'Basic realm="image access"')
    return res.status(401).send()
  }
  let { name, pass } = auth(req)
  name = escape(name)
  pass = escape(pass)
  if (name === process.env.USER && pass === process.env.PASS) {
    const pathImage = `${__dirname}/image/${req.query.image}`
    fs.readFile(pathImage, function (err, data) {
      if (err) throw err
      res.header('Content-Type', 'image/jpg')
      res.send(data)
    })
  } else {
    return res.status(401).send('bad creds')
  }
})


app.post('/file', function(req, res){
  try{
    const filename = uuidv4();
    switch(req.files.file.mimetype) {
      case 'image/jpeg':
        req.files.file.mv(`${__dirname}/img/${filename}.jpeg`, function(err) {
        if (err)
          console.log(err);
        fs.chmodSync(`${__dirname}/img/${filename}.jpeg`, '666')
        });
      break;
      case 'image/jpg':
        req.files.file.mv(`${__dirname}img/${filename}.jpg`, function(err) {
        if (err)
          console.log(err);
        fs.chmodSync(`${__dirname}img/${filename}.jpg`, '666')
        });
      break;
      case 'image/png':
        req.files.file.mv(`${__dirname}img/${filename}.png`, function(err) {
        if (err)
          console.log(err);
        fs.chmodSync(`${__dirname}img/${filename}.png`, '666')
        });
      break;
      default:
        console.log('data no accept')
    }
  }

   catch(err){
    console.log(err)
   }

  res.redirect('/');
    
})

createServer(
  {
    key: fs.readFileSync(process.env.SSL_KEY),
    cert: fs.readFileSync(process.env.SSL_CERT),
  },
  app
).listen(process.env.PORT);
