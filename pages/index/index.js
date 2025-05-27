// 获取导航栏高度
const menuButton = wx.getMenuButtonBoundingClientRect();
const navBarHeight = menuButton.top + menuButton.height;

Page({
  data: {
    // 后续补充音频列表、播放器等数据
    navBarHeight: navBarHeight,
  },
  onLoad() {
  }
}) 