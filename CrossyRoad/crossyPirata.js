var renderer = null,
scene = null,
camera = null,
root = null,
robot = null,
tree = null,
trees = [],
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
treeCol = null,
cube = null;

var score = 0;
var max = 0;
var robotsIS = null;
var robots = [];
var mixers = [];
var animaciones = {};
var spot = 10;
var duration = 20000; // ms
var currentTime = Date.now();

var materials = null;

function loadTrees()
{
  for (var j = 0; j < 5; j++)
  {
    for (var i = 0; i < 6; i++)
    {
      copyTree(((spot * 3) * i), ((-spot * 2) * (3 * j)));
    }
    for (var i = 0; i < 6; i++)
    {
      copyTree(((-spot * 3) * i), ((-spot * 2) * (3 * j)));
    }
  }
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
  console.log("Cloning tree");
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
        object.scale.set(0.06, 0.06, 0.06);
        object.position.set(0, -4, 0);
        object.rotation.y = -1.5;
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

function loadRobot()
{
    var robotG = new THREE.Object3D;

    console.log("Cloning robot");
    var newRobot = cloneFbx(robot);
    newRobot.position.set(100, -4, -300);
    newRobot.scale.set(0.06, 0.06, 0.06);
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
    robots.push(robotG);
    robotsIS.add(robotG);
}

function movePoints(dir)
{
  switch (dir)
  {
    case 0: //front
        front.position.z -= spot;
        back.position.z -= spot;
        left.position.z -= spot;
        right.position.z -= spot;
        break;
    case 1: //back
        front.position.z += spot;
        back.position.z += spot;
        left.position.z += spot;
        right.position.z += spot;
        break;
    case 2: //left
        front.position.x -= spot;
        back.position.x -= spot;
        left.position.x -= spot;
        right.position.x -= spot;
        break;
    case 3: //right
        front.position.x += spot;
        back.position.x += spot;
        left.position.x += spot;
        right.position.x += spot;
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
}

function updateScore(num)
{
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
              movePoints(2);
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
              movePoints(0);
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
              movePoints(3);
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
              movePoints(1);
              score--;
            }
            updateCollisions();
            //console.log("abajo");
            break;
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

        for(var rob of robots)
        {
            var collider = new THREE.Box3().setFromObject(rob.children[1]);

            if(collider.intersectsBox(playerBox))
            {
                console.log("Muerto!");
                muerte = true;
                document.getElementById("muerte").style.display = "block";
                document.getElementById("restartButton").style.display = "block";
            }

            rob.position.x -= 0.06 * deltat;
            if(rob.position.x < -180)
                rob.position.x = 180 - Math.random() * 50;
        }
    }


/*    if(del)
    {
      console.log("bloqueo delante");
    }
    if(der)
    {
      console.log("bloqueo derecha");
    }
    if(izq)
    {
      console.log("bloqueo izquierda");
    }
    if(atras)
    {
      console.log("bloqueo atras");
    }*/

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

var directionalLight = null;
var spotLight = null;
var ambientLight = null;
var mapUrl = "../images/wooden_crate_1.jpg";

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

    // Add  a camera so we can view the scene
    //camera = new THREE.PerspectiveCamera( 45, canvas.width / canvas.height, 1, 4000 );
    //camera.position.set(-2, 6, 12);
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

    setTimeout(function()
    {
      loadRobot();
      loadTrees();
    }, 1500);

    loadPlayer();

    // Create a group to hold the objects
    group = new THREE.Object3D;
    root.add(group);

    // Create a texture map
    var map = new THREE.TextureLoader().load(mapUrl);
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(25, 25);

    var color = 0xffffff;

    // Put in a ground plane to show off the lighting
    geometry = new THREE.PlaneGeometry(800, 800, 10, 100);
    var mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({color:color, map:map, side:THREE.DoubleSide}));

    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = -4.02;

    // Add the mesh to our group
    group.add( mesh );
    mesh.castShadow = false;
    mesh.receiveShadow = true;

    // Now add the group to our scene
    scene.add( root );
    scene.add(robotsIS);
}
