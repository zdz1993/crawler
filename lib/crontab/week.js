/*
 每周去执行的事件
 */

'use strict'

let schedule = require('node-schedule'),
    pcFeedBackModel = require('../../../backend/platform/pcFeedback.js'),
    pcOrderFeedbackModel = require('../../../backend/pcOrderFeedback/sendOrderFeedback.js'),
    Notify = require('../service/notify');

function Week() {}

Week.prototype._getOrderFeedback = function(callback) {
    (new pcOrderFeedbackModel()).findByAttr({
        comment_time: {
            $gt: moment().subtract(7, 'days').format('YYYY-MM-DD HH:mm:ss'),
            $lte: moment().format('YYYY-MM-DD HH:mm:ss')
        }
    }, function(err, feedbacks) {
        // 需要要邮件展示的
        let shows = {};
        feedbacks.forEach(function(item, index) {
            let txtVal = item.txtVal,
                cont = '订单页意见反馈',
                user_id = item.user_id,
                comment_time = item.comment_time,
                nickname=item.nickname;
            // shows[cont].push({txtVal:txtVal})
           shows[cont] ?shows[cont].push({
                txtVal: txtVal,
                user_id: user_id,
                comment_time: comment_time,
                nickname:nickname
            }):shows[cont]=[]
        });

        callback && callback(err, shows);
    })
}

Week.prototype._getFeedback = function(callback) {
    (new pcFeedBackModel()).findByAttr({
        time: {
            $gt: moment().subtract(7, 'days').format('YYYY-MM-DD HH:mm:ss'),
            $lte: moment().format('YYYY-MM-DD HH:mm:ss')
        }
    }, function(err, feedbacks) {
        //需要展示在邮件的
        let shows = {};
        feedbacks.forEach(function(item, index) {
            let type = item.detail.problem_type,
                content = item.detail.suggestion_content,
                feedback_time = item.time,
                shop_id = item.user.shopId;

            shows[type] ? shows[type].push({
                content: content,
                feedbackTime: feedback_time,
                shopId: shop_id
            }) : shows[type] = [];
        });
        callback && callback(err, shows);
    })
}

/**
 * 注册一个crontab job
 */
Week.prototype.registerJob = function() {
    let me = this;
    let rule = new schedule.RecurrenceRule();
    rule.dayOfWeek = [5];
    rule.hour = 17;
    rule.minute = 30;
    let job = schedule.scheduleJob(rule, function() {
        me._getFeedback(function(err, shows) {
            let needSend = {};
            let url = 'http://bizfe.meilishuo.com/feedback/shop';
            let mailTo = [];
            needSend.subject = '商家意见反馈周报【' + tools.date.dateFormat(new Date(), 'yyyy-MM-dd') + '】';
            let content = '';
            for (let key in shows) {
                content += '<table width="100%" style="border-collapse:collapse;">';
                content += '<caption style="padding-bottom:10px;color:#f66;text-align:left;">' + key + '（共 <b>' + shows[key].length + '</b> 条）' + '</caption>';
                content += '<thead><tr style="text-align:center;background-color:#fafafa;">';
                content += '<th width="15%" style="padding:5px 0;border:1px solid #ddd;">店铺ID</th>';
                content += '<th width="60%" style="padding:5px 0;border:1px solid #ddd;">反馈内容</th>';
                content += '<th width="25%" style="padding:5px 0;border:1px solid #ddd;">反馈时间</th>';
                content += '</tr></thead><tbody>';

                shows[key].forEach(function(item, index) {
                    content += '<tr>';
                    content += '<td width="13%" style="padding:5px 1%;border:1px solid #ddd;">' + item.shopId + '</td>';
                    content += '<td width="58%" style="padding:5px 1%;border:1px solid #ddd;">' + item.content + '</td>';
                    content += '<td width="25%" style="padding:5px 0;border:1px solid #ddd;text-align:center;">' + item.feedbackTime + '</td>';
                    content += '</tr>';
                });

                content += '</tbody></table>';
                content += '<br><br>';
            }
            content += '需要查看往期的商家意见反馈，<a href="' + url + '" style="color:#f66;">请点击这里进入&gt;&gt;</a>';
            needSend.content = content;
            let mailBiz = [],
                mailPM = config.mail_feedback,
                mail_to = mailBiz.concat(mailPM);

            //发多封邮件会用逗号隔开
            let arr = mail_to.map(function(item, index) {
                return item.level == 'high' ? item.addr : '';
            })
            new Notify().mail(arr.join(','), needSend);
        })
    });
}

// 注册一个crontab job
Week.prototype.registerJobOrder = function() {
    let me = this;
    let rule = new schedule.RecurrenceRule();
    rule.dayOfWeek = [5];
    rule.hour = 17;
    rule.minute = 20;
    let job = schedule.scheduleJob(rule, function() {
        me._getOrderFeedback(function(err, shows) {

            let needSend = {};
            let url = 'http://bizfe.meilishuo.com/feedback/order';
            let mailTo = [];
            needSend.subject = '订单页意见反馈周报【' + tools.date.dateFormat(new Date(), 'yyyy-MM-dd') + '】';
            let content = '';
            for (let key in shows) {
                content += '<table width="100%" style="border-collapse:collapse;">';
                content += '<caption style="padding-bottom:10px;color:#f66;text-align:left;">' + key + '（共 <b>' + shows[key].length + '</b> 条）' + '</caption>';
                content += '<thead><tr style="text-align:center;background-color:#fafafa;">';
                content += '<th width="15%" style="padding:5px 0;border:1px solid #ddd;">用户ID</th>';
                content += '<th width="15%" style="padding:5px 0;border:1px solid #ddd;">用户名称</th>';
                content += '<th width="25%" style="padding:5px 0;border:1px solid #ddd;">反馈时间</th>';
                content += '<th width="60%" style="padding:5px 0;border:1px solid #ddd;">反馈内容</th>';

                content += '</tr></thead><tbody>';

                shows[key].forEach(function(item, index) {
                    content += '<tr>';
                    content += '<td width="15%" style="padding:5px 1%;border:1px solid #ddd;">' + item.user_id + '</td>';
                    content += '<td width="15%" style="padding:5px 1%;border:1px solid #ddd;">' + item.nickname + '</td>';
                    content+='<td width="25%" style="padding:5px 1%;border:1px solid #ddd;">' + item.comment_time + '</td>';
                    content += '<td width="60%" style="padding:5px 0;border:1px solid #ddd;text-align:center;">' + item.txtVal + '</td>';
                    content += '</tr>';
                });

                content += '</tbody></table>';
                content += '<br><br>';
            }
            content += '需要查看往期的订单页意见反馈，<a href="' + url + '" style="color:#f66;">请点击这里进入&gt;&gt;</a>';
            needSend.content = content;
            let mailBiz = [],
                mailPM = config.mail_feedback[0],
                mail_to = mailBiz.concat(mailPM);

            //发多封邮件会用逗号隔开
            let arr = mail_to.map(function(item, index) {
                return item.level == 'high' ? item.addr : '';
            })
            new Notify().mail(arr.join(','), needSend);
        })
    });
}

module.exports = exports = Week;
