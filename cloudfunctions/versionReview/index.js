// 云函数入口文件
const cloud = require('wx-server-sdk')

// 初始化云环境
cloud.init({
  env: 'cloud1-8glt6bb456600701'
})

// 云函数入口函数
exports.main = async (event, context) => {
  const { versionCode } = event
  
  try {
    // 查询数据库
    const db = cloud.database()
    const res = await db.collection('version')
      .where({
        versionCode: versionCode
      })
      .get()
    
    if (res.data.length === 0) {
      return {
        code: 404,
        message: '未找到对应版本号的数据'
      }
    }
    
    return {
      code: 200,
      data: {
        versionEnable: res.data[0].versionEnable
      }
    }
  } catch (err) {
    return {
      code: 500,
      message: '服务器错误',
      error: err
    }
  }
}