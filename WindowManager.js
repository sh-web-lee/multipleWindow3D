

class WindowManager {

  #windows;
  #count;
  #id;
  #winData;
  #winChangeCallback;
  #winShapeChangeCallback;

  constructor() {
    let _this = this;

    // event listener for when localstorage is changed from another window
    addEventListener('storage', (event) => {
      if (event.key === "windows") {
        let newWindows = JSON.parse(event.newValue)
        let winChange = _this.#didWindowsChange(_this.#windows, newWindows);

        _this.#windows = newWindows;
        if (winChange) {
          if (_this.#winChangeCallback) _this.#winChangeCallback();
        }
      }
    })

    // event listener for when current window is close
    window.addEventListener("beforeunload", function(e) {
      _this.windowVisibilityChange();
    })

  }


  #didWindowsChange(oldWins, newWins) {
    if (oldWins.length !== newWins.length) {
      return true
    } else {
      let hasChange = false;
      for (let i = 0; i < newWins.length; i ++) {
        if (oldWins[i].id !== newWins[i].id) {
          hasChange = true
        }
      }

      return hasChange;
    }
  }

  init(metaData) {
    this.#windows = JSON.parse(localStorage.getItem("windows")) || [];
    this.#count = localStorage.getItem("count") || 0;
    this.#count++;

    this.#id = this.#count;
    let shape = this.getWinShape()
    this.#winData = {
      id: this.#id,
      shape,
      metaData
    }
    this.#windows.push(this.#winData);
    this.updateWindowsLocalStorage();
    this.updateCountLocalStorage();
  }

  windowVisibilityChange() {
    let index = this.getWindowIndexFromId(this.#id);

    // remove this window from the list and update local storage
    // this.#count--;
    // if (this.#count < 0) this.#count = 0;
    this.#windows.splice(index, 1);
    // this.updateCountLocalStorage();
    this.updateWindowsLocalStorage();
  }

  getWinShape() {
    let shape = {
      x: window.screenLeft,
      y: window.screenTop,
      w: window.innerWidth,
      h: window.innerHeight,
    }

    return shape;
  }

  update() {
    let winShape = this.getWinShape();

    if (
      winShape.x != this.#winData.shape.x ||
      winShape.y != this.#winData.shape.y ||
      winShape.w != this.#winData.shape.w ||
      winShape.h != this.#winData.shape.h
    ) {
      this.#winData.shape = winShape;

      let index = this.getWindowIndexFromId(this.#id);
      this.#windows[index].shape = winShape;

      if (this.#winShapeChangeCallback) this.#winShapeChangeCallback();
      this.updateWindowsLocalStorage();
    }
  }

  updateCountLocalStorage() {
    localStorage.setItem("count", this.#count)
  }

  updateWindowsLocalStorage() {
    localStorage.setItem("windows", JSON.stringify(this.#windows))
  }

  setWinShapeChangeCallback(callback) {
    this.#winShapeChangeCallback = callback;
  }

  setWinChangeCallback(callback) {
    this.#winChangeCallback = callback;
  }


  getWindowIndexFromId(id) {
    let index = -1;

    index = this.#windows.findIndex(item => item.id === id);

    return index;
  }

  getWindows() {
    return this.#windows;
  }

}


export default WindowManager;