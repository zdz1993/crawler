/*
 每天去执行的事件，一般用来统计 errors 和 warns
 */

'use strict'

let schedule = require('node-schedule'),
    LogModel = require('../../../backend/platform/log.js'),
    Notify = require('../service/notify'),
    moment = require('moment');

let yesterday = moment().subtract(1, 'days');

function Today() {

}

Today.prototype._getErrors = function(callback) {

    LogModel.findLogByAttr({
        level: 'api',
        time: {
            $regex: yesterday.format('YYYY-MM-DD') || '',
            $options: 'i'
        }
    }, function(err, apis) {
        LogModel.findLogByAttr({
            level: 'fatal',
            time: {
                $regex: yesterday.format('YYYY-MM-DD') || '',
                $options: 'i'
            }
        }, function(err, fatals) {
            callback && callback(err, apis, fatals);
        })
    })
}

/**
 * 注册一个crontab job
 */
Today.prototype.registerJob = function() {
    let me = this;
    let rule = new schedule.RecurrenceRule();
    rule.dayOfWeek = [0, 1, 2, 3, 4];
    rule.hour = 10;
    rule.minute = 30;
    let job = schedule.scheduleJob(rule, function() {
        me._getErrors(function(err, apis, fatals) {
            let needSend = {};
            let url = 'http://bizfe.meilishuo.com/log?time=' + yesterday.format('YYYY-MM-DD');
            needSend.subject = yesterday.format('MM-DD') + '错误报告';
            let content = yesterday.format('MM-DD')+'检测结果：<br><h3>检测结果: 共<span style="color: #f00">{fatal_num}</span>个fatal' +
                ',<span style="color: #f69">{api_num}</span>个api' +
                '<br><br><br><br><a href={url} target="_blank">详情请猛戳我</a>';
            needSend.content = content.replace(/\{fatal_num\}/g, fatals.length).replace(/\{api_num\}/g, apis.length).replace(/\{url\}/g, url);

            //发多封邮件会用逗号隔开
            let arr = config.mail_to.map(function(item, index) {
                return item.level == 'high' ? item.addr : '';
            });
            new Notify().mail(arr.join(','), needSend);
        })
    });
}


module.exports = exports = Today;