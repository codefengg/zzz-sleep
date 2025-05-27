// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: 'cloud1-7g7ul2l734c0683b' })
const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const { action } = event
  
  // 根据action参数执行不同操作
  switch (action) {
    case 'get':
      return getMusicList(event)
    case 'getAll':
      return getAllMusic()
    case 'getById':
      return getMusicById(event)
    case 'add':
      return addMusic(event)
    case 'update':
      return updateMusic(event)
    case 'delete':
      return deleteMusic(event)
    case 'updateOrder':
      return updateMusicOrder(event)
    case 'batchUpdateOrder':
      return batchUpdateMusicOrder(event)
    case 'reorderCategory':
      return reorderCategoryMusic(event)
    case 'initializeOrders':
      return initializeOrderValues(event)
    default:
      return {
        success: false,
        error: '未知的操作类型'
      }
  }
}

// 获取音乐列表
async function getMusicList(event) {
  const { categoryId } = event
  
  try {
    let query = db.collection('audios')
    
    // 如果有分类ID，则按分类筛选
    if (categoryId) {
      // 首先检查这个分类ID是一级分类还是二级分类
      const categoryResult = await db.collection('category').doc(categoryId).get()
        .catch(() => ({ data: null })) // 捕获可能的错误
      
      if (categoryResult.data) {
        const category = categoryResult.data
        
        // 如果没有parentId，说明是一级分类
        if (!category.parentId) {
          console.log('查询一级分类:', categoryId)
          
          // 查找所有以该分类为父级的二级分类
          const subCategoriesResult = await db.collection('category')
            .where({ parentId: categoryId })
            .get()
          
          const subCategoryIds = subCategoriesResult.data.map(item => item._id)
          
          console.log('一级分类下的二级分类:', subCategoryIds)
          
          // 构建查询条件：直接关联到该一级分类，或关联到其下任一二级分类
          if (subCategoryIds.length > 0) {
            query = query.where(_.or([
              { categoryId: categoryId },
              { categoryId: _.in(subCategoryIds) }
            ]))
          } else {
            // 如果没有二级分类，只查询直接关联到该一级分类的音乐
            query = query.where({ categoryId: categoryId })
          }
        } else {
          // 如果有parentId，说明是二级分类，直接查询关联到该分类的音乐
          console.log('查询二级分类:', categoryId)
          query = query.where({ categoryId: categoryId })
        }
      } else {
        // 分类不存在，仍然按原来的方式查询
        console.log('分类不存在，按ID直接查询:', categoryId)
        query = query.where({ categoryId: categoryId })
      }
      
      // 按分类内排序值排序
      query = query.orderBy('categoryOrder', 'asc')
    } else {
      // 没有指定分类，按全局排序值排序
      query = query.orderBy('globalOrder', 'asc')
    }
    
    const result = await query.get()
    
    return {
      success: true,
      data: result.data
    }
  } catch (err) {
    console.error('获取音乐列表失败:', err)
    return {
      success: false,
      error: err.message || '获取音乐列表失败'
    }
  }
}

// 获取所有音乐
async function getAllMusic() {
  try {
    // 直接获取所有音乐（因为数据不超过100条）
    const result = await db.collection('audios')
      .orderBy('globalOrder', 'asc')
      .get();
    
    return {
      success: true,
      data: result.data
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || '获取所有音乐失败'
    };
  }
}

// 获取音乐列表
async function getMusic(event) {
  const { categoryId, limit = 20, skip = 0 } = event
  
  try {
    let query = db.collection('audios')
    
    // 如果指定了分类ID，则按分类筛选
    if (categoryId) {
      // 首先检查这个分类ID是一级分类还是二级分类
      const categoryResult = await db.collection('category').doc(categoryId).get()
        .catch(() => ({ data: null })); // 捕获可能的错误
      
      if (categoryResult.data) {
        const category = categoryResult.data;
        
        // 如果没有parentId，说明是一级分类
        if (!category.parentId) {
          // 查找所有以该分类为父级的二级分类
          const subCategoriesResult = await db.collection('category')
            .where({ parentId: categoryId })
            .get();
          
          const subCategoryIds = subCategoriesResult.data.map(item => item._id);
          
          // 构建查询条件：直接关联到该一级分类，或关联到其下任一二级分类
          if (subCategoryIds.length > 0) {
            query = query.where(_.or([
              { categoryId: categoryId },
              { categoryId: _.in(subCategoryIds) }
            ]));
          } else {
            // 如果没有二级分类，只查询直接关联到该一级分类的音乐
            query = query.where({ categoryId: categoryId });
          }
        } else {
          // 如果有parentId，说明是二级分类，直接查询关联到该分类的音乐
          query = query.where({ categoryId: categoryId });
        }
      } else {
        // 分类不存在，返回空结果
        return {
          success: true,
          data: [],
          total: 0,
          limit,
          skip
        };
      }
    }
    
    // 获取总数
    const countResult = await query.count();
    const total = countResult.total;
    
    // 获取音乐列表，按创建时间倒序排列
    const musicResult = await query
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(limit)
      .get();
    
    return {
      success: true,
      data: musicResult.data,
      total,
      limit,
      skip
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || '获取音乐列表失败'
    };
  }
}

// 添加音乐
async function addMusic(event) {
  const { 
    audioUrl,       // 音乐链接
    name,           // 音乐名称
    backgroundUrl,  // 音乐背景图
    iconUrl,        // 音乐播放图标
    listImageUrl,   // 音乐列表图
    categoryId      // 分类ID
  } = event
  
  // 输入验证
  if (!audioUrl || audioUrl.trim() === '') {
    return {
      success: false,
      error: '音乐链接不能为空'
    }
  }
  
  if (!name || name.trim() === '') {
    return {
      success: false,
      error: '音乐名称不能为空'
    }
  }
  
  if (!categoryId) {
    return {
      success: false,
      error: '分类ID不能为空'
    }
  }
  
  try {
    console.log('开始添加音乐，参数:', JSON.stringify(event))
    
    // 计算新的排序值
    const { globalOrder, categoryOrder } = await calculateNewOrderValues(categoryId)
    console.log('计算得到的排序值:', { globalOrder, categoryOrder })
    
    // 添加音乐记录
    const newMusic = {
      audioUrl: audioUrl.trim(),
      name: name.trim(),
      backgroundUrl: backgroundUrl || '',
      iconUrl: iconUrl || '',
      listImageUrl: listImageUrl || '',
      categoryId,
      createTime: db.serverDate(),
      playCount: 0,  // 初始播放次数为0
      globalOrder: parseInt(globalOrder),   // 确保是整数
      categoryOrder: parseInt(categoryOrder)  // 确保是整数
    }
    
    console.log('准备添加的音乐数据:', JSON.stringify(newMusic))
    
    const result = await db.collection('audios').add({
      data: newMusic
    })
    
    // 获取新添加的音乐完整信息
    const newMusicData = await db.collection('audios').doc(result._id).get()
    
    return {
      success: true,
      data: newMusicData.data
    }
  } catch (err) {
    console.error('添加音乐失败:', err)
    return {
      success: false,
      error: `添加音乐失败: ${err.message || '未知错误'}`
    }
  }
}

// 更新音乐
async function updateMusic(event) {
  const { id, ...updateData } = event
  
  // 验证ID是否存在
  if (!id) {
    return {
      success: false,
      error: '音乐ID不能为空'
    }
  }
  
  // 移除不允许直接更新的字段
  delete updateData.action
  delete updateData.createTime
  delete updateData._id
  delete updateData.globalOrder
  delete updateData.categoryOrder
  
  // 验证至少有一个要更新的字段
  if (Object.keys(updateData).length === 0) {
    return {
      success: false,
      error: '没有提供要更新的字段'
    }
  }
  
  try {
    // 检查音乐是否存在
    const musicResult = await db.collection('audios').doc(id).get()
    if (!musicResult.data) {
      return {
        success: false,
        error: '要更新的音乐不存在'
      }
    }
    
    // 如果更新了分类，需要重新计算分类内排序值
    if (updateData.categoryId && updateData.categoryId !== musicResult.data.categoryId) {
      const { categoryOrder } = await calculateNewOrderValues(updateData.categoryId)
      updateData.categoryOrder = categoryOrder
    }
    
    // 更新音乐记录
    await db.collection('audios').doc(id).update({
      data: updateData
    })
    
    // 获取更新后的音乐信息
    const updatedMusic = await db.collection('audios').doc(id).get()
    
    return {
      success: true,
      data: updatedMusic.data
    }
  } catch (err) {
    return {
      success: false,
      error: err.message || '更新音乐失败'
    }
  }
}

// 删除音乐
async function deleteMusic(event) {
  const { id } = event
  
  // 验证ID是否存在
  if (!id) {
    return {
      success: false,
      error: '音乐ID不能为空'
    }
  }
  
  try {
    // 检查音乐是否存在
    const musicResult = await db.collection('audios').doc(id).get()
    if (!musicResult.data) {
      return {
        success: false,
        error: '要删除的音乐不存在'
      }
    }
    
    // 删除音乐记录
    await db.collection('audios').doc(id).remove()
    
    // 注意：这里只删除了数据库中的记录，并没有从云存储中删除实际的音频文件
    // 如果需要同时删除云存储中的文件，还需要调用云存储的删除API
    
    return {
      success: true,
      deletedId: id
    }
  } catch (err) {
    return {
      success: false,
      error: err.message || '删除音乐失败'
    }
  }
}

// 计算新的排序值
async function calculateNewOrderValues(categoryId) {
  try {
    console.log('开始计算排序值，分类ID:', categoryId)
    
    // 默认排序值
    let globalOrder = 10
    let categoryOrder = 10
    
    try {
      // 获取当前最大的全局排序值
      const globalResult = await db.collection('audios')
        .orderBy('globalOrder', 'desc')
        .limit(1)
        .get()
      
      console.log('全局排序查询结果:', globalResult.data)
      
      if (globalResult.data && globalResult.data.length > 0) {
        const currentGlobalOrder = globalResult.data[0].globalOrder
        
        // 确保是数字类型
        if (typeof currentGlobalOrder === 'number' && !isNaN(currentGlobalOrder)) {
          globalOrder = currentGlobalOrder + 10
        } else {
          console.log('全局排序值不是数字:', currentGlobalOrder)
        }
      } else {
        console.log('没有找到全局排序值，使用默认值')
      }
    } catch (globalErr) {
      console.error('获取全局排序值失败:', globalErr)
    }
    
    try {
      // 获取当前分类内最大的排序值
      const categoryResult = await db.collection('audios')
        .where({ categoryId })
        .orderBy('categoryOrder', 'desc')
        .limit(1)
        .get()
      
      console.log('分类排序查询结果:', categoryResult.data)
      
      if (categoryResult.data && categoryResult.data.length > 0) {
        const currentCategoryOrder = categoryResult.data[0].categoryOrder
        
        // 确保是数字类型
        if (typeof currentCategoryOrder === 'number' && !isNaN(currentCategoryOrder)) {
          categoryOrder = currentCategoryOrder + 10
        } else {
          console.log('分类排序值不是数字:', currentCategoryOrder)
        }
      } else {
        console.log('没有找到分类排序值，使用默认值')
      }
    } catch (categoryErr) {
      console.error('获取分类排序值失败:', categoryErr)
    }
    
    console.log('计算得到的排序值:', { globalOrder, categoryOrder })
    
    // 确保返回的是数字
    return { 
      globalOrder: parseInt(globalOrder), 
      categoryOrder: parseInt(categoryOrder) 
    }
  } catch (err) {
    console.error('计算排序值失败:', err)
    // 返回默认值
    return { globalOrder: 1000, categoryOrder: 1000 }
  }
}

// 更新单个音乐的排序
async function updateMusicOrder(event) {
  const { id, orderType, order } = event
  
  // 验证参数
  if (!id) {
    return {
      success: false,
      error: '音乐ID不能为空'
    }
  }
  
  if (!orderType || !['globalOrder', 'categoryOrder'].includes(orderType)) {
    return {
      success: false,
      error: '排序类型必须是 globalOrder 或 categoryOrder'
    }
  }
  
  if (order === undefined || !Number.isInteger(order) || order < 0) {
    return {
      success: false,
      error: '排序值必须是非负整数'
    }
  }
  
  try {
    // 检查音乐是否存在
    const musicResult = await db.collection('audios').doc(id).get()
    if (!musicResult.data) {
      return {
        success: false,
        error: '要更新的音乐不存在'
      }
    }
    
    // 更新排序值
    const updateData = {}
    updateData[orderType] = order
    
    await db.collection('audios').doc(id).update({
      data: updateData
    })
    
    return {
      success: true,
      message: '排序更新成功'
    }
  } catch (err) {
    console.error('更新音乐排序失败:', err)
    return {
      success: false,
      error: err.message || '更新音乐排序失败'
    }
  }
}

// 批量更新音乐排序
async function batchUpdateMusicOrder(event) {
  const { items, orderType } = event
  
  // 验证参数
  if (!items || !Array.isArray(items) || items.length === 0) {
    return {
      success: false,
      error: '排序数据不能为空且必须是数组'
    }
  }
  
  if (!orderType || !['globalOrder', 'categoryOrder'].includes(orderType)) {
    return {
      success: false,
      error: '排序类型必须是 globalOrder 或 categoryOrder'
    }
  }
  
  // 验证数组中的每个项目
  for (const item of items) {
    if (!item.id || item.order === undefined || !Number.isInteger(item.order) || item.order < 0) {
      return {
        success: false,
        error: '排序数据格式不正确，每项必须包含id和非负整数order'
      }
    }
  }
  
  try {
    // 使用批量写入来更新多个文档
    const tasks = items.map(item => {
      const updateData = {}
      updateData[orderType] = item.order
      
      return db.collection('audios').doc(item.id).update({
        data: updateData
      })
    })
    
    // 并行执行所有更新操作
    await Promise.all(tasks)
    
    return {
      success: true,
      message: '批量排序更新成功',
      updatedCount: items.length
    }
  } catch (err) {
    console.error('批量更新音乐排序失败:', err)
    return {
      success: false,
      error: err.message || '批量更新音乐排序失败'
    }
  }
}

// 重新排序分类内的音乐
async function reorderCategoryMusic(event) {
  const { categoryId, startOrder = 10, increment = 10 } = event
  
  if (!categoryId) {
    return {
      success: false,
      error: '分类ID不能为空'
    }
  }
  
  try {
    // 获取分类内所有音乐
    const result = await db.collection('audios')
      .where({ categoryId })
      .orderBy('categoryOrder', 'asc')
      .get()
    
    if (result.data.length === 0) {
      return {
        success: true,
        message: '分类内没有音乐需要重排序',
        updatedCount: 0
      }
    }
    
    // 重新分配排序值
    const tasks = result.data.map((item, index) => {
      const newOrder = startOrder + (index * increment)
      
      return db.collection('audios').doc(item._id).update({
        data: {
          categoryOrder: newOrder
        }
      })
    })
    
    // 并行执行所有更新操作
    await Promise.all(tasks)
    
    return {
      success: true,
      message: '分类内音乐重排序成功',
      updatedCount: result.data.length
    }
  } catch (err) {
    console.error('重排序分类内音乐失败:', err)
    return {
      success: false,
      error: err.message || '重排序分类内音乐失败'
    }
  }
}

// 初始化所有音乐的排序值
async function initializeOrderValues(event) {
  const { globalStartOrder = 10, categoryStartOrder = 10, increment = 10 } = event
  
  try {
    // 获取所有音乐
    const result = await db.collection('audios').get()
    
    if (result.data.length === 0) {
      return {
        success: true,
        message: '没有音乐需要初始化排序值',
        updatedCount: 0
      }
    }
    
    // 按分类分组
    const categoryGroups = {}
    result.data.forEach(item => {
      if (!categoryGroups[item.categoryId]) {
        categoryGroups[item.categoryId] = []
      }
      categoryGroups[item.categoryId].push(item)
    })
    
    // 更新全局排序和分类内排序
    const tasks = []
    let globalIndex = 0
    
    // 遍历每个分类
    for (const categoryId in categoryGroups) {
      const items = categoryGroups[categoryId]
      
      // 遍历分类内的每个音乐
      items.forEach((item, categoryIndex) => {
        const globalOrder = globalStartOrder + (globalIndex * increment)
        const categoryOrder = categoryStartOrder + (categoryIndex * increment)
        
        tasks.push(db.collection('audios').doc(item._id).update({
          data: {
            globalOrder,
            categoryOrder
          }
        }))
        
        globalIndex++
      })
    }
    
    // 并行执行所有更新操作
    await Promise.all(tasks)
    
    return {
      success: true,
      message: '音乐排序值初始化成功',
      updatedCount: result.data.length
    }
  } catch (err) {
    console.error('初始化音乐排序值失败:', err)
    return {
      success: false,
      error: err.message || '初始化音乐排序值失败'
    }
  }
} 