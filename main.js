import * as THREE from 'three';
import WindowManager from './WindowManager.js';

let camera, scene, renderer, world;
let cubes = [];
let sceneOffsetTarget = { x: 0, y: 0 };
let sceneOffset = { x: 0, y: 0 };
let pixR = window.devicePixelRatio ?? 1;

let today = new Date();
today.setHours(0);
today.setMinutes(0);
today.setSeconds(0);
today.setMilliseconds(0);
today = today.getTime();

let windowManager;

let initialized = false;


// get time in seconds since beginning of the day (so that all windows use the same time)
function getTime() {
  return (new Date().getTime() - today) / 1000.0;
}

if (new URLSearchParams(window.location.search).get('clear')) {
  localStorage.clear()
} else {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'hidden' && !initialized) {
      init()
    }
    // else if (document.visibilityState === 'hidden') {
    //   windowManager.windowVisibilityChange();
    // }
  })

  

  window.onload = () => {
    if (document.visibilityState !== 'hidden') {
      init()
    }
  }



  function init() {
    initialized = true;

    setTimeout(() => {
      setupScene()
      setupWindowManager();
      resize();
      updateWindowShape(false);
      render()
      window.addEventListener("resize", resize);
    }, 300);
  }
  
  function setupScene() {
    camera = new THREE.OrthographicCamera(
      0,
      0,
      window.innerWidth,
      window.innerHeight,
      -10000,
      10000
    );
  
    camera.position.z = 2.5;
  
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0.0);
    scene.add(camera);
  
    renderer = new THREE.WebGLRenderer({ antialias: true, depthBuffer: true });
    renderer.setPixelRatio(pixR);
  
    world = new THREE.Object3D();
    scene.add(world);
  

    renderer.domElement.setAttribute("id", "scene");
    document.body.appendChild(renderer.domElement);
  }

  function render() {
    let time = getTime();

    windowManager.update();


    // calculate the new position based on the delta between current offset and new offset times a falloff value (to create the nice smoothing effect)
    let falloff = 0.05;
    sceneOffset.x = sceneOffset.x + (sceneOffsetTarget.x - sceneOffset.x) * falloff;
    sceneOffset.y = sceneOffset.y + (sceneOffsetTarget.y - sceneOffset.y) * falloff;

    // set the world position to the offset
    world.position.x = sceneOffset.x;
    world.position.y = sceneOffset.y;

    let wins = windowManager.getWindows();

    // loop through all our cubes and update their positions based on current window positions
    for (let i = 0; i < cubes.length; i++) {
      let cube = cubes[i];
      let win = wins[i];

      let posTarget = {
        x: win.shape.x + win.shape.w * 0.5,
        y: win.shape.y + win.shape.h * 0.5
      }

      cube.position.x = cube.position.x + (posTarget.x - cube.position.x) * falloff;
      cube.position.y = cube.position.y + (posTarget.y - cube.position.y) * falloff;
      cube.rotation.x = time * 0.5;
      cube.rotation.y = time * 0.3;
    }

    renderer.render(scene, camera)


    requestAnimationFrame(render);
  }
  
  function setupWindowManager() {
    windowManager = new WindowManager();
    windowManager.setWinShapeChangeCallback(updateWindowShape);
    windowManager.setWinChangeCallback(windowsUpdated);

    // here you can add your custom metadata to each windows instance
    let metaData = { foo: "bar" };
    
    // this will init the windowmanager and add this window to the centralised pool of windows
    windowManager.init(metaData);

    windowsUpdated();
  }

  function windowsUpdated() {
    updateNumberOfCubes();
  }

  function updateNumberOfCubes() {
    let wins = windowManager.getWindows();

    // remove all cubes
    cubes.forEach(cube => {
      world.remove(cube)
    })

    cubes = [];

    // add new cubes based on the current window setup
    for (let i = 0; i < wins.length; i++) {
      let win = wins[i];

      let color = new THREE.Color();
      color.setHSL(i * 0.1, 1.0, 0.5);

      let s = 100 + i * 50;
      let cube = new THREE.Mesh(
        new THREE.BoxGeometry(s, s, s),
        new THREE.MeshBasicMaterial({ color, wireframe: true })
      )

      cube.position.x = win.shape.x + win.shape.w * 0.5;
      cube.position.y = win.shape.y + win.shape.h * 0.5;

      world.add(cube);
      cubes.push(cube);
    }
  }

  function updateWindowShape(easing = true) {
    // storing the actual offset in a proxy that we update against in the render function
    sceneOffsetTarget = { x: -window.screenX, y: -window.screenY };
    if (!easing) sceneOffset = sceneOffsetTarget;
  }

  function resize() {
    let width = window.innerWidth;
    let height = window.innerHeight;

    camera = new THREE.OrthographicCamera(0, width, 0, height, -10000, 10000);
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

}




