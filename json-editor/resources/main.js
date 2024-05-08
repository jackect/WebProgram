const container = document.getElementById('jsoneditor')
const jsonkey = 'jsonv'
const options = {
  mode: 'code',
  modes: ['code', 'form', 'text', 'tree', 'view', 'preview'], // allowed modes
  onChange: () => {
    try {
      localforage.setItem(jsonkey,editor.get())
    } catch (e) {}
  },
}

const mode = window.location.search.substring(1)
const editor = new JSONEditor(container, options)
async function init() {
  let json = ''
  try {
    try{
      json = await localforage.getItem(jsonkey) || json
    }catch(e) {
     
    }
  } catch (e) { }
  if (json) { 
    editor.set(json)
  } else {
    editor.setText(json)
  }
}
init()

editor.focus()
// 设置JSONEditor实例
window.JSONEditorInstance = editor

//加载时设置默认字体大小
var font = parseInt(localStorage.getItem('jsonedit_fontsize'));
if (font < 0) {
	font = 15;
  localStorage.setItem('jsonedit_fontsize', font);
}
document.querySelector('.ace_editor').style.fontSize = font + 'px';

!function(){
  // 先给jsoneditor.min.js打补丁，将__webpack_require__绑定到window._wp上。以下增强jsoneditor的代码参考https://sunzsh.github.io/json/
  var _container = JSONEditorInstance.modeSwitcher.dom.container;
  var appendBtn = function (text, title, marginLeft = '6px') {
      const btnBox = document.createElement('button');
      btnBox.type = 'button';
      btnBox.className = 'jsoneditor-modes jsoneditor-separator';
      btnBox.textContent = text;
      if (title) {
          btnBox.title = title;
      }
      if (marginLeft) {
          btnBox.style.marginLeft = marginLeft;
      }

      var btnFrame = document.createElement('div');
      btnFrame.className = 'jsoneditor-modes';
      btnFrame.style.position = 'relative';
      btnFrame.appendChild(btnBox);
      _container.appendChild(btnFrame);
      return btnBox;
  };
  // 顶部菜单按钮-历史记录
  const btnHistory = appendBtn('历史 ▾', '最后5次保存过的历史', '10px');
  btnHistory.onclick = async (e) => {
      var originItems = await cacheDao.getItem()
      var historyItems = [];
      for (let i = 0; i < originItems?.length; i++) {
          let curItem = originItems[i]
          let item = {
              text: beautifyTime(curItem.timestamp),
              title: beautifyTime(curItem.timestamp),
              click: () => {
                  try {
                      window.JSONEditorInstance?.set(curItem.value)
                  } catch (err) {
                  }
              }
          };
          item.className = 'jsoneditor-type-modes';
          historyItems.push(item);
      }
      if (historyItems.length > 0) {
        var menu = _wp(897).x;
        new menu(historyItems).show(btnHistory, _container);
      } else {
        toast('没有历史');
      }
      e.target.blur();
  };
  appendBtn('保存', '保存当前内容到历史记录').onclick = (e) => {
      try {
          let v = window.JSONEditorInstance.get()
          if (JSON.stringify(v) === '{}') {
              // 空数据不处理
              toast('无数据')
              return
          }
          cacheDao.setItem(v)
          toast('保存成功')
      } catch (err) {
          toast('格式异常')
      }
      e.target.blur()
  }
  // 顶部菜单按钮-字体放大
  const FONT_SIZE_KEY = 'jsonedit_fontsize'
  appendBtn('T+', '放大字体', '10px').onclick = (e) => {
      var font = parseInt(localStorage.getItem(FONT_SIZE_KEY));
      if (!font) {
          font = 14;
      }
      font += 2;
      localStorage.setItem(FONT_SIZE_KEY, font);
      document.querySelector('.ace_editor').style.fontSize = font + 'px';
      e.target.blur()
  };
  // 顶部菜单按钮-字体缩小
  appendBtn('T-', '缩小字体').onclick = (e) => {
      var font = parseInt(localStorage.getItem(FONT_SIZE_KEY));
      if (!font) {
          font = 20;
      }
      if (font <= 12) {
          return;
      }
      font -= 2;
      localStorage.setItem(FONT_SIZE_KEY, font);
      document.querySelector('.ace_editor').style.fontSize = font + 'px';
      e.target.blur()
  };}()
