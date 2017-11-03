import cheerio from 'cheerio'
import url from 'url'

/**
 *拿到标题列表
 * @param {String} str html
 */
function getTitleList (str, conf) {
  const $ = cheerio.load(str)
  const titleEle = conf.titleElementNode // 定位title的元素
  let titleObjArr = []
  $(titleEle).map((index, item) => {
    const type = item.type
    const name = item.name
    let data = {
      title: $(item).text()
    }
    if (type === 'tag' && name === 'a') {
      data.href = setHref(item.attribs.href, conf.url)
    }
    titleObjArr.push(data)
  })
  return titleObjArr
}

/**
 * 补全连接
 * @param {any} path 路径
 * @returns 完整的url
 */
function setHref (path, confpath) {
  if (!path) console.log('连接错误')
  if (!confpath) console.log('补全配置连接，用来获取域名')
  const confUrl = url.parse(confpath)
  const formateUrl = url.parse(path)
  let data = path
  if (!formateUrl.protocol || !formateUrl.hostname) {
    data = `${confUrl.protocol}//${confUrl.hostname}${path}`
  }
  return data
}

function sendTitleList (str, conf) {
  const titleList = getTitleList(str, conf)
  const getUrlList = titleList.map(v => v.title)
  const confUrlLIst = conf.articalList
  let diffObj = {}
  let diffArr = []
  let difference = getUrlList.concat(confUrlLIst).filter(v => !getUrlList.includes(v) || !confUrlLIst.includes(v))
  difference.map(v => {
    titleList.map(item => {
      if (!diffObj[v] && item.title === v) {
        diffObj[v] = item.href
      }
    })
  })
  for (let key in diffObj) {
    diffArr.push({
      title: key,
      href: diffObj[key]
    })
  }
  return diffArr
}

export {
  sendTitleList,
  setHref,
  getTitleList
}
