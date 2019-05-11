var cookieParser = require('cookie-parser');
var logger = require('morgan');
var createError = require('http-errors');
var session = require('express-session');
var express = require('express');
var path = require('path');
var bodyParser = require("body-parser");
var FileStore = require('session-file-store')(session)

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var userData = require('./data/data').userData;
console.log(userData)
/*var userData={
    username:'weiqiujuan',
    password:123456
}*/

var identityKey = 'skey';

var app = express();

app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({
    name: identityKey,
    secret: 'weiqiujuan',
    store: new FileStore(),
    saveUninitialized: false,
    resave: false,
    cookie: {
        maxAge: 1000 * 1000
    }
}))

var client = require('mongodb').MongoClient;
var url = "mongodb://127.0.0.1:27017/";

var findUser = function (username, password) {
    return userData.find(function (item) {
        return item.username === username && item.password === password;
    });
};

//设置跨域
app.all("*", function (req, res, next) {
    //设置允许任何域名访问
    res.header('Access-Control-Allow-Origin', "*");
    //允许的header类型
    res.header("Access-Control-Allow-Headers", "content-type");
    //跨域允许的请求方法
    res.header("Access-Control-Allow-Methods", "DELETE,PUT,POST,GET,OPTIONS");
    if (req.method.toLowerCase() === 'options')
        res.send(200); //让options尝试请求返回结果
    else
        next();

})

var docu=[]
/*
client.connect(url, function (err, db) {
    if (err) throw err;
    var dBase = db.db('todoList')
    dBase.collection('todolist').updateOne(docu)
})*/
/*app.get('/', function (req, res, next) {
    var sess = req.session
    var loginUser = sess.loginUser;l
    var isLogined = !!loginUser;

    res.render('index', {
        isLogined: isLogined,
        name: loginUser || ''
    })
})*/

app.post('/login', function (req, res, next) {
    var sess = req.session;
    console.log(req.body)
    var user = findUser(req.body.username, req.body.password);

    if (user) {
        req.session.regenerate(function (err) {
            if (err) {
                return res.json({
                    ret_code: 2,
                    ret_msg: '登录失败'
                });
            }
            req.session.loginUser = user.name;
            res.json({
                ret_code: 0,
                ret_msg: '登录成功'
            })
        })
    } else {
        res.json({
            ret_code: 1,
            ret_msg: '账号或密码错误'
        })
    }
})
/*app.post('/login', function (req, res) {

    let username = req.body.username;
    let password = req.body.password;

    client.connect(url, function (err, client) {
        var db = client.db("todoList");
        var collection = db.collection("todoList");
        var query = {
            "login": {
                "username": username,
                "password": password
            }
        };
        console.log(query);
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
})*/

app.get('/logout', function (req, res, next) {
    // 备注：这里用�? session-file-store 在destroy 方法里，并没有销毁cookie
    // 所以�?户�?�? cookie 还是存在，�?致的�?? --> 退出登陆后，服务�?检测到cookie
    // 然后去查找�?应的 session 文件，报�?
    // session-file-store �?��的bug

    req.session.destroy(function (err) {
        if (err) {
            res.json({
                ret_code: 2,
                ret_msg: '退出登录失败'
            });
            return;
        } else {
            res.json({
                ret_code: 4,
                ret_msg: '退出登录成功'
            });
        }
        // req.session.loginUser = null;
        res.clearCookie(identityKey);
        res.redirect('/');
    });
});

app.post('/diaryApi', function (req, res) {
    var reqs = req.body;
    if (reqs) {
        client.connect(url, function (err, client) {
            var db = client.db("todoList");
            var collection = db.collection("todolist");
            var cursor = collection.find(reqs);
            console.log(reqs)
            cursor.forEach(
                function (doc) {
                    //console.log(doc);
                    res.send(doc);
                },
                function (err) {
                    client.close();
                }
            );
        });
    }
})

app.post('/historyApi',function (req,res) {
    console.log(req.body)
    if(req.body){
        client.connect(url, function (err, client) {
            var query = {
                "date": {
                    "$gte": req.body.startTime,
                    "$lte": req.body.endTime,
                }
            };
            var db = client.db("todoList");
            db.collection("todolist").find(query).toArray(function (err, resultData) {
                if (err) throw err;
                console.log(resultData);
                res.send(resultData)
            });
        });
    }
})

app.post('/saveTomatoData', function (req, res) {
    var document = req.body;
    res.status(200)
    client.connect(url, function (err, db) {
        if (err) throw err;
        var dBase = db.db('todoList')
        dBase.collection('tomatoTable').insertOne(document)
    })
    res.send('保存成功')
})

app.get('/findTomatoData', function (req, res) {
    res.status(200)
    client.connect(url, function (err, db) {
        if (err) throw err;
        var dBase = db.db('todoList')
        dBase.collection('tomatoTable').find({}).toArray(function (err, resultData) {
            if (err) throw err
            res.json(resultData)
        })
    })
})

app.get('/deleteTomatoData', function (req, res) {
    res.status(200)
    client.connect(url, function (err, db) {
        if (err) throw err;
        var dBase = db.db('todoList')
        dBase.collection('tomatoTable').remove({})
        res.send('暂无数据')
    })

})

//设置接口
/*app.get('/data', function (req, res) {
    res.status(200)
    //从数据库获取数据
    client.connect(url, function (err, db) {
        if (err) throw err;
        console.log("数据库已创建")
        var dBase = db.db('todolist')
        //查询数据
        dBase.collection('todolist').find({}).toArray(function (err, resultData) {
            if (err) throw err
            res.json(resultData)
        })
    })
    //读取死数据
    res.json(resultData)
})*/

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/Home', usersRouter);

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

module.exports = app;