var Apps = function () {
    var container, stats;

    var camera, scene, renderer,ray;
    var group,room;
    var objects = [];

    var targetRotation = 0;
    var targetRotationOnMouseDown = 0;

    var mouseX = 0;
    var mouseXOnMouseDown = 0;

    var windowHalfX = window.innerWidth / 2;
    var windowHalfY = window.innerHeight / 2;
    var controls, translBlock = 'back', dftMaterial = new THREE.MeshPhongMaterial({
        side: THREE.DoubleSide,
        shading: THREE.SmoothShading,
        opacity: 1,
        emissive: 0x8F8F8F,
        color: 0xFFFFFF
        //lightMap: texture
    }), varlastMater, lastMater, texture1, metal, lastFon, fon = [], countOfPoints = 20,points=false;
    //var leftKey = 37, upKey = 38, rightKey = 39, downKey=40;
    //var keystate;
    var havePointerLock = checkForPointerLock();
    var controls, controlsEnabled,clock;
    var moveForward,
        moveBackward,
        moveLeft,
        moveRight,
        canJump;
    var velocity = new THREE.Vector3();
    var footStepSfx = new Audio('data/sfx/footstep.wav');
    var ambienceSfx = new Audio('data/sfx/ambience.wav');
    //ambienceSfx.preload = 'auto';
    //ambienceSfx.loop = true;

// model

    var onProgress = function ( xhr ) {
        if ( xhr.lengthComputable ) {
            var percentComplete = xhr.loaded / xhr.total * 100;
            console.log( Math.round(percentComplete, 2) + '% downloaded' );
        }
    };

    var onError = function ( xhr ) {
    };


    THREE.Loader.Handlers.add( /\.dds$/i, new THREE.DDSLoader() );

    var loader = new THREE.OBJMTLLoader();
    loader.load( 'data/house/house interior.obj', 'data/house/house interior.mtl', function ( object ) {

        //object.position.y = - 80;
        object.traverse(function(child){
            if(child) child.receiveShadow = true;
        })
        room = object;
        room.receiveShadow = true;
        room.position.y  = -20;
        room.position.z  = -350;
        room.position.x  = -300;
        room.scale.multiplyScalar(5);
        loadTexture();
    }, onProgress, onError );


    function loadTexture(){
        THREE.ImageUtils.loadTexture('img/metal.jpg', false, function (vg) {
            texture1 = vg;
            texture1.wrapS = texture1.wrapT = THREE.RepeatWrapping;
            texture1.format = THREE.RGBFormat;
            texture1.repeat.set(0.48, 0.48);
            metal = new THREE.MeshPhongMaterial({
                color: "#532C0F",
                shininess: 100,
                emissive: '#1D1D1D',
                envMap: textureCube,
                reflectivity: 0.05,
                bumpMap: texture1,
                bumpScale: 7.91,
                specular: "#000000",
                side: THREE.DoubleSide
            });
            init();
            animate();
            guiObj.init();
        });
    }
    function loadFons(){
        fon[0] = new Image();
        fon[0].src = 'img/FON_1.jpg';
        fon[0].onload = function () {
            fon[1] = new Image();
            fon[1].src = 'img/FON_2.jpg';
            fon[1].onload = function () {
                fon[2] = new Image();
                fon[2].src = 'img/FON_3.jpg';
                fon[2].onload = function () {
                    lastFon = fon[0];
                    document.getElementById('main').appendChild(lastFon);
                    init();
                    animate();
                    guiObj.init();
                }
            }
        }
    }

    var path = "img/textures/skybox/gray/";
    var format = '.jpg';
    var urls = [path + 'posx' + format, path + 'negx' + format, path + 'posy' + format, path + 'negy' + format, path + 'posz' + format, path + 'negz' + format];
    var textureCube = THREE.ImageUtils.loadTextureCube(urls);
    textureCube.format = THREE.RGBFormat;
    var guiObj = {
        gui: '',
        init: function () {
            var renderObj = {
                color: 0xa9b3b3,
                radious: 3,
                countPoints: 20,
                genereateCounts: function () {
                    generateCurve(true);
                },
                genereate: function () {
                    generateCurve();
                },
                changeBack: function () {

                }, changeTexture: function () {

                }
            }
            this.gui = new dat.GUI({width: 280});
            this.gui.add(renderObj, 'genereateCounts').name('Random Count Points');
            //this.gui.add(renderObj, 'genereate').name('Generate New Curve');
            //this.gui.add(renderObj, 'countPoints').min(4).max(50).name('Count of Points').onChange(function (val) {
            //    countOfPoints = val;
            //});
            //this.gui.add(renderObj, 'radious').min(1).max(10).name('Radious').onChange(function (val) {
            //    generateCurve(false, val);
            //});
            //this.gui.addColor(renderObj, 'color').name('Color').onChange(function (val) {
            //    for (var i = 0; i < group.children.length; i++) {
            //        group.children[i].material.color = new THREE.Color(val);
            //    }
            //});
            this.gui.add(renderObj, 'changeBack', ['plastic', 'metal']).name('Change Texture').onChange(function (val) {
                changeTexture(val);
            });/*
            this.gui.add(renderObj, 'changeBack', ['museum', 'mirror-room', 'hall']).name('Change Background').onChange(function (val) {
                document.getElementById('main').removeChild(lastFon);
                var curI;
                switch (val) {
                    case 'museum':
                        curI = fon[0];
                        break;
                    case 'mirror-room':
                        curI = fon[1];
                        break;
                    case 'hall':
                        curI = fon[2];
                        break;
                }
                lastFon = curI;
                document.getElementById('main').appendChild(curI);
                //$('#'+translBlock).css('background-image',"url(http://webgl.unilimes.com/project/curve3D/img/"+val+".jpg)");
            });
       */ }
    }



    function init() {
        clock = new THREE.Clock();
        //container = document.createElement('div');
        container = document.getElementById(translBlock);
        //document.body.appendChild(container);

        /*var info = document.createElement('div');
         info.style.position = 'absolute';
         info.style.top = '30px';
         info.style.width = '100%';
         info.style.textAlign = 'center';
         info.innerHTML = 'Drag to spin';
         container.appendChild(info);*/

        camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 50000);
        camera.position.set(0, 300, 600);


        scene = new THREE.Scene();
        scene.add(new THREE.AxisHelper(100));
        scene.add(room);
        objects.push(room);

        //camera.rotation.x = 1.61;
        //camera.rotation.y = 1.55;
        //camera.rotation.z = -1.57;

        /*
         * lights
         * */

        var ambiLight = new THREE.AmbientLight(0x111111);
        scene.add(ambiLight);
        spotLight = new THREE.SpotLight(0xffffff);
        spotLight.position.set(300, 1000, 100);
        spotLight.target.position.set(0, 0, 0).normalize();
        spotLight.shadowCameraNear = 0.91;
        spotLight.castShadow = true;
        spotLight.shadowDarkness = 0.25;
        spotLight.intensity = 0.99;
        spotLight.shadowCameraVisible = false;
        scene.add(spotLight);

        generateCurve();
        //group = new THREE.Mesh(new THREE.CubeGeometry(10,10,10),metal);
        //group.castShadow = true;
        //group.scale.multiplyScalar(30);
        //scene.add(group);

        /*
         * floor
         * */
       /* var geometry = new THREE.CubeGeometry(5, 10, 0.2);
        THREE.ShaderLib["basic"].fragmentShader = basicFragmentShader(false);
        var material = new THREE.MeshBasicMaterial();
        var ground = new THREE.Mesh(geometry, material);
        ground.scale.multiplyScalar(250);
        ground.position.y = -200;
        ground.position.x = -50;
        ground.rotation.x = Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);*/

        ;

        controls = new THREE.PointerLockControls( camera );
        scene.add( controls.getObject() );

        renderer = new THREE.WebGLRenderer({
            antialias: true, alpha: true
        });
        renderer.autoClear = false;
        renderer.shadowMapType = THREE.PCFSoftShadowMap;
        renderer.shadowMapEnabled = true;
        renderer.shadowMapSoft = true;
        renderer.setClearColor(0x000000, 0);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowCameraNear = 3;
        renderer.shadowCameraFar = camera.far;
        renderer.shadowCameraFov = 50;
        renderer.shadowMapBias = 0.0039;
        renderer.shadowMapDarkness = 0.5;
        renderer.shadowMapWidth = 1024;
        renderer.shadowMapHeight = 1024;

        container.appendChild(renderer.domElement);

        /*controls =  new THREE.TrackballControls(camera, renderer.domElement);
        controls.rotateSpeed = 10.0;
        controls.zoomSpeed = 1.2;
        controls.panSpeed = 0.8;
        controls.noZoom = false;
        controls.noPan = false;
        controls.staticMoving = true;
        controls.dynamicDampingFactor = 0.3;
        controls.keys = [65, 83, 68];     // ?
        controls.minDistance = 0;
        controls.maxDistance = 1000;*/


        stats = new Stats();
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.top = '0px';
        container.appendChild(stats.domElement);

        renderer.domElement.addEventListener('mousedown', onDocumentMouseDown, false);
        renderer.domElement.addEventListener('touchstart', onDocumentTouchStart, false);
        renderer.domElement.addEventListener('touchmove', onDocumentTouchMove, false);

        window.addEventListener('resize', onWindowResize, false);

        ambienceSfx.play();
        footStepSfx.preload = 'auto';
        initControls();
        initPointerLock();

        $('.container-loader').fadeOut();

    }

    function checkForPointerLock() {
        return 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
    }

    function initPointerLock() {
        var element = document.body;
        if (havePointerLock) {
            var pointerlockchange = function (event) {
                if (document.pointerLockElement === element ||
                    document.mozPointerLockElement === element ||
                    document.webkitPointerLockElement === element) {
                    controlsEnabled = true;
                    controls.enabled = true;
                } else {
                    controls.enabled = false;
                }
            };

            var pointerlockerror = function (event) {
                element.innerHTML = 'PointerLock Error';
            };

            document.addEventListener('pointerlockchange', pointerlockchange, false);
            document.addEventListener('mozpointerlockchange', pointerlockchange, false);
            document.addEventListener('webkitpointerlockchange', pointerlockchange, false);

            document.addEventListener('pointerlockerror', pointerlockerror, false);
            document.addEventListener('mozpointerlockerror', pointerlockerror, false);
            document.addEventListener('webkitpointerlockerror', pointerlockerror, false);

            var requestPointerLock = function(event) {
                element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
                element.requestPointerLock();
            };

            element.addEventListener('click', requestPointerLock, false);
        } else {
            element.innerHTML = 'Bad browser; No pointer lock';
        }
    }

    function onKeyDown(e) {
        shiftSpeed =0;
        switch (e.keyCode) {
            case 16: shiftSpeed =800;
            case 38: // up
            case 87: // w
                moveForward = true;
                break;
            case 37: // left
            case 65: // a
                moveLeft = true;
                break;
            case 40: // down
            case 83: // s
                moveBackward = true;
                break;
            case 39: // right
            case 68: // d
                moveRight = true;
                break;
            case 32: // space
                if (canJump === true) velocity.y += 350;
                canJump = false;
                break;
        }
    }

    function onKeyUp(e) {
        shiftSpeed =0;
        switch(e.keyCode) {
            case 38: // up
            case 87: // w
                moveForward = false;
                break;
            case 37: // left
            case 65: // a
                moveLeft = false;
                break;
            case 40: // down
            case 83: // s
                moveBackward = false;
                break;
            case 39: // right
            case 68: // d
                moveRight = false;
                break;
        }
    }

    function initControls() {
        document.addEventListener('keydown', onKeyDown, false);
        document.addEventListener('keyup', onKeyUp, false);
        ray = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 10);
    }
var shiftSpeed =0;
    function updateControls() {
        if (controlsEnabled) {
            var delta = clock.getDelta();
            var walkingSpeed = (200.0 +shiftSpeed)*10;

            velocity.x -= velocity.x * 10.0 * delta;
            velocity.z -= velocity.z * 10.0 * delta;
            velocity.y -= 9.8 * 100.0 * delta;

            if (moveForward) velocity.z -= walkingSpeed * delta;
            if (moveBackward) velocity.z += walkingSpeed * delta;

            if (moveLeft) velocity.x -= walkingSpeed * delta;
            if (moveRight) velocity.x += walkingSpeed * delta;

            if (moveForward || moveBackward || moveLeft || moveRight) {
                footStepSfx.play();
            }
if(velocity.z == room.position.z ||velocity.x == room.position.x ){

}else{
    controls.getObject().translateX(velocity.x * delta);
    controls.getObject().translateY(velocity.y * delta);
    controls.getObject().translateZ(velocity.z * delta);

    if (controls.getObject().position.y < 10) {
        velocity.y = 0;
        controls.getObject().position.y = 10;
        canJump = true;
    }
}

        }
    }

    function onWindowResize() {

        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);

    }

    function generateCurve(flag, val) {
        if (group)scene.remove(group);
        group = new THREE.Group();
        scene.add(group);

        var nurbsControlPoints = [];
        var nurbsKnots = [];
        var nurbsDegree = 3;

        for (var i = 0; i <= nurbsDegree; i++) {

            nurbsKnots.push(0);

        }
        var count = 0, max = 50, min = 4;
        if (flag) {
            count = Math.round(Math.random() * (max - min) + min)
        } else {
            count = countOfPoints;
        }
        for (var i = 0, j = count; i < j; i++) {
            var vector = new THREE.Vector4(
                Math.random() * 400 - 200,
                Math.random() * 400,
                Math.random() * 400 - 200,
                1 // weight of control point: higher means stronger attraction
            );
            //vector.lerp();
            nurbsControlPoints.push(vector);

            var knot = ( i + 1 ) / ( j - nurbsDegree );
            nurbsKnots.push(THREE.Math.clamp(knot, 0, 1));

        }

        nurbsCurve = new THREE.NURBSCurve(nurbsDegree, nurbsKnots, nurbsControlPoints);
        points = (points && val )?points:nurbsCurve.getPoints(200);
        var spline = new THREE.SplineCurve3(points);

        /*  var CustomSinCurve = THREE.Curve.create(
         function ( scale ) { //custom curve constructor
         this.scale = (scale === undefined) ? 1 : scale;
         },

         function ( t ) { //getPoint: t is between 0-1
         var tx = t * 30 - 1.5,
         ty = Math.sin( 2 * Math.PI * t ),
         tz = 0;

         return new THREE.Vector3(tx, ty, tz).multiplyScalar(this.scale);
         }
         );
         var spline = new CustomSinCurve( 10 );*/
        var texture = THREE.ImageUtils.loadTexture('img/plastic.jpg');
        texture.wrapT = THREE.RepeatWrapping;
        var nurbsMaterial = lastMater ? lastMater : dftMaterial;
        var rad = val ? val : 3;
        var geometry = new THREE.TubeGeometry(spline, 500, rad, 8);
        //console.log(geometry.parameters,geometry.normals,geometry.binormals,geometry.tangents);
        nurbsLine = new THREE.Mesh(geometry, nurbsMaterial);
        nurbsLine.category = 'changes';

        var p = spline.points;
        /*var f = new THREE.Mesh(new THREE.SphereGeometry(rad, 10, 10), nurbsMaterial);
        f.position.x = p[0].x;
        f.position.y = p[0].y - 100;
        f.position.z = p[0].z;
        f.category = 'changes';
        var s = f.clone();
        s.position.x = (p[p.length - 1]).x;
        s.position.y = (p[p.length - 1]).y - 100;
        s.position.z = (p[p.length - 1]).z;
        group.add(f);
        group.add(s);*/

        //var nurbsGeometry = new THREE.Geometry();
        //nurbsGeometry.vertices = nurbsCurve.getPoints( 200 );
        //var nurbsMaterial = new THREE.LineBasicMaterial( { linewidth: 10, color: 0xff3333 } );

        //nurbsLine = new THREE.Line( nurbsGeometry, nurbsMaterial );

        nurbsLine.position.set(0, 80, 0);
        camera.lookAt( new THREE.Vector3(0,200,0));
        nurbsLine.castShadow = true;
        var nurbsControlPointsGeometry = new THREE.Geometry();
        nurbsControlPointsGeometry.vertices = nurbsCurve.controlPoints;
        var nurbsControlPointsMaterial = new THREE.LineBasicMaterial({linewidth: 2, color: 0xffffff, opacity: 0.25});

        var nurbsControlPointsLine = new THREE.Line(nurbsControlPointsGeometry, nurbsControlPointsMaterial);
        nurbsControlPointsLine.position.copy(nurbsLine.position);
        //nurbsLine.scale.multiplyScalar(2);
        group.add(nurbsLine);

    }

    function onDocumentMouseDown(event) {

        event.preventDefault();
        /*if(event.clientX > 1350 && event.clientY < 105){
         return;
         }*/
        renderer.domElement.addEventListener('mousemove', onDocumentMouseMove, false);
        renderer.domElement.addEventListener('mouseup', onDocumentMouseUp, false);
        renderer.domElement.addEventListener('mouseout', onDocumentMouseOut, false);

        mouseXOnMouseDown = event.clientX - windowHalfX;
        targetRotationOnMouseDown = targetRotation;

    }

    function onDocumentMouseMove(event) {

        mouseX = event.clientX - windowHalfX;

        targetRotation = targetRotationOnMouseDown + ( mouseX - mouseXOnMouseDown ) * 0.02;

    }

    function onDocumentMouseUp(event) {

        renderer.domElement.removeEventListener('mousemove', onDocumentMouseMove, false);
        renderer.domElement.removeEventListener('mouseup', onDocumentMouseUp, false);
        renderer.domElement.removeEventListener('mouseout', onDocumentMouseOut, false);

    }

    function onDocumentMouseOut(event) {

        renderer.domElement.removeEventListener('mousemove', onDocumentMouseMove, false);
        renderer.domElement.removeEventListener('mouseup', onDocumentMouseUp, false);
        renderer.domElement.removeEventListener('mouseout', onDocumentMouseOut, false);

    }

    function onDocumentTouchStart(event) {

        if (event.touches.length == 1) {

            event.preventDefault();

            mouseXOnMouseDown = event.touches[0].pageX - windowHalfX;
            targetRotationOnMouseDown = targetRotation;

        }

    }

    function onDocumentTouchMove(event) {

        if (event.touches.length == 1) {

            event.preventDefault();

            mouseX = event.touches[0].pageX - windowHalfX;
            targetRotation = targetRotationOnMouseDown + ( mouseX - mouseXOnMouseDown ) * 0.05;

        }

    }
    function animate() {
        requestAnimationFrame(animate);
        updateControls();
        //controls.update();
        render();
        stats.update();

    }

    function render() {
        group.rotation.y += ( targetRotation - group.rotation.y ) * 0.05;
        camera.updateMatrixWorld();
        renderer.clear();
        renderer.render(scene, camera);

    }

    function basicFragmentShader(state) {
        return [
            "uniform vec3 diffuse;",
            "uniform float opacity;",

            THREE.ShaderChunk["common"],
            THREE.ShaderChunk["color_pars_fragment"],
            THREE.ShaderChunk["map_pars_fragment"],
            THREE.ShaderChunk["alphamap_pars_fragment"],
            THREE.ShaderChunk["lightmap_pars_fragment"],
            THREE.ShaderChunk["envmap_pars_fragment"],
            THREE.ShaderChunk["fog_pars_fragment"],
            THREE.ShaderChunk["shadowmap_pars_fragment"],
            THREE.ShaderChunk["specularmap_pars_fragment"],
            THREE.ShaderChunk["logdepthbuf_pars_fragment"],

            "void main() {",

            "	vec3 outgoingLight = vec3( 0.0 );",	// outgoing light does not have an alpha, the surface does
            "	vec4 diffuseColor = vec4( diffuse, opacity );",

            THREE.ShaderChunk["logdepthbuf_fragment"],
            THREE.ShaderChunk["map_fragment"],
            THREE.ShaderChunk["color_fragment"],
            THREE.ShaderChunk["alphamap_fragment"],
            THREE.ShaderChunk["alphatest_fragment"],
            THREE.ShaderChunk["specularmap_fragment"],

            "	outgoingLight = diffuseColor.rgb;", // simple shader

            THREE.ShaderChunk["lightmap_fragment"],		// TODO: Light map on an otherwise unlit surface doesn't make sense.
            THREE.ShaderChunk["envmap_fragment"],
            THREE.ShaderChunk["shadowmap_fragment"],		// TODO: Shadows on an otherwise unlit surface doesn't make sense.

            THREE.ShaderChunk["linear_to_gamma_fragment"],

            THREE.ShaderChunk["fog_fragment"],

            (state === false) ? "gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 - shadowColor.x );" : "gl_FragColor = vec4( outgoingLight, diffuseColor.a );",

            "}"
        ].join("\n");
    }

    function changeTexture(val) {
        var material;
        switch (val) {
            case 'metal':
                material = metal;
                break;
            default :
                material = dftMaterial;
        }
        material.needsUpdate = true;
        lastMater = material;
        for (var i = 0; i < group.children.length; i++) {
            group.children[i].material = material;
        }
    }

    /*App.types = {
     skyBox: '',
     urlImg: 'img/',
     backgroundContainer: ''
     }
     App.rebuildSkyBox = {
     changeBackground: function (id) {
     var imagePrefix, skyBox = App.types.skyBox, playVideoBack = App.types.backgroundContainer;
     switch (id) {
     case 'mountain':
     imagePrefix = ['dawnmountain-xpos.png', 'dawnmountain-xneg.png', 'dawnmountain-ypos.png',
     'dawnmountain-yneg.png', 'dawnmountain-zpos.png', 'dawnmountain-zneg.png'];
     break;
     case 'siege':
     imagePrefix = ['siege_ft.png', 'siege_bk.png', 'siege_up.png',
     'siege_dn.png', 'siege_rt.png', 'siege_lf.png'];
     break;
     case 'starfield':
     imagePrefix = ['starfield_ft.png', 'starfield_bk.png', 'starfield_up.png',
     'starfield_dn.png', 'starfield_rt.png', 'starfield_lf.png'];
     break;
     case 'misty':
     imagePrefix = ['misty_ft.png', 'misty_bk.png', 'misty_up.png',
     'misty_dn.png', 'misty_rt.png', 'misty_lf.png'];
     break;
     case 'tidepool':
     imagePrefix = ['tidepool_ft.png', 'tidepool_bk.png', 'tidepool_up.png',
     'tidepool_dn.png', 'tidepool_rt.png', 'tidepool_lf.png'];
     break;

     }
     var materialArray = [];
     for (var i = 0; i < 6; i++) {
     var matr = new THREE.MeshBasicMaterial({
     map: THREE.ImageUtils.loadTexture(App.types.urlImg + imagePrefix[i]),
     side: THREE.BackSide
     });
     materialArray.push(matr);
     }
     skyBox.material = new THREE.MeshFaceMaterial(materialArray);
     },//add background
     add: function () {
     var imagePrefix = ['dawnmountain-xpos.png', 'dawnmountain-xneg.png', 'dawnmountain-ypos.png',
     'dawnmountain-yneg.png', 'dawnmountain-zpos.png', 'dawnmountain-zneg.png'], materialArray = [],
     skyGeometry = new THREE.BoxGeometry(10000, 10000, 10000), skyBox;
     for (var i = 0; i < 6; i++)
     materialArray.push(new THREE.MeshBasicMaterial({
     map: THREE.ImageUtils.loadTexture(App.types.urlImg + imagePrefix[i]),
     side: THREE.DoubleSide
     }));
     skyBox = new THREE.Mesh(skyGeometry, new THREE.MeshFaceMaterial(materialArray));
     scene.add(skyBox);
     App.types.skyBox = skyBox;
     }//add background
     };//settings for background*/
}
$(document).ready(function () {
    new Apps();
    //App.rebuildSkyBox.add();
});
