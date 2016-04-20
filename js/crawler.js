var cheerio = require("cheerio"),
    request = require("request"),
    nodemailer = require("nodemailer"),
    fs = require("fs"),
    path = require("path"),
    url = "https://github.com/zenany/weekly/blob/master/software/2016";

//存储文件名字得文件名称
var cacheName = "fex.json",
    cachePath = path.resolve("../" + cacheName);

//读取曾经都发送过那些文章
var fileArray = new function () { return require(cachePath).fex };

//配置邮件服务信息
var mail = {
    from: {
        "host": "",
        "port": 25,
        "auth": {
            "user": "",
            "pass": ""
        }
    },
    to: ''


}
var smtpTransport = nodemailer.createTransport(mail.from);

// var data = "";
// var nowDate = new Date();
// var year = nowDate.getFullYear();
// var month = (nowDate.getMonth()+1) > 9 ? (nowDate.getMonth()+1) : '0' + (nowDate.getMonth()+1);
// var day = nowDate.getDate() > 9 ?  nowDate.getDate() : '0' + nowDate.getDate();
// var nowTimeString =  year + '-' + month + '-' + day;
// 创建一个请求
var req = request(url, function (error, res, body) {
    var $ = cheerio.load(body),
        filesList = $('table.files .content a');

    //文件标题的列表
    var fileTitleArray = [];

    //获取每个列表的标题，时间
    filesList.each(function (index, item) {

        //获取标题
        var title = item.attribs.title;

        //将对象存到数组
        fileTitleArray.push(item);
    })

    //需要抓取文章的列表
    var articleUrlList = [];

    //存到文章列表
    articleUrlList = unq(fileTitleArray, fileArray)

    articleUrlList.forEach(function (item, index) {

        //需要抓取内容的链接
        var url = "https://github.com" + item.attribs.href;
        var oneArticle;

        //发送请求获取内容
        request(url, function (error, res, body) {

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

            //发送技术邮件
            sendMail('技术邮件', oneArticle);
           
            //重新拼接fex.json的内容
            fileArray.push(item.attribs.title);
            
            var fexJson = {
                fex: fileArray
            }
             console.log(fileArray,fexJson);
            //将新的邮件写入缓存
            fs.writeFile(cachePath, JSON.stringify(fexJson), function (err) {

                console.log(err);

            });

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

        smtpTransport.sendMail(mailOptions, function (error, response) {
            if (error) {
                console.log(error);
            } else {
                console.log(response);
            }
            smtpTransport.close();
        });
    };

    /**
     * 去除两个数组重复的值
     * @param {String} subject：发送的主题
     * @param {String} html：发送的 html 内容
     */
    function unq(arr1, arr2) {

        //临时数组1
        var temp = [];

        //临时数组2 
        var temparray = [];

        for (var i = 0; i < arr2.length; i++) {

            //巧妙地方：把数组B的值当成临时数组1的键并赋值为真  
            temp[arr2[i]] = true;
        };

        for (var i = 0; i < arr1.length; i++) {

            if (!temp[arr1[i].attribs.title]) {

                //巧妙地方：同时把数组A的值当成临时数组1的键并判断是否为真，如果不为真说明没重复，就合并到一个新数组里，这样就可以得到一个全新并无重复的数组  
                temparray.push(arr1[i]);

            };

        };

        return temparray;

    }
});
