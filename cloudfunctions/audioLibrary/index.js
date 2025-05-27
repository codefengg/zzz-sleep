// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 获取数据库引用
const db = cloud.database()
const audioCollection = db.collection('audioLibrary')

// 云函数入口函数
exports.main = async (event, context) => {
  const { action, data } = event
  
  switch (action) {
    case 'get':
      return await handleGet(data)
    case 'add':
      return await handleAdd(data)
    case 'delete':
      return await handleDelete(data)
    default:
      return {
        success: false,
        message: '未知的操作类型'
      }
  }
}

// 获取音频
async function handleGet(data) {
  try {
    const { _id } = data || {}
    
    // 如果提供了ID，获取特定音频
    if (_id) {
      const audio = await audioCollection.doc(_id).get()
      return {
        success: true,
        data: audio.data
      }
    }
    
    // 否则获取所有音频
    const { data: audioList } = await audioCollection.get()
    
    return {
      success: true,
      data: audioList
    }
    
  } catch (err) {
    console.error('获取音频失败:', err)
    return {
      success: false,
      message: '获取音频失败',
      error: err
    }
  }
}

// 添加音频
async function handleAdd(data) {
  try {
    const { url, name } = data
    
    // 验证必要字段
    if (!url) {
      return {
        success: false,
        message: '缺少音频URL'
      }
    }
    
    // 添加到数据库
    const result = await audioCollection.add({
      data: { 
        url,
        name: name || '未命名音频' // 如果没有提供名称，使用默认名称
      }
    })
    
    return {
      success: true,
      data: {
        _id: result._id,
        url,
        name: name || '未命名音频'
      }
    }
    
  } catch (err) {
    console.error('添加音频失败:', err)
    return {
      success: false,
      message: '添加音频失败',
      error: err
    }
  }
}

// 删除音频
async function handleDelete(data) {
  try {
    const { _id } = data
    
    if (!_id) {
      return {
        success: false,
        message: '缺少音频ID'
      }
    }
    
    // 删除数据库记录
    await audioCollection.doc(_id).remove()
    
    return {
      success: true,
      message: '删除成功'
    }
    
  } catch (err) {
    console.error('删除音频失败:', err)
    return {
      success: false,
      message: '删除音频失败',
      error: err
    }
  }
}