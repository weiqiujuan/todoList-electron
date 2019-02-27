var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require("body-parser");

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

var client = require('mongodb').MongoClient;
var url = "mongodb://127.0.0.1:27017/";

//var resultData = require('./data/data')

app.all("*", function (req, res, next) {
    //设置可访问的任何域名
    res.header('Access-Control-Allow-Origin', "*");
    //允许的header类型
    res.header("Access-Control-Allow-Headers", "content-type");
    //跨域允许的请求方式
    res.header("Access-Control-Allow-Methods", "DELETE,PUT,POST,GET,OPTIONS");
    if (req.method.toLowerCase() === 'options')
        res.send(200);  //让options尝试请求快速结束
    else
        next();

})

app.post('/login', function (req, res) {

    let username = req.body.username;
    let password = req.body.password;

    client.connect(url, function (err,client) {
        var db = client.db("todoList");
        var collection = db.collection("todoList");
        var query = {
            "login": {
                "username": username,
                "password": password
            }
        };

        var cursor = collection.find(query);

        cursor.forEach(
            function (doc) {
                res.send(doc);
            },
            function (err) {
                client.close();
            }
        );
    })
})
//设置接口
app.get('/data', function (req, res) {
    res.status(200)
    //从数据库获取数据
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        console.log("数据库已创建")
        var dBase = db.db('todolist')
        //查询数据
        dBase.collection('todoList').find({}).toArray(function (err, resultData) {
            if (err) throw err
            res.json(resultData)
        })
    })
    //读取死数据
    //res.json(resultData)
})

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

/*app.use(session({
    secret: 'weird sheep',
    resave: false,
    saveUninitialized: true,
    cookie: {user: 'default', maxAge: 14 * 24 * 60 * 60 * 1000}
}))*/


module.exports = app;

