// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: 'cloud1-7g7ul2l734c0683b' })
const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const { action, data } = event
  
  switch (action) {
    case 'getImages':
      return await getImages(data)
    case 'addImage':
      return await addImage(data)
    case 'updateImage':
      return await updateImage(data)
    case 'deleteImage':
      return await deleteImage(data)
    default:
      return {
        success: false,
        message: '未知操作'
      }
  }
}

// 获取图片列表
async function getImages(data = {}) {
  const { type, limit = 20, skip = 0 } = data
  
  try {
    let query = db.collection('library')
    
    // 获取总数
    const countResult = await query.count()
    const total = countResult.total
    
    // 获取图片列表
    const result = await query
      .skip(skip)
      .limit(limit)
      .get()
    
    // 处理返回结果
    const images = result.data.map(item => {
      return {
        _id: item._id,
        name: item.name || '',
        largeUrl: item.largeUrl,
        thumbnailUrl: item.thumbnailUrl,
        playUrl: item.playUrl,
        videoUrl: item.videoUrl || '',
        animatedUrl: item.animatedUrl || '',
        createTime: item.createTime
      }
    })
    
    return {
      success: true,
      data: images,
      total,
      limit,
      skip
    }
  } catch (err) {
    return {
      success: false,
      message: err.message || '获取图片列表失败'
    }
  }
}

// 添加图片
async function addImage(data) {
  const { name, largeUrl, thumbnailUrl, playUrl, videoUrl, animatedUrl } = data
  
  // 验证必填字段
  if (!name || !largeUrl || !thumbnailUrl || !playUrl) {
    return {
      success: false,
      message: '名称、大图URL、缩略图URL和播放图URL为必填项'
    }
  }
  
  try {
    // 添加到数据库
    const result = await db.collection('library').add({
      data: {
        name,
        largeUrl,
        thumbnailUrl,
        playUrl,
        videoUrl: videoUrl || '',
        animatedUrl: animatedUrl || '',
        createTime: db.serverDate()
      }
    })
    
    return {
      success: true,
      data: {
        _id: result._id
      },
      message: '添加成功'
    }
  } catch (err) {
    return {
      success: false,
      message: err.message || '添加图片失败'
    }
  }
}

// 更新图片
async function updateImage(data) {
  const { _id, name, largeUrl, thumbnailUrl, playUrl, videoUrl, animatedUrl } = data
  
  if (!_id) {
    return {
      success: false,
      message: '缺少图片ID'
    }
  }
  
  try {
    // 构建更新对象
    const updateData = {}
    
    if (name !== undefined) updateData.name = name
    if (largeUrl !== undefined) updateData.largeUrl = largeUrl
    if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl
    if (playUrl !== undefined) updateData.playUrl = playUrl
    if (videoUrl !== undefined) updateData.videoUrl = videoUrl
    if (animatedUrl !== undefined) updateData.animatedUrl = animatedUrl
    
    // 更新数据库
    await db.collection('library').doc(_id).update({
      data: updateData
    })
    
    return {
      success: true,
      message: '更新成功'
    }
  } catch (err) {
    return {
      success: false,
      message: err.message || '更新图片失败'
    }
  }
}

// 删除图片
async function deleteImage(data) {
  const { _id } = data
  
  if (!_id) {
    return {
      success: false,
      message: '缺少图片ID'
    }
  }
  
  try {
    await db.collection('library').doc(_id).remove()
    
    return {
      success: true,
      message: '删除成功'
    }
  } catch (err) {
    return {
      success: false,
      message: err.message || '删除图片失败'
    }
  }
}