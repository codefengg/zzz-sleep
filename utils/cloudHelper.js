/**
 * 云函数调用助手
 * 统一处理云函数的调用、日志记录和错误处理
 */

// 调用云函数并记录日志
const callFunction = (name, data) => {
  // 打印请求信息
  console.group(`🚀 云函数请求: ${name}`);
  console.log('参数:', data);
  console.groupEnd();
  
  return wx.cloud.callFunction({
    name,
    data
  })
  .then(res => {
    // 打印成功响应
    console.group(`✅ 云函数响应: ${name}`);
    console.log('结果:', res.result);
    console.groupEnd();
    return res;
  })
  .catch(err => {
    // 打印错误信息
    console.group(`❌ 云函数错误: ${name}`);
    console.error('错误:', err);
    console.groupEnd();
    throw err;
  });
};

// 导出方法
module.exports = {
  callFunction
}; 