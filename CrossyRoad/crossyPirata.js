var renderer = null,
scene = null,
camera = null,
root = null,
robot = null,
tree = null,
trees = [],
floats = [],
fixers = [],
pgroup = null,
player = null,
front = null,
back = null,
left = null,
right = null,
del = false,
atras = false,
der = false,
izq = false,
pbbox = false,
group = false,
muerte = false,
started = false,
treeCol = null,
bar1 = null,
bar2 = null,
bar3 = null,
bar4 = null,
bars = [],
cube = null;

var score = 0;
var max = 0;
var robotsIS = null;
var robotsIzq = [];
var robotsDer = [];
var piedrasDer = [];
var piedrasIzq = [];
var mixers = [];
var animaciones = {};
var spot = 10;
var startDif = 150;
var lastTerrainZ = 0;
var limitx = 400;
var color = 0xffffff;
var terrainUnit = 60;
var treesPerGround = 20;
var terrainsLoaded = 0;
var prevWasGround = false;
var prevWasFloat = false;
var floatTouched = false;
var rockTouched = 0;
var duration = 20000; // ms
var currentTime = Date.now();

var materials = null;

function loadTrees(min, dif)
{
  for (var i = 0; i < treesPerGround; i++)
  {
      var equis = spot * (Math.floor((Math.floor(Math.random() * limitx) - (limitx / 2)) / 10));
      var zeta = -1 * (spot * (Math.floor((Math.floor(Math.random() * Math.abs(dif)) + Math.abs(min)) / 10)));
      copyTree(equis, zeta);
  }
}

function loadBarrier()
{

  var map = new THREE.TextureLoader().load("../images/brick3.png");
  var figure = new THREE.CubeGeometry(410, 20, 10);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(80, 2);

  bar1 = new THREE.Mesh(figure, new THREE.MeshPhongMaterial({color:0xffffff, map:map, transparent:true}));
  bar1.position.set(0,-4,150);
  scene.add( bar1 );

  /*bar2 = new THREE.Mesh(figure, new THREE.MeshPhongMaterial({color:0xffffff, map:map, transparent:true}));
  bar2.position.set(0,-4,-9961);
  scene.add( bar2 );*/

  map = new THREE.TextureLoader().load("../images/wall.png");
  figure = new THREE.CubeGeometry(101110, 40, 0.1);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(2530, 1);

  bar3 = new THREE.Mesh(figure, new THREE.MeshPhongMaterial({color:0xffffff, map:map, transparent:true, side:THREE.DoubleSide}));
  bar3.rotation.y = Math.PI / 2;
  bar3.position.set(-205, 15, -50405);
  scene.add( bar3 );

  bar4 = new THREE.Mesh(figure, new THREE.MeshPhongMaterial({color:0xffffff, map:map, transparent:true, side:THREE.DoubleSide}));
  bar4.rotation.y = Math.PI / 2;
  bar4.position.set(205, 15, -50405);
  scene.add( bar4 );

}

function loadTree()
{
    var loader = new THREE.FBXLoader();
    loader.load( '../models/Tree_monster_fbx/Tree.fbx', function ( object )
    {
        object.traverse( function ( child ) {
            if ( child.isMesh ) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        } );

        tree = object;
        tree.position.x = 0;
        tree.position.y = -4;
        tree.position.z = 0;
    } );
}

function copyTree(x, z)
{
  //console.log("Cloning tree");
  var newTree = cloneFbx(tree);
  newTree.position.x = x;
  newTree.position.y = -4;
  newTree.position.z = z;
  newTree.scale.set(2.7, 2.7, 2.7);

  var tbbox = new THREE.BoxHelper(newTree, 0x00ff00);
  tbbox.position = newTree.position;
  tbbox.visible = false;

  var collider = new THREE.Box3().setFromCenterAndSize(new THREE.Box3().setFromObject(tbbox).getCenter(), new THREE.Vector3(spot, 40, spot));
  scene.add(newTree);
  scene.add(tbbox);
  trees.push(collider);
}

function loadPlayer()
{
    var loader = new THREE.FBXLoader();
    loader.load( '../models/Boo/Boo.fbx', function ( object )
    {
        object.traverse( function ( child ) {
            if ( child.isMesh ) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        } );

        pgroup = new THREE.Object3D;
        pgroup.position.set(spot * 1, 0, spot * 7);
        player = object;
        player.position.set(0, 0, 0);
        player.rotation.y = 3;
        object.scale.set(0.03, 0.03, 0.03);

        pbbox = new THREE.BoxHelper(player, 0x00ff00);
        pbbox.update();
        pbbox.position = player.position;
        pbbox.visible = false;

        var dotGeo = new THREE.SphereGeometry(0.05);

        front = new THREE.Mesh(dotGeo, materials.dot);
        front.position.set(pgroup.position.x, 0, pgroup.position.z - (spot));

        back = new THREE.Mesh(dotGeo, materials.dot);
        back.position.set(pgroup.position.x, 0, pgroup.position.z + (spot));

        left = new THREE.Mesh(dotGeo, materials.dot);
        left.position.set(pgroup.position.x - (spot), 0, pgroup.position.z);

        right = new THREE.Mesh(dotGeo, materials.dot);
        right.position.set(pgroup.position.x + (spot), 0, pgroup.position.z);

        pgroup.add(player);
        pgroup.add(pbbox);

        scene.add(front);
        scene.add(back);
        scene.add(left);
        scene.add(right);

        scene.add(pgroup);
    } );
}

function loadRobotModel()
{
    var loader = new THREE.FBXLoader();
    loader.load( '../models/Robot/robot_run.fbx', function ( object )
    {
        object.traverse( function ( child ) {
            if ( child.isMesh ) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        } );

        robot = object;
        animaciones.run = object.animations[0];
        //scene.add(robot);
    } );
}

function loadRobot(posx, posz)
{
    var robotG = new THREE.Object3D;

    //console.log("Cloning robot");
    var newRobot = cloneFbx(robot);

    if(posx > 0)
        newRobot.rotation.y = -Math.PI / 2;
    else
    {
      newRobot.rotation.y = Math.PI / 2;
    }

    newRobot.position.set(posx, -4, posz);
    newRobot.scale.set(0.04, 0.04, 0.04);
    var newmixer = new THREE.AnimationMixer( newRobot );
    newmixer.clipAction(animaciones.run).play();
    mixers.push(newmixer);
    newRobot.mixer = newmixer;
    var rbbox = new THREE.BoxHelper(newRobot, 0x00ff00);
    rbbox.update();
    rbbox.position = newRobot.position;
    rbbox.visible = false;
    newRobot.box = rbbox;

    robotG.add(newRobot);
    robotG.add(rbbox);

    if(posx > 0)
        robotsDer.push(robotG);
    else
    {
      robotsIzq.push(robotG);
    }

    robotsIS.add(robotG);
}

function movePoints(dir, dis)
{
  switch (dir)
  {
    case 0: //front
        front.position.z -= dis;
        back.position.z -= dis;
        left.position.z -= dis;
        right.position.z -= dis;
        break;
    case 1: //back
        front.position.z += dis;
        back.position.z += dis;
        left.position.z += dis;
        right.position.z += dis;
        break;
    case 2: //left
        front.position.x -= dis;
        back.position.x -= dis;
        left.position.x -= dis;
        right.position.x -= dis;
        break;
    case 3: //right
        front.position.x += dis;
        back.position.x += dis;
        left.position.x += dis;
        right.position.x += dis;
        break;
  }
}

function updateCollisions()
{
  del = false;
  atras = false;
  izq = false;
  der = false;

  for (var i = 0; i < trees.length; i++)
  {
    if(trees[i].containsPoint(front.position))
      del = true;

    if(trees[i].containsPoint(back.position))
      atras = true;

    if(trees[i].containsPoint(left.position))
      izq = true;

    if(trees[i].containsPoint(right.position))
      der = true;
  }

  if(isOutOfBounds(front.position))
    del = true;

  if(isOutOfBounds(back.position))
    atras = true;

  if(isOutOfBounds(left.position))
    izq = true;

  if(isOutOfBounds(right.position))
    der = true;

  var playerBox = new THREE.Box3().setFromObject(pbbox);

  for(var fixer of fixers)
  {
    if(fixer.intersectsBox(playerBox))
    {
        if(pgroup.position.x % 10 != 0)
        {
          movePlayerX(10 - (pgroup.position.x % 10));
        }
    }
  }
}

function isOutOfBounds(pos)
{
  if(pos.x >= 205 || pos.x <= -205 || pos.z >= 150 || pos.z <= -9956)
    return true;

  return false;
}

function updateScore(num)
{
    var nuevo = (num - 7);
    if(nuevo % 5 == 0 && nuevo != 0 && nuevo / 5 > terrainsLoaded)
    {
      //console.log("nuevo terreno");
      terrainsLoaded++;
      var newT = Math.floor(Math.random() * 3);

      if(newT == 0)
        createFloor();
      else if(newT == 1)
        createGround();
      else if(newT == 2)
        createFloat();
    }
    max = num;
    document.getElementById("score").innerHTML = "Score: "+ num;
}

function onKeyDown(event)
{
    if(muerte)
      return;

    switch(event.keyCode)
    {
        case 37: //Left
            if(pgroup.rotation.y != 1.5)
              pgroup.rotation.y = 1.5;

            if(!izq)
            {
              pgroup.position.x -= spot;
              camera.position.x -= spot;
              movePoints(2, spot);
            }
            updateCollisions();

            //console.log("izquierda");
            break;
        case 38: //Up
            if(pgroup.rotation.y != 0)
              pgroup.rotation.y = 0;

            if(!del)
            {
              pgroup.position.z -= spot;
              camera.position.z -= spot;
              movePoints(0, spot);
              score++;
              if(score > max)
                updateScore(score);
            }
            updateCollisions();

            //console.log("arriba");
            break;
        case 39: //Right
            if(pgroup.rotation.y != -1.5)
              pgroup.rotation.y = -1.5;

            if(!der)
            {
              pgroup.position.x += spot;
              camera.position.x += spot;
              movePoints(3, spot);
            }
            updateCollisions();
            //console.log("derecha");
            break;
        case 40: //Down
            if(pgroup.rotation.y != 3.2)
              pgroup.rotation.y = 3.2;

            if(!atras)
            {
              pgroup.position.z += spot;
              camera.position.z += spot;
              movePoints(1, spot);
              score--;
            }
            updateCollisions();
            //console.log("abajo");
            break;
    }
}


function movePlayerX(dis)
{
  if(dis > 0)
  {
    pgroup.position.x += dis;
    camera.position.x += dis;
    movePoints(3, dis);
  }
  else
  {
    pgroup.position.x -= Math.abs(dis);
    camera.position.x -= Math.abs(dis);
    movePoints(2, Math.abs(dis));
  }
}

function animate() {

    if(muerte)
      return;

    var now = Date.now();
    var deltat = now - currentTime;
    currentTime = now;
    var fract = deltat / duration;
    var angle = Math.PI * 2 * fract;

    if(robot)
    {
        for(var mixer of mixers)
        {
          mixer.update(deltat * 0.002);
        }

        var playerBox = new THREE.Box3().setFromObject(pbbox);

        for(var rob of robotsDer)
        {
            var collider = new THREE.Box3().setFromObject(rob.children[1]);

            if(collider.intersectsBox(playerBox))
            {
                console.log("Muerto!");
                muerte = true;
                document.getElementById("muerte").style.display = "block";
                document.getElementById("restartButton").style.display = "block";
            }

            rob.position.x -= 0.07 * deltat;
            if(rob.position.x < -400)
                rob.position.x = 0;
        }

        for(var rob2 of robotsIzq)
        {
            var collider = new THREE.Box3().setFromObject(rob2.children[1]);

            if(collider.intersectsBox(playerBox))
            {
                console.log("Muerto!");
                muerte = true;
                document.getElementById("muerte").style.display = "block";
                document.getElementById("restartButton").style.display = "block";
            }

            rob2.position.x += 0.05 * deltat;
            if(rob2.position.x > 400)
                rob2.position.x = 0;
        }

        rockTouched = 0;

        for(var pie of piedrasDer)
        {
            var collider = new THREE.Box3().setFromCenterAndSize(pie.position, new THREE.Vector3(68, 50, 30)); //new THREE.Vector3(pie.position.x, -4, pie.position.z)
            if(collider.intersectsBox(playerBox))
            {
                //console.log("subio a la piedra!");
                movePlayerX(-(0.04 * deltat));
                rockTouched++;
            }

            pie.position.x -= 0.04 * deltat;
            if(pie.position.x < -171)
                pie.position.x = 171;
        }

        for(var pie2 of piedrasIzq)
        {
            var collider = new THREE.Box3().setFromCenterAndSize(pie2.position, new THREE.Vector3(68, 50, 30));

            if(collider.intersectsBox(playerBox))
            {
                //console.log("subio a la piedra 2!");
                movePlayerX(0.06 * deltat);
                rockTouched++;
            }

            pie2.position.x += (0.06 * deltat);
            if(pie2.position.x > 171)
                pie2.position.x = -171;
        }

        floatTouched = false;
        for(var float of floats)
        {
          if(float.intersectsBox(playerBox))
          {
              floatTouched = true;
          }
        }

        if(floatTouched && rockTouched == 0)
        {
            console.log("Muerto!");
            muerte = true;
            document.getElementById("muerte").style.display = "block";
            document.getElementById("restartButton").style.display = "block";
        }
    }
}

function run() {
    requestAnimationFrame(function() { run(); });

        // Render the scene
        renderer.render( scene, camera );

        // Spin the cube for next frame
        animate();
}

function restartGame()
{
  muerte = false;
  pgroup.position.set(spot * 1, 0, spot * 7);
  pgroup.rotation.y = 0;
  front.position.set(pgroup.position.x, 0, pgroup.position.z - (spot));
  back.position.set(pgroup.position.x, 0, pgroup.position.z + (spot));
  left.position.set(pgroup.position.x - (spot), 0, pgroup.position.z);
  right.position.set(pgroup.position.x + (spot), 0, pgroup.position.z);
  camera.position.set(35,120,150);
  score = 0;
  floatTouched = false;
  updateScore(0);
  document.getElementById("muerte").style.display = "none";
  document.getElementById("restartButton").style.display = "none";
}

function setLightColor(light, r, g, b)
{
    r /= 255;
    g /= 255;
    b /= 255;

    light.color.setRGB(r, g, b);
}

function createGround()
{

  if(prevWasGround && robot)
  {
    var newR = Math.floor(Math.random() * 2);
    if(newR == 0)
        loadRobot(-200, lastTerrainZ);
    else if(newR == 1)
        loadRobot(200, lastTerrainZ);
  }

  var map = new THREE.TextureLoader().load("../images/start.png");
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(30, 1);
  geometry = new THREE.PlaneGeometry(410, 20, 10, 100);
  var mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({color:color, map:map, side:THREE.DoubleSide}));

  mesh.rotation.x = -Math.PI / 2;
  mesh.position.z = lastTerrainZ - (20 / 2);
  mesh.position.y = -4.02;

  lastTerrainZ -= 20;
  // Add the mesh to our group
  group.add( mesh );

  if(started)
  {
      loadTrees(lastTerrainZ, terrainUnit);
  }

  geometry = new THREE.PlaneGeometry(410, 20, 10, 100);
  var mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({color:color, map:map, side:THREE.DoubleSide}));

  mesh.rotation.x = Math.PI / 2;
  mesh.position.z = lastTerrainZ - 70;
  mesh.position.y = -4.02;

  // Add the mesh to our group
  group.add( mesh );

  var map = new THREE.TextureLoader().load("../images/grass1.png");
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(17, 5);

  geometry = new THREE.PlaneGeometry(410, 60, 10, 100);
  var mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({color:color, map:map, side:THREE.DoubleSide}));

  mesh.rotation.x = -Math.PI / 2;
  mesh.position.z = lastTerrainZ - 30;
  mesh.position.y = -4.02;

  lastTerrainZ -= 80;

  // Add the mesh to our group
  group.add( mesh );

  prevWasGround = true;
  prevWasFloat = false;
}

function createFloor()
{
  var map = new THREE.TextureLoader().load("../images/floor.png");
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(30, 10);
  geometry = new THREE.PlaneGeometry(410, 100, 10, 100);
  var mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({color:color, map:map, side:THREE.DoubleSide}));

  mesh.rotation.x = -Math.PI / 2;
  mesh.position.z = lastTerrainZ - (100 / 2);
  mesh.position.y = -4.02;

  lastTerrainZ -= 100;
  // Add the mesh to our group
  group.add( mesh );

  if(started)
  {
      loadRobot(-200, lastTerrainZ + 75);
      loadRobot(200, lastTerrainZ + 25);
  }

  prevWasGround = false;
  prevWasFloat = false;
}


function loadLog(posx, posz)
{

  var map = new THREE.TextureLoader().load("../images/piedra.png");
  geometry = new THREE.PlaneGeometry(68, 30);
  var piedra = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({color:color, map:map, side:THREE.DoubleSide}));

  piedra.rotation.x = -Math.PI / 2;

  if(posx > 0)
      piedra.rotation.z = -Math.PI;
  else
  {
    piedra.rotation.z = Math.PI;
  }

  piedra.position.set(posx, -4.01, posz);

  if(posx > 0)
      piedrasDer.push(piedra);
  else
  {
    piedrasIzq.push(piedra);
  }

  scene.add(piedra);
}



function createFloat()
{

  if(prevWasFloat && robot)
  {
    var newR = Math.floor(Math.random() * 2);
    if(newR == 0)
        loadRobot(-200, lastTerrainZ);
    else if(newR == 1)
        loadRobot(200, lastTerrainZ);
  }

  var map = new THREE.TextureLoader().load("../images/finlava.png");
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(30, 1);
  geometry = new THREE.PlaneGeometry(410, 20, 10, 100);
  var mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({color:color, map:map, side:THREE.DoubleSide}));

  mesh.rotation.x = Math.PI / 2;
  mesh.position.z = lastTerrainZ - (20 / 2);
  mesh.position.y = -4.02;

  lastTerrainZ -= 20;
  // Add the mesh to our group
  group.add( mesh );

  geometry = new THREE.PlaneGeometry(410, 20, 10, 100);
  var mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({color:color, map:map, side:THREE.DoubleSide}));

  mesh.rotation.x = -Math.PI / 2;
  mesh.position.z = lastTerrainZ - 70;
  mesh.position.y = -4.02;

  // Add the mesh to our group
  group.add( mesh );

  var collider = new THREE.Box3().setFromCenterAndSize(mesh.position, new THREE.Vector3(410, 50, 3));
  fixers.push(collider);

  if(started) //Crear troncos o rocas
  {
    loadLog(171 ,lastTerrainZ - 15);
    loadLog(-171 ,lastTerrainZ - 45);
  }

  var map = new THREE.TextureLoader().load("../images/lava.png");
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(17, 5);

  geometry = new THREE.PlaneGeometry(410, 60, 10, 100);
  var mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({color:color, map:map, side:THREE.DoubleSide}));

  mesh.rotation.x = -Math.PI / 2;
  mesh.position.z = lastTerrainZ - 30;
  mesh.position.y = -4.02;

  lastTerrainZ -= 80;

  // Add the mesh to our group
  group.add( mesh );

  prevWasGround = false;
  prevWasFloat = true;

  var fbbox = new THREE.BoxHelper(mesh, 0x00ff00);
  fbbox.position = mesh.position;
  fbbox.visible = false;

  var collider = new THREE.Box3().setFromCenterAndSize(new THREE.Box3().setFromObject(fbbox).getCenter(), new THREE.Vector3(410, 50, 60));
  floats.push(collider);
}

function createFirstAssets()
{
  // Create a group to hold the objects
  group = new THREE.Object3D;
  root.add(group);

  // Create a texture map
  var map = new THREE.TextureLoader().load("../images/floor3.png");
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(30, 10);

  geometry = new THREE.PlaneGeometry(410, startDif, 10, 100);
  var mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({color:color, map:map, side:THREE.DoubleSide}));

  mesh.rotation.x = -Math.PI / 2;
  mesh.position.z = 75;
  mesh.position.y = -4.02;

  // Add the mesh to our group
  group.add( mesh );

  createGround();
  createGround();

  setTimeout(function()
  {
    loadTrees(-20, terrainUnit);
    loadTrees(-120, terrainUnit);
    loadBarrier();
    started = true;
  }, 2000);

}

var directionalLight = null;
var spotLight = null;
var ambientLight = null;

var SHADOW_MAP_WIDTH = 2048, SHADOW_MAP_HEIGHT = 2048;

function createScene(canvas)
{
    document.getElementById("restartButton").style.display = "none";
    // Create the Three.js renderer and attach it to our canvas
    renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );

    // Set the viewport size
    renderer.setSize(canvas.width, canvas.height);

    // Turn on shadows
    renderer.shadowMap.enabled = true;
    // Options are THREE.BasicShadowMap, THREE.PCFShadowMap, PCFSoftShadowMap
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Create a new Three.js scene
    scene = new THREE.Scene();

    camera = new THREE.OrthographicCamera(-80, 80, 40, -80, -1, 1000);
    camera.position.set(35,120,150);
    camera.lookAt(scene.position); // point at origin
    scene.add(camera);

    // Create a group to hold all the objects
    root = new THREE.Object3D;

    // Add a directional light to show off the object
    directionalLight = new THREE.DirectionalLight( 0xffffff, 1);

    // Create and add all the lights
    directionalLight.position.set(0, 100, 0);
    root.add(directionalLight);

    ambientLight = new THREE.AmbientLight ( 0x888888 );
    root.add(ambientLight);

    materials = {
        shadow: new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.5
        }),
        solid: new THREE.MeshNormalMaterial({}),
        colliding: new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.5
        }),
        dot: new THREE.MeshBasicMaterial({
            color: 0x0000ff
        })
    };

    robotsIS = new THREE.Object3D;

    // Create the objects
    loadTree();
    loadRobotModel();
    loadPlayer();

    createFirstAssets();

    // Now add the group to our scene
    scene.add( root );
    scene.add(robotsIS);
}
