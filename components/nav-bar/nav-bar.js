// 获取胶囊按钮位置信息
const menuButton = wx.getMenuButtonBoundingClientRect();

const paddingTop = menuButton.top;
const height = menuButton.height;

Component({
  properties: {
    title: {
      type: String,
      value: ''
    }
  },
  data: {
    paddingTop,
    height,
  }
}) 