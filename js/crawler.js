var cheerio = require("cheerio");
var request = require("request");
var nodemailer = require('nodemailer');
// var smtpTransport = require('nodemailer-smtp-transport');
var async = require('async');

var mail = {
    from: {
        "host": "reportmail.meilishuo.com",
        "port": 25,
        "auth": {
            "user": "bizfe@mlsmsg.meilishuo.com",
            "pass": "Bizfe123"
        }
    },
    to: 'dezhizhang@meilishuo.com,fe-biz@meilishuo.com'
}
var smtpTransport = nodemailer.createTransport(mail.from);
var url = "https://github.com/zenany/weekly/blob/master/software/2016";
var data = "";
var nowDate = new Date();
var year = nowDate.getFullYear();
var month = (nowDate.getMonth()+1) > 9 ? (nowDate.getMonth()+1) : '0' + (nowDate.getMonth()+1);
var day = nowDate.getDate() > 9 ?  nowDate.getDate() : '0' + nowDate.getDate();
var nowTimeString =  year + '-' + month + '-' + day;
// 创建一个请求
var req = request(url, function(error, res, body) {
    var $ = cheerio.load(body),
        filesList = $('table.files .content a');

    //文件时间的列表
    var fileArray = [];

    //获取每个列表的标题，时间
    filesList.each(function(index, item) {

        //获取标题
        var title = item.attribs.title;

        //获取时间
        var time = title.split('.')[0];

        //获取现在的时间
        var articleDate = new Date(time);

        //将上面的值存到一个对象，便于操作
        var obj = {
            item: item,
            time: time
        }

        //将对象存到数组
        fileArray.push(obj);
    })

    //需要抓取文章的列表
    var articleUrlList = [];

    //找到需要抓取的url
    fileArray.forEach(function(item, index) {
        var time = item.time;
        var timeString = '2016-' + time.substring(0,2) + '-' + time.substring(2,4);
        var fileTime = new Date(timeString).getTime();
        var nowDateObj = new Date(nowTimeString).getTime();

        // console.log(fileTime, nowDate, fileTime < nowDate);
        //通过时间判断是不是最新的文章
        console.log(fileTime, nowDateObj, fileTime == nowDateObj);
        if (fileTime > nowDateObj || fileTime == nowDateObj) {

            //获取这个需要抓取的对象
            var ele = item.item;

            //存到文章列表
            articleUrlList.push(ele.attribs.href);

            // console.log(ele.attribs,ele)
        }
    })


    // // 获取文章内容的例子
    // function getArtical(url) {

    //     console.log(oneArticle);
    //     return oneArticle;
    // }

    articleUrlList.forEach(function(item, index) {
        // console.log(item, getArtical(item))
        var url = "https://github.com" + item;
        var oneArticle;

        //发送请求获取内容
        request(url, function(error, res, body) {
            var $ = cheerio.load(body),
                html = $('.entry-content').html();
            //定义邮件内容
            oneArticle = {
                title: '百度FEX',
                content: '--- \r\n' +
                    'title: 百度FEX' + '\r\n' +
                    'date: ' + new Date() + '\r\n' +
                    'categories: FEX-Weekly' + '\r\n' +
                    'tags: [FEX]' + '\r\n' +
                    '---\r\n \r\n' + html
            }
            sendMail('技术邮件', oneArticle);
        })



    })

    /**
     * @param {String} subject：发送的主题
     * @param {String} html：发送的 html 内容
     */
    function sendMail(subject, html) {
        var mailOptions = {
            from: 'zdz1993<zdz1993@126.com>',
            to: mail.to,
            subject: subject,
            html: html
        };

        smtpTransport.sendMail(mailOptions, function(error, response) {
            if (error) {
                console.log(error);
            } else {
                console.log(response);
            }
            smtpTransport.close();
        });
    };


});
