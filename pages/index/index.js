// 获取导航栏高度
const menuButton = wx.getMenuButtonBoundingClientRect();
const navBarHeight = menuButton.top + menuButton.height;

// 计算音频列表项的宽度
let itemWidth = 0;
const windowInfo = wx.getWindowInfo(); // 直接同步获取
const screenWidth = windowInfo.windowWidth; // 使用可用窗口宽度
const windowHeight = windowInfo.windowHeight; // 获取窗口高度

// 计算rpx与px的比例（750rpx = 屏幕宽度px）
const ratio = 750 / screenWidth;
const paddingPx = (48 * 2) / ratio;  // 左右padding换算为px
const itemSpacePx = 56 / ratio;      // 间距换算为px

itemWidth = (screenWidth - paddingPx - itemSpacePx) / 2;

const audioList = [
  {
    "id": "001",
    "name": "绵绵细雨",
    "icon": "/assets/mock-icons/fine-rain.png",
    "listImage": "",
    "backgroundImage": "/assets/mock-back/fine-rain-back.png",
    "audioUrl": ""
  },
  {
    "id": "002",
    "name": "倾盆大雨",
    "icon": "/assets/mock-icons/thunderstorm.png",
    "listImage": "",
    "backgroundImage": "/assets/mock-back/thunderstorm-back.png",
    "audioUrl": ""
  },
  {
    "id": "003",
    "name": "浪花涌动",
    "icon": "/assets/mock-icons/wave.png",
    "listImage": "",
    "backgroundImage": "/assets/mock-back/wave-back.png",
    "audioUrl": ""
  },
  {
    "id": "004",
    "name": "篝火燃烧",
    "icon": "/assets/mock-icons/campfire.png",
    "listImage": "",
    "backgroundImage": "/assets/mock-back/campfire-back.png",
    "audioUrl": ""
  },
  {
    "id": "005",
    "name": "稻田乐章",
    "icon": "/assets/mock-icons/rice-field.png",
    "listImage": "",
    "backgroundImage": "/assets/mock-back/rice-field-back.png",
    "audioUrl": ""
  }
];

Page({
  data: {
    navBarHeight: navBarHeight,
    audioList: audioList,
    itemWidth: itemWidth // 直接使用计算好的值
  },

  onLoad() {
    // 页面初始化逻辑
  },

  // 点击音频项
  onTapAudioItem(e) {
    const audioId = e.currentTarget.dataset.id;
    const audioItem = this.data.audioList.find(item => item.id === audioId);

    if (audioItem) {
      console.log('点击了音频项：', audioItem.name);
      // 播放音频的逻辑后续实现
    }
  }
}) 