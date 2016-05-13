var cheerio = require("cheerio"),
    request = require("request"),
    nodemailer = require("nodemailer"),
    async = require("async"),
    fs = require("fs"),
    urlModel = require("url"),
    path = require("path"),
    http = require("http");

//存储文件名字得文件名称
var cacheName = "config.json",
    cachePath = path.resolve("../" + cacheName);

//获取配置文件
var config = new function() {
    return require(cachePath)
};

//配置邮件服务信息
var mail = config.mailoption;
var smtpTransport = nodemailer.createTransport(mail.from);

//查询都要抓取哪些网站的信息
for (key in config.article) {
    if (typeof key != "string") {
        break;
    }

    //获取文章的额标题对象
    async.waterfall([
            function(callback) {
                // 重新赋值
                var newKey = key;

                //获取实例对象
                var _this = config.article[newKey];

                //获取每个页面的url
                var pageurl = _this.url;

                //文章标题的html文本节点
                var titleElementNode = _this.titleElementNode;

                //文章内容的节点
                var contentElementNode = _this.contentElementNode;

                //读过的文章列表
                var oldArticalList = _this.articalList;

                request(pageurl, function(error, res, body) {

                    var $ = cheerio.load(body),
                        filesTitleList = $(titleElementNode);

                    var articleUrlList;

                    //文件标题的列表
                    var articalList = [];

                    //获取每个列表的标题
                    filesTitleList.each(function(index, item) {

                        //获取标题
                        var title = item.children[0].data;

                        //将对象存到数组
                        articalList.push(item);
                    })

                    //存到文章列表
                    articleUrlList = unq(articalList, oldArticalList);

                    //传给下一个函数的值
                    var nextValue = {
                        articleUrlList: articleUrlList,
                        pageurl: pageurl,
                        titleElementNode: titleElementNode,
                        contentElementNode: contentElementNode,
                        oldArticalList: oldArticalList,
                        _this: _this,
                        newKey: newKey
                    }

                    //传值给下一个函数
                    callback(null, nextValue)

                })
            }
        ],
        function(err, results) {

            var articleUrlList = results.articleUrlList;

            //最新的文章列表
            articleUrlList.forEach(function(item, index) {

                //需要抓取内容的链接
                var contentUrl = completionLink(item.attribs.href, results.pageurl);

                //发送请求获取内容
                request(contentUrl, function(error, res, body) {
                    var oneArticle;
                    var $ = cheerio.load(body);
                    var html = $(results.contentElementNode).html();

                    //如果有的文章中没有src属性要自行替换
                    if ($("img")) {
                        $("img").each(function(index, imgItem) {
                            html = html.replace("data-src", "src");
                        })
                    }

                    // 添加标志
                    html = html.replace("<p>-- THE END --</p>", "");
                    html += "<p>——————————————————————————————————————————————————</p>" +
                        "<p>该技术周报由<a href='https://github.com/zdz1993/crawler'>crawler</a>强力驱动</p>";

                    //定义邮件内容
                    oneArticle = {
                        title: item.children[0].data,
                        content: html
                    }

                    //发送技术邮件
                    sendMail('FE_文章推荐', oneArticle);

                    //重新拼接config.json的内容
                    results.oldArticalList.push(item.children[0].data);

                    config.article[results.newKey] = results._this;

                    //将新的邮件写入缓存
                    fs.writeFile(cachePath, JSON.stringify(config, null, '    '), function(err) {

                        if (err) {
                            console.log(err);
                        }
                    });
                })
            })
        })
}

/**
 * @param {String} subject：发送的主题
 * @param {String} html：发送的 html 内容
 */
function sendMail(subject, html) {
    var mailOptions = {
        from: mail.mailfrom,
        to: mail.to,
        subject: subject,
        html: html
    };

    smtpTransport.sendMail(mailOptions, function(error, response) {
        if (error) {
            console.log("error:" + error);
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

        if (!temp[arr1[i].children[0].data]) {

            //巧妙地方：同时把数组A的值当成临时数组1的键并判断是否为真，如果不为真说明没重复，就合并到一个新数组里，这样就可以得到一个全新并无重复的数组  
            temparray.push(arr1[i]);

        };

    };

    return temparray;

}

/**
 * 补全链接地址
 * @param {String} url：发送的主题
 */
function completionLink(url, objectUrl) {
    var oldUrl = urlModel.parse(url)
    var urlParse = urlModel.parse(objectUrl);
    var protocol = urlParse.protocol;
    var host = urlParse.host;
    var newUrl = url;
    if (!oldUrl.protocol) {
        newUrl = protocol + "//" + host + url;
    }
    return newUrl;

}
