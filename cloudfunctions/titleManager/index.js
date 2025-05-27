// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: 'cloud1-7g7ul2l734c0683b' })
const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const { action, data } = event
  
  // 根据action参数执行不同操作
  switch (action) {
    case 'add':
      return await addTimeTitle(data)
    case 'update':
      return await updateTimeTitle(data)
    case 'delete':
      return await deleteTimeTitle(data)
    case 'getAll':
      return await getAllTimeTitles()
    case 'getCurrentTitle':
      return await getCurrentTitle()
    default:
      return {
        success: false,
        error: '未知的操作类型'
      }
  }
}

// 添加时间段标题
async function addTimeTitle(data) {
  const { 
    startTime,    // 开始时间 格式: "HH:MM" 例如 "06:00"
    endTime,      // 结束时间 格式: "HH:MM" 例如 "07:00"
    title,        // 标题
    subtitle      // 副标题
  } = data
  
  // 输入验证
  if (!startTime || !endTime) {
    return {
      success: false,
      error: '开始时间和结束时间不能为空'
    }
  }
  
  if (!title) {
    return {
      success: false,
      error: '标题不能为空'
    }
  }
  
  // 验证时间格式
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
  if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
    return {
      success: false,
      error: '时间格式不正确，应为 HH:MM 格式'
    }
  }
  
  // 转换为分钟数进行比较
  const startMinutes = convertTimeToMinutes(startTime)
  const endMinutes = convertTimeToMinutes(endTime)
  
  // 检查时间范围是否有效
  if (startMinutes >= endMinutes && endMinutes !== 0) { // 允许跨天，如 23:00-00:00
    return {
      success: false,
      error: '结束时间必须晚于开始时间'
    }
  }
  
  try {
    // 检查是否与现有时间段重叠
    const existingTitles = await db.collection('timeTitles').get()
    
    for (const item of existingTitles.data) {
      const itemStartMinutes = convertTimeToMinutes(item.startTime)
      const itemEndMinutes = convertTimeToMinutes(item.endTime)
      
      // 检查重叠情况
      if (isTimeOverlap(startMinutes, endMinutes, itemStartMinutes, itemEndMinutes)) {
        return {
          success: false,
          error: `时间段与现有时间段 "${item.title}" (${item.startTime}-${item.endTime}) 重叠`
        }
      }
    }
    
    // 添加新时间段标题
    const result = await db.collection('timeTitles').add({
      data: {
        startTime,
        endTime,
        title,
        subtitle: subtitle || '',
        createTime: db.serverDate(),
        updateTime: db.serverDate()
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
      error: err.message || '添加时间段标题失败'
    }
  }
}

// 更新时间段标题
async function updateTimeTitle(data) {
  const { 
    id,           // 记录ID
    startTime,    // 开始时间
    endTime,      // 结束时间
    title,        // 标题
    subtitle      // 副标题
  } = data
  
  // 验证ID是否存在
  if (!id) {
    return {
      success: false,
      error: '记录ID不能为空'
    }
  }
  
  try {
    // 检查记录是否存在
    const titleResult = await db.collection('timeTitles').doc(id).get()
    if (!titleResult.data) {
      return {
        success: false,
        error: '要更新的记录不存在'
      }
    }
    
    // 构建更新对象
    const updateData = {
      updateTime: db.serverDate()
    }
    
    if (startTime !== undefined) {
      // 验证时间格式
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
      if (!timeRegex.test(startTime)) {
        return {
          success: false,
          error: '开始时间格式不正确，应为 HH:MM 格式'
        }
      }
      updateData.startTime = startTime
    }
    
    if (endTime !== undefined) {
      // 验证时间格式
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
      if (!timeRegex.test(endTime)) {
        return {
          success: false,
          error: '结束时间格式不正确，应为 HH:MM 格式'
        }
      }
      updateData.endTime = endTime
    }
    
    if (title !== undefined) {
      if (!title.trim()) {
        return {
          success: false,
          error: '标题不能为空'
        }
      }
      updateData.title = title.trim()
    }
    
    if (subtitle !== undefined) {
      updateData.subtitle = subtitle.trim()
    }
    
    // 如果更新了时间，检查是否与其他时间段重叠
    if (startTime !== undefined || endTime !== undefined) {
      const newStartTime = startTime || titleResult.data.startTime
      const newEndTime = endTime || titleResult.data.endTime
      
      const startMinutes = convertTimeToMinutes(newStartTime)
      const endMinutes = convertTimeToMinutes(newEndTime)
      
      // 检查时间范围是否有效
      if (startMinutes >= endMinutes && endMinutes !== 0) {
        return {
          success: false,
          error: '结束时间必须晚于开始时间'
        }
      }
      
      // 检查是否与其他时间段重叠
      const existingTitles = await db.collection('timeTitles')
        .where({
          _id: _.neq(id) // 排除当前记录
        })
        .get()
      
      for (const item of existingTitles.data) {
        const itemStartMinutes = convertTimeToMinutes(item.startTime)
        const itemEndMinutes = convertTimeToMinutes(item.endTime)
        
        // 检查重叠情况
        if (isTimeOverlap(startMinutes, endMinutes, itemStartMinutes, itemEndMinutes)) {
          return {
            success: false,
            error: `时间段与现有时间段 "${item.title}" (${item.startTime}-${item.endTime}) 重叠`
          }
        }
      }
    }
    
    // 更新记录
    await db.collection('timeTitles').doc(id).update({
      data: updateData
    })
    
    // 获取更新后的记录
    const updatedTitle = await db.collection('timeTitles').doc(id).get()
    
    return {
      success: true,
      data: updatedTitle.data,
      message: '更新成功'
    }
  } catch (err) {
    return {
      success: false,
      error: err.message || '更新时间段标题失败'
    }
  }
}

// 删除时间段标题
async function deleteTimeTitle(data) {
  const { id } = data
  
  // 验证ID是否存在
  if (!id) {
    return {
      success: false,
      error: '记录ID不能为空'
    }
  }
  
  try {
    // 检查记录是否存在
    const titleResult = await db.collection('timeTitles').doc(id).get()
    if (!titleResult.data) {
      return {
        success: false,
        error: '要删除的记录不存在'
      }
    }
    
    // 删除记录
    await db.collection('timeTitles').doc(id).remove()
    
    return {
      success: true,
      deletedId: id,
      message: '删除成功'
    }
  } catch (err) {
    return {
      success: false,
      error: err.message || '删除时间段标题失败'
    }
  }
}

// 获取所有时间段标题
async function getAllTimeTitles() {
  try {
    // 获取所有记录，按开始时间排序
    const result = await db.collection('timeTitles')
      .orderBy('startTime', 'asc')
      .get()
    
    return {
      success: true,
      data: result.data
    }
  } catch (err) {
    return {
      success: false,
      error: err.message || '获取时间段标题失败'
    }
  }
}

// 获取当前时间对应的标题
async function getCurrentTitle() {
  try {
    // 获取所有时间段标题
    const result = await db.collection('timeTitles').get()
    
    // 获取当前时间
    const now = new Date()
    // 使用云函数所在服务器的时区
    // 如果需要使用中国时区，需要进行时区调整
    const chinaTime = new Date(now.getTime() + (8 * 60 * 60 * 1000)) // 调整为东八区
    const hours = chinaTime.getUTCHours()
    const minutes = chinaTime.getUTCMinutes()
    const currentMinutes = hours * 60 + minutes
    
    console.log(`当前时间: ${hours}:${minutes}, 转换为分钟: ${currentMinutes}`)
    
    // 查找当前时间所在的时间段
    let currentTitle = null
    
    for (const item of result.data) {
      const startMinutes = convertTimeToMinutes(item.startTime)
      const endMinutes = convertTimeToMinutes(item.endTime)
      
      console.log(`检查时间段: ${item.title}, ${item.startTime}(${startMinutes}分钟)-${item.endTime}(${endMinutes}分钟)`)
      
      // 处理跨天的情况
      if (endMinutes < startMinutes) {
        // 例如 23:00-06:00
        if (currentMinutes >= startMinutes || currentMinutes < endMinutes) {
          console.log(`匹配跨天时间段: ${item.title}`)
          currentTitle = item
          break
        }
      } else {
        // 正常情况，例如 06:00-12:00
        if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
          console.log(`匹配正常时间段: ${item.title}`)
          currentTitle = item
          break
        }
      }
    }
    
    // 如果没有找到匹配的时间段，返回默认标题
    if (!currentTitle) {
      console.log('未找到匹配的时间段，返回默认标题')
      return {
        success: true,
        data: {
          title: '欢迎使用',
          subtitle: '祝您有个美好的一天'
        },
        isDefault: true
      }
    }
    
    console.log(`返回匹配的时间段标题: ${currentTitle.title}`)
    return {
      success: true,
      data: {
        _id: currentTitle._id,
        title: currentTitle.title,
        subtitle: currentTitle.subtitle,
        startTime: currentTitle.startTime,
        endTime: currentTitle.endTime
      }
    }
  } catch (err) {
    console.error('获取当前标题出错:', err)
    return {
      success: false,
      error: err.message || '获取当前标题失败'
    }
  }
}

// 辅助函数：将时间字符串转换为分钟数
function convertTimeToMinutes(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number)
  return hours * 60 + minutes
}

// 辅助函数：检查两个时间段是否重叠
function isTimeOverlap(start1, end1, start2, end2) {
  // 处理跨天的情况
  if (end1 < start1) end1 += 24 * 60 // 加一天的分钟数
  if (end2 < start2) end2 += 24 * 60
  
  // 检查重叠
  return (start1 < end2 && start2 < end1)
}