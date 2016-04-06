var cheerio = require("cheerio");
var request = require("request");
var nodemailer = require('nodemailer');
var smtp = require('nodemailer-smtp-transport');
var async = require('async');

var mail = {
    from: {
        host: 'smtp.126.com',
        name: 'zdz1993@126.com',
        port: 465,
        secure: true,
        auth: {
            user: 'zdz1993@126.com',
            pass: '56531056dezh'
        }
    },
    to: 'dezhizhang@meilishuo.com'
}
var smtpTransport = nodemailer.createTransport(mail.from);
var url = "https://github.com/zenany/weekly/blob/master/software/2016";
var data = "";
var nowDate = new Date()
    // 创建一个请求
var req = request(url, function(error, res, body) {
    var $ = cheerio.load(body),
        filesList = $('table.files .content a');

    //文件时间的列表
    var fileArray = [];

    //获取每个列表的标题，时间
    filesList.each(function(index, item) {
        // console.log(item);
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

        var fileTime = new Date(item.time);

        // console.log(fileTime, nowDate, fileTime < nowDate);
        //通过时间判断是不是最新的文章
        if (fileTime < nowDate || fileTime == nowDate) {

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
            console.log(url)
                //定义邮件内容
            oneArticle = {
                title: '百度FEX',
                content: '--- \r\n' +
                    'title: 百度FEX' + '\r\n' +
                    'date: ' + new Date() + '\r\n' +
                    'categories: FEX-Weekly' + '\r\n' +
                    'tags: [FEX]' + '\r\n' +
                    '---\r\n \r\n' + body
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
            from: 'zdz1993@126.com',
            to: mail.to,
            subject: subject,
            html: html
        };

        smtpTransport.sendMail(mailOptions, function(error, response) {
            if (error) {
                console.log(error);
            } else {
                console.log('Message sent: ' + response.message);
            }
            smtpTransport.close();
        });
    };


});
