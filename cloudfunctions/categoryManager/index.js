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
      return getCategories(event)
    case 'add':
      return addCategory(event)
    case 'update':
      return updateCategory(event)
    case 'delete':
      return deleteCategory(event)
    default:
      return {
        success: false,
        error: '未知的操作类型'
      }
  }
}

// 获取分类列表
async function getCategories(event) {
  try {
    const categoriesResult = await db.collection('category')
      .orderBy('order', 'asc')
      .get()
    
    return {
      success: true,
      data: categoriesResult.data
    }
  } catch (err) {
    return {
      success: false,
      error: err.message || '获取分类失败'
    }
  }
}

// 添加分类
async function addCategory(event) {
  const { name, parentId, order, iconUrl } = event
  
  // 输入验证
  if (!name || name.trim() === '') {
    return {
      success: false,
      error: '分类名称不能为空'
    }
  }
  
  if (order !== undefined && (isNaN(order) || !Number.isInteger(Number(order)))) {
    return {
      success: false,
      error: '排序序号必须是整数'
    }
  }
  
  const orderValue = order !== undefined ? Number(order) : 0
  
  try {
    // 如果有parentId，验证父分类是否存在且为一级分类
    if (parentId) {
      const parentResult = await db.collection('category').doc(parentId).get()
      
      // 检查父分类是否存在
      if (!parentResult.data) {
        return {
          success: false,
          error: '父分类不存在'
        }
      }
      
      // 检查父分类是否已经是二级分类
      if (parentResult.data.parentId) {
        return {
          success: false,
          error: '不能创建三级分类，父分类已经是二级分类'
        }
      }
    }
    
    // 添加分类
    const newCategory = {
      name: name.trim(),
      order: orderValue,
      iconUrl: iconUrl || '',
      createTime: db.serverDate()
    }
    
    // 如果有父分类ID，则添加到新分类中
    if (parentId) {
      newCategory.parentId = parentId
    }
    
    const result = await db.collection('category').add({
      data: newCategory
    })
    
    // 获取新创建的分类完整信息
    const newCategoryData = await db.collection('category').doc(result._id).get()
    
    return {
      success: true,
      data: newCategoryData.data
    }
  } catch (err) {
    return {
      success: false,
      error: err.message || '添加分类失败'
    }
  }
}

// 更新分类
async function updateCategory(event) {
  const { id, name, parentId, order, iconUrl } = event
  
  // 验证ID是否存在
  if (!id) {
    return {
      success: false,
      error: '分类ID不能为空'
    }
  }
  
  // 验证至少有一个要更新的字段
  if (!name && parentId === undefined && order === undefined && iconUrl === undefined) {
    return {
      success: false,
      error: '至少需要提供一个要更新的字段'
    }
  }
  
  // 验证order格式
  if (order !== undefined && (isNaN(order) || !Number.isInteger(Number(order)))) {
    return {
      success: false,
      error: '排序序号必须是整数'
    }
  }
  
  try {
    // 检查分类是否存在
    const categoryResult = await db.collection('category').doc(id).get()
    if (!categoryResult.data) {
      return {
        success: false,
        error: '要更新的分类不存在'
      }
    }
    
    // 如果要更新parentId，验证父分类是否存在且为一级分类
    if (parentId !== undefined) {
      // 如果设置为空字符串，表示将其设为一级分类
      if (parentId === '') {
        // 无需验证，直接将其设为一级分类即可
      } else {
        const parentResult = await db.collection('category').doc(parentId).get()
        
        // 检查父分类是否存在
        if (!parentResult.data) {
          return {
            success: false,
            error: '父分类不存在'
          }
        }
        
        // 检查父分类是否已经是二级分类
        if (parentResult.data.parentId) {
          return {
            success: false,
            error: '不能创建三级分类，父分类已经是二级分类'
          }
        }
        
        // 检查是否形成循环引用
        if (parentId === id) {
          return {
            success: false,
            error: '不能将分类自身设为父分类'
          }
        }
      }
    }
    
    // 构建更新对象
    const updateData = {}
    
    if (name !== undefined && name.trim() !== '') {
      updateData.name = name.trim()
    }
    
    if (iconUrl !== undefined) {
      updateData.iconUrl = iconUrl
    }
    
    if (parentId !== undefined) {
      if (parentId === '') {
        // 删除parentId字段，将其设为一级分类
        await db.collection('category').doc(id).update({
          data: {
            parentId: db.command.remove()
          }
        })
      } else {
        updateData.parentId = parentId
      }
    }
    
    if (order !== undefined) {
      updateData.order = Number(order)
    }
    
    // 如果有其他字段要更新，进行更新
    if (Object.keys(updateData).length > 0) {
      await db.collection('category').doc(id).update({
        data: updateData
      })
    }
    
    // 获取更新后的分类信息
    const updatedCategory = await db.collection('category').doc(id).get()
    
    return {
      success: true,
      data: updatedCategory.data
    }
  } catch (err) {
    return {
      success: false,
      error: err.message || '更新分类失败'
    }
  }
}

// 删除分类
async function deleteCategory(event) {
  const { id } = event
  
  // 验证ID是否存在
  if (!id) {
    return {
      success: false,
      error: '分类ID不能为空'
    }
  }
  
  try {
    // 检查分类是否存在
    const categoryResult = await db.collection('category').doc(id).get()
    if (!categoryResult.data) {
      return {
        success: false,
        error: '要删除的分类不存在'
      }
    }
    
    // 如果是一级分类，先删除其所有子分类
    if (!categoryResult.data.parentId) {
      // 查找所有子分类
      const childrenResult = await db.collection('category')
        .where({
          parentId: id
        })
        .get()
      
      // 如果有子分类，先删除子分类
      if (childrenResult.data && childrenResult.data.length > 0) {
        // 获取所有子分类ID
        const childrenIds = childrenResult.data.map(child => child._id)
        
        // 一次删除最多100条记录，如果超过需要分批删除
        const batchSize = 100
        for (let i = 0; i < childrenIds.length; i += batchSize) {
          const batchIds = childrenIds.slice(i, i + batchSize)
          await db.collection('category').where({
            _id: _.in(batchIds)
          }).remove()
        }
      }
    }
    
    // 删除当前分类
    await db.collection('category').doc(id).remove()
    
    return {
      success: true,
      deletedId: id
    }
  } catch (err) {
    return {
      success: false,
      error: err.message || '删除分类失败'
    }
  }
} 