import request from 'request'
import config from '../config.json'
import { sendTitleList } from './gettitle.js'
import cheerio from 'cheerio'
import fs from 'fs'
import sendmail from './mailer'

const urlList = config && config.article  // 需要爬取的连接
const urlListObj = Reflect.ownKeys(urlList) // 数据枚举化

async function init (url, itemData, key) {
  let list = null
  let totalHtml = ''
  await new Promise((resolve) => {
    request(url, (error, response, body) => {
      if (error) console.log(error)
      list = sendTitleList(body, itemData)
      resolve(list)
    })
  })

  for (let i = 0; i < list.length; i++) {
    await new Promise(resolve => {
      request(list[i].href, (error, response, body) => {
        const $ = cheerio.load(body)
        const contenEle = $(itemData.contentElementNode).html()
        totalHtml = `${totalHtml}<br/>--------------------------<br/>${contenEle}`
        resolve()
      })
    })
  }

  if (!list.length) return
  let options = {
    subject: 'FE_文章推荐',
    html: totalHtml
  }
  sendmail(options)

  // 重写config.json文件
  for (let i = 0; i < list.length; i++) {
    config.article[key].articalList.push(list[i].title)
  }
  fs.writeFile('./config.json', JSON.stringify(config, null, '    '), (err) => {
    if (err) throw err
    console.log('It\'s saved!')
  })
}

urlListObj.forEach((item, index) => {
  const itemData = urlList[item]
  const url = itemData.url || ''
  init(url, itemData, item)
})
