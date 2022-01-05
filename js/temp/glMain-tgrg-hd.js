(function (exports) {
    console.log("glMain v2.2");

    var objects = [];
    var bfHolder;
    var sceneHolder = new THREE.Object3D();
    var aspectRatio;
    var resizeFact = false;
    var sceneLL = false;
    var scenePhoto = false;
    var locationLL = false;
    var objCenter;
    var WEATHER_KEY = "d1f928117b4671c4c6babde3ee84ce4e";
    var maxAnisotropy = 1;
    var container;
    var controls;
    var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    var rotateObject = false;
    var rotateAnimation = false;

    /**
     * @author alteredq / http://alteredqualia.com/
     *
     * Based on Nvidia Cg tutorial
     */

    THREE.FresnelShader = {
        uniforms: {
            "mRefractionRatio": {type: "f", value: 1.02},
            "mFresnelBias": {type: "f", value: 0.1},
            "mFresnelPower": {type: "f", value: 2.0},
            "mFresnelScale": {type: "f", value: 1.0},
            "tCube": {type: "t", value: null}
        },
        vertexShader: [
            "uniform float mRefractionRatio;",
            "uniform float mFresnelBias;",
            "uniform float mFresnelScale;",
            "uniform float mFresnelPower;",

            "varying vec3 vReflect;",
            "varying vec3 vRefract[3];",
            "varying float vReflectionFactor;",

            "void main() {",

            "vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",
            "vec4 worldPosition = modelMatrix * vec4( position, 1.0 );",

            "vec3 worldNormal = normalize( mat3( modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz ) * normal );",

            "vec3 I = worldPosition.xyz - cameraPosition;",

            "vReflect = reflect( I, worldNormal );",
            "vRefract[0] = refract( normalize( I ), worldNormal, mRefractionRatio );",
            "vRefract[1] = refract( normalize( I ), worldNormal, mRefractionRatio * 0.99 );",
            "vRefract[2] = refract( normalize( I ), worldNormal, mRefractionRatio * 0.98 );",
            "vReflectionFactor = mFresnelBias + mFresnelScale * pow( 1.0 + dot( normalize( I ), worldNormal ), mFresnelPower );",

            "gl_Position = projectionMatrix * mvPosition;",

            "}"
        ].join("\n"),
        fragmentShader: [
            "uniform samplerCube tCube;",

            "varying vec3 vReflect;",
            "varying vec3 vRefract[3];",
            "varying float vReflectionFactor;",

            "void main() {",

            "vec4 reflectedColor = textureCube( tCube, vec3( -vReflect.x, vReflect.yz ) );",
            "vec4 refractedColor = vec4( 1.0 );",

            "refractedColor.r = textureCube( tCube, vec3( -vRefract[0].x, vRefract[0].yz ) ).r;",
            "refractedColor.g = textureCube( tCube, vec3( -vRefract[1].x, vRefract[1].yz ) ).g;",
            "refractedColor.b = textureCube( tCube, vec3( -vRefract[2].x, vRefract[2].yz ) ).b;",

            "gl_FragColor = mix( refractedColor, reflectedColor, clamp( vReflectionFactor, 0.0, 1.0 ) );",

            "}"
        ].join("\n")
    };

    $("#button1").on("click", function () {
        $("#yaw-slider, #x-slider, #y-slider, #z-slider").slider('value', 0);
        rotateModel(new THREE.Vector3(0, 0, 0), "tweak", "yaw");
        moveModel(new THREE.Vector3(0, 0, 0), "tweak", "x");
        moveModel(new THREE.Vector3(0, 0, 0), "tweak", "y");
        moveModel(new THREE.Vector3(0, 0, 0), "tweak", "z");
    });

    function resizeViewport(width, height) {
        if (resizeFact || height) {
            var curHeight = window.innerHeight;
            var newHeight = curHeight;
            if (height) aspectRatio = width / height;
            var newWidth = curHeight * aspectRatio;
            if (newWidth >= window.innerWidth) {
                var curWidth = window.innerWidth;
                var newWidth = curWidth
                if (height) aspectRatio = width / height;
                var newHeight = newWidth / aspectRatio;
            }
            if (data.focalLength) {
                //data.focalLength = 21;
                camera.setLens(data.focalLength);
            }
        } else {
            var curWidth = $("#glCanvas").width();
            var newWidth = curWidth;
            aspectRatio = width / window.innerHeight;
            var newHeight = curWidth / aspectRatio;
            camera.fov = 45;
            //camera.setLens(21);
        }

        camera.aspect = aspectRatio;
        camera.updateProjectionMatrix();

        renderer.setSize(newWidth | 0, newHeight | 0);

        var $canvas = $("#glCanvas").find("canvas");

        $(".ui-bottom").css({
            bottom: $canvas.offset().top
        }).find(".wrapper").width($canvas.width());

        gOnce = true;
    }

    //Model Selection Form
    //modelDialog = $("#modelDialog").dialog({
    //    autoOpen: false,
    //    modal: true,
    //    width: "90%",
    //    title: "Select Model",
    //    open: function () {
    ////        bxSlider.reloadSlider();
    //    },
    //    buttons: {
    //        "Done": function () {
    //            modelDialog.dialog("close")
    //        }
    //    }
    //});

    bxSlider = $(".modelSlider").bxSlider({
        captions: true,
        minSlides: 1,
        maxSlides: 10,
        moveSlides: 1,
        slideWidth: 450
    });

    $(".modelSlider img").click(function (e) {
        //    $("#modelDialog").dialog("close");
        fileparts = e.target.src.split("/");
        filename = fileparts[fileparts.length - 1];
        fileid = filename.split(".")[0];
        loadModel(fileid);
    });

    var lat = 0, lon = -90, mY = 0, mX = 0, mLon = 0, mLat = 0, clicking = false;
    var gOnce = true;
    var gPhi = 0;
    var gTheta = 0;

    $('#glCanvas').mousedown(function (e) {
        e.preventDefault();

        LatLonFromCamera();

        mY = e.pageY;
        mLon = lon;
        mX = e.pageX;
        mLat = lat;

        clicking = true;

        if (gOnce) {
            gPhi = THREE.Math.degToRad(90 - Math.max(-85, Math.min(85, lat)));
            gTheta = THREE.Math.degToRad(lon);
            gOnce = false;
        }
    }).mouseup(function () {
        clicking = false;
    });

    function LatLonFromCamera() {
        camera.target.set(0, 0, -1);
        camera.localToWorld(camera.target);
        // http://www.geom.uiuc.edu/docs/reference/CRC-formulas/node42.html
        var x = camera.target.x - camera.position.x;
        var y = camera.target.z - camera.position.z;
        var z = camera.target.y - camera.position.y;
        var r = Math.sqrt(x * x + y * y + z * z);
        var cos_phi = z / r, phi = Math.acos(cos_phi);
        var theta = Math.atan2(y, x);
        lat = 90 - THREE.Math.radToDeg(phi);
        lon = THREE.Math.radToDeg(theta);
    }

    function rotateCameraToLatLon() {
        lat = Math.max(-85, Math.min(85, lat));
        var phi = THREE.Math.degToRad(90 - lat);
        var theta = THREE.Math.degToRad(lon);

        if (phi > gPhi + 0.40 || phi < gPhi - 0.40) {
            return false;
        }

        if (theta > gTheta + 0.42 || theta < gTheta - 0.42) {
            return false;
        }

        camera.target.x = camera.position.x + Math.sin(phi) * Math.cos(theta);//x
        camera.target.y = camera.position.y + Math.cos(phi);//z
        camera.target.z = camera.position.z + Math.sin(phi) * Math.sin(theta);//y

        camera.lookAt(camera.target);
    }

    $(document).ready(function () {
        $('#selectModelDialogBtn').click();

        $('#glCanvas').on('touchstart', function (event) {
            event.preventDefault();

            LatLonFromCamera();

            mY = event.originalEvent.changedTouches[0].pageY;
            mLon = lon;
            mX = event.originalEvent.changedTouches[0].pageX;
            mLat = lat;

            if (gOnce) {
                gPhi = THREE.Math.degToRad(90 - Math.max(-85, Math.min(85, lat)));
                gTheta = THREE.Math.degToRad(lon);
                gOnce = false;
            }
        }).on('touchmove', function (event) {
            event.preventDefault();

            lon = ( mX - event.originalEvent.changedTouches[0].pageX ) * 0.1 + mLon;
            lat = ( event.originalEvent.changedTouches[0].pageY - mY ) * 0.1 + mLat;

            rotateCameraToLatLon();
        });

        $("#imageInput").change(function () {
            setSceneFormDropbox.call(this);
        });

        $("#exifInput").change(function () {
            setLocationFormDropbox.call(this);
        });

        $('#glCanvas').mousemove(function (e) {
            if (clicking && controls.enabled === false) {
                switch (e.which) {
                    case 3:
                        // right mouse button
                        $("#z-slider").slider('value', $("#z-slider").slider('value') + (e.pageX - mX) * 0.025);
                        mX = e.pageX;
                        break;
                    case 1:
                        // left mouse button
                        lon = ( mX - e.pageX ) * 0.1 + mLon;
                        lat = ( e.pageY - mY ) * 0.1 + mLat;

                        rotateCameraToLatLon();
                        break;
                }
            }
        }).bind('wheel mousewheel', function (e) {
            e.preventDefault();
            var delta = e.originalEvent.wheelDelta || e.originalEvent.deltaY;
            (delta > 0) ? $("#yaw-slider").slider('value', $("#yaw-slider").slider('value') + 0.08) : $("#yaw-slider").slider('value', $("#yaw-slider").slider('value') - 0.08);
        });

        $("#yaw-slider").slider({
            orientation: 'vertical',
            min: -4,
            max: 4,
            step: 0.01,
            slide: function (event, ui) {
                var slideVec = new THREE.Vector3(0, ui.value, 0);
                rotateModel(slideVec, "tweak", "yaw");
            },
            change: function (event, ui) {
                var slideVec = new THREE.Vector3(0, ui.value, 0);
                rotateModel(slideVec, "tweak", "yaw");
            }
        });

        $("#yaw-slider").draggable();

        $("#x-slider").slider({
            orientation: 'vertical',
            min: -9.5,
            max: 30,
            step: 0.025,
            isRTL: false,
            slide: function (event, ui) {
                if (controls.enabled === false) {
                    var slideVec = new THREE.Vector3(ui.value, 0, 0);
                    moveModel(slideVec, "tweak", "x");
                } else {
                    var d = ui.value + 10;
                    controls.setRadius(d);
                    $(".distance").show().find("span").text((d <= 40 ? d : 40).toFixed(1));
                }
            }
        });

        $("#y-slider").slider({
            orientation: 'vertical',
            min: -30,
            max: 30,
            step: 0.025,
            slide: function (event, ui) {
                var slideVec = new THREE.Vector3(0, ui.value, 0);
                moveModel(slideVec, "tweak", "y");
            },
            change: function (event, ui) {
                var slideVec = new THREE.Vector3(0, ui.value, 0);
                moveModel(slideVec, "tweak", "y");
            }
        });

        $("#z-slider").slider({
            min: -3,
            max: 3,
            step: 0.01,
            slide: function (event, ui) {
                var slideVec = new THREE.Vector3(0, 0, ui.value);
                moveModel(slideVec, "tweak", "z");
            },
            change: function (event, ui) {
                var slideVec = new THREE.Vector3(0, 0, ui.value);
                moveModel(slideVec, "tweak", "z");
            }
        });
    });

    function getCanvasImg() {
        var canvas = document.getElementById('mCanvas');
        var link = document.getElementById('canvasImg');
        render(true);
        link.href = renderer.domElement.toDataURL('image/jpeg', 0.6);
        link.download = 'canvas.png';
        link.click();
    }

    //-----Aux Data Readers-----------------------

    function setSceneFormDropbox() {
        if (controls.enabled !== false) {
            controls.enabled = false;
            camera.position.set(0, 1.6764, 0);
            camera.lookAt(new THREE.Vector3(bfHolder.position.x, objCenter, bfHolder.position.z));
        }

        console.log("setLocationFormDropbox", lastType);

        if (lastType == "location") {
            var update = true;
        }

        readBackgroundFile(this);
        changeReflection(this, "scene");

        readExif(this, function (data) {
            console.log(51.502322, data.latitude);
            console.log(-0.12299, data.longitude);
            console.log(data.dateTime);

            resizeViewport(data.width, data.height);
            if (data.latitude && data.longitude) {
                position = lonLatToVector3(data.latitude, data.longitude);
                rotation = data.rotation;
                var p = new LatLon(data.latitude, data.longitude);

                updateScenePlacement(position, rotation, p, "viewer");
                var dateArr = data.dateTime.split(' ');
                var dDate = dateArr[0].replace(/:/g, '-');
                var dTime = dateArr[1];

                //////////////////////////////
                var suncoord;
                $.ajax({
                    type: "get",
                    dataType: 'jsonp',
                    url: "https://api.forecast.io/forecast/" + WEATHER_KEY + "/" + data.latitude + "," + data.longitude + "," + dDate + "T" + dTime,
                    success: function (result) {
                        var date = moment(dDate + ' ' + dTime + ' +0000', "YYYY-MM-DD HH:mm Z");
                        //var lastIndex = date.lastIndexOf(" ");

                        //date = date.substring(0, lastIndex);
                        var date2 = dDate + ' ' + dTime;

                        console.log('Weather', result);
                        console.log("DATE, LAT, LONG", date, date2, data.latitude, data.longitude);
                        suncoord = SunCalc.getPosition(date, data.latitude, data.longitude);
                        console.log("SUN POSITION", suncoord);

                        dirLight.position.set(Math.cos(suncoord.azimuth) * Math.cos(suncoord.altitude),
                            Math.sin(suncoord.altitude),
                            Math.sin(suncoord.azimuth) * Math.cos(suncoord.altitude)).normalize();

                        dirLight.position.multiplyScalar(70);
                        /**
                         * Sun effects
                         * @type {boolean}
                         */
                        dirLight.shadowCameraVisible = false;
                        dirLight.shadowCameraFar = 3500;
                        //dirLight.shadowBias = -0.0001;

                        console.log('suncoods position', dirLight.position.y);
                        var cloudCover;
                        if (dirLight.position.y > 0) {
                            switch (result.daily.data[0].icon) {
                                case "rain":
                                case "fog":
                                    console.warn("very clody");
                                    cloudCover = 0.8;
                                    dirLight.intensity = 0.5;
                                    dirLight.color = new THREE.Color(0xB3B4BB);
                                    break;
                                case "partly-cloudy-day":
                                case "wind":
                                    console.warn("partly clody");
                                    cloudCover = 0.5;
                                    dirLight.intensity = 0.7;
                                    dirLight.color = new THREE.Color(0xD2D3DA);
                                    break;
                                case "clear-day":
                                    console.warn("clear day");

                                    if (dirLight.position.y < 11) {
                                        console.warn("SUN RR");
                                        cloudCover = 0.2;
                                        dirLight.intensity = 0.85;
                                        dirLight.color = new THREE.Color(0xFFF176);
                                    } else {
                                        console.warn("SUN AS USUAL");
                                        cloudCover = 0.2;
                                        dirLight.intensity = 0.95;
                                        dirLight.color = new THREE.Color(0xFFF9C4);
                                    }
                                    break;
                            }
                        } else {
                            console.warn("NIGHT");
                            cloudCover = 0.5;
                            dirLight.intensity = 0.5;
                            dirLight.color = new THREE.Color(0xB0BEC5);
                        }

                        dirLight.shadowDarkness = (1 - cloudCover) * 0.9;

                        //var axis = new THREE.AxisHelper(6);
                        //scene.add(axis);
                        sceneHolder.rotation.y = 90 * Math.PI / 180 - data.rotation - Math.PI || sceneHolder.rotation.y;
                        //camera.position.y = 50;
                        //camera.lookAt(sceneHolder.position);

                        //sceneHolder.add(new THREE.AxisHelper(100));
                        camera.rotation.set(0, sceneHolder.rotation.y, 0);

                        if (update) {
                            updateLocation(globalUpdateLoaction);
                        }
                    }
                });

                function getSunPosPoint(date, lat, lng) {
                    var pos = SunCalc.getPosition(date, lat, lng),
                        angle = Math.PI / 2 + pos.azimuth;
                    return {
                        x: 100 * Math.cos(angle) * Math.cos(pos.altitude),
                        y: 100 * Math.sin(angle) * Math.cos(pos.altitude),
                        z: 100 * Math.sin(pos.altitude),
                        altitude: pos.altitude
                    };
                }
                ////////////////////////////
            } else {
                //var localLatitude = 0;
                //var localLongitude = 0;
                //
                //navigator.geolocation.getCurrentPosition(function (geolocation) {
                //    localLatitude = geolocation.latitude;
                //    localLongitude = geolocation.longitude;
                //});
                //
                //var localPosition = lonLatToVector3(localLatitude, localLongitude);
                //var localRotation = 0;
                //
                //var p = new LatLon(localLatitude, localLongitude);
                //
                //updateScenePlacement(localPosition, localRotation, p, "viewer");
            }

            if (!$.isEmptyObject(data)) {
                scenePhoto = true;
                sceneLL = data.latitude ? true : false;
            }

            $('#old-bar').hide();
            $('#button1').hide();
            $('.iconMove').show();

            $(".ui-bottom").show();
            $(".ui-top .btn-play").hide();
            rotateAnimation = false;
        }, 'scene');

        if (this.files && this.files[0]) {
            var reader = new FileReader();

            reader.onload = function (e) {
                $("#uploadImagesDialog").find(".scene-preview").attr("src", e.target.result);
            };

            reader.readAsDataURL(this.files[0]);
        }

        gOnce = true;
    }

    function setLocationFormDropbox() {
        if (controls.enabled !== false) {
            controls.enabled = false;
            camera.position.set(0, 1.6764, 0);
            camera.lookAt(new THREE.Vector3(bfHolder.position.x, objCenter, bfHolder.position.z));
        }

        console.log("setLocationFormDropbox", lastType);

        if (lastType == "scene") {
            updateLocation(this);
        } else {
            globalUpdateLoaction = this;
            console.log("Last !scene");
        }

        if (this.files && this.files[0]) {
            var reader = new FileReader();

            reader.onload = function (e) {
                $("#uploadImagesDialog").find(".location-preview").attr("src", e.target.result);
            };

            reader.readAsDataURL(this.files[0]);
        }

        changeReflection(this, "location");
    }

    var globalUpdateLoaction;
    function updateLocation(self) {
        self = globalUpdateLoaction || self;

        readExif(self, function (data) {
            if (data.latitude && data.longitude) {
                position = lonLatToVector3(data.latitude, data.longitude);
                rotation = data.rotation;
                var p = new LatLon(data.latitude, data.longitude);

                updateScenePlacement(position, rotation, p, "placement");
            } else {
                //var localLatitude = 0;
                //var localLongitude = 0;
                //
                //navigator.geolocation.getCurrentPosition(function (geolocation) {
                //    localLatitude = geolocation.latitude;
                //    localLongitude = geolocation.longitude;
                //});
                //
                //var localPosition = lonLatToVector3(localLatitude, localLongitude);
                //var localRotation = 0;
                //
                //var p = new LatLon(localLatitude, localLongitude);
                //
                //updateScenePlacement(localPosition, localRotation, p, "placement");
            }

            if (!$.isEmptyObject(data)) {
                locationLL = data.latitude ? true : false;
            }
        });

        gOnce = true;
    }

    function readBackgroundFile(input) {
        if (input.files && input.files[0]) {
            var reader = new FileReader();
            reader.onload = function (e) {
                loadBackground(e.target.result, input);
                var exif = new ExifReader();

                //$( '#imgsource' ).attr('src', e.target.result);
            };
            reader.readAsDataURL(input.files[0]);
        }
    }

    var lastType;

    function changeReflection(input, type) {
        if (type == "scene" && lastType == "location") {
            return;
        }

        lastType = type;

        if (input.files && input.files[0]) {
            var reader = new FileReader();
            reader.onload = function (e) {
                var map = THREE.ImageUtils.loadTexture(e.target.result, THREE.UVMapping, function () {
                    if (map.image) {
                        var imageUrl;
                        var imageWidth = 512;
                        var imageHeight = 512;
                        var imageResize = document.createElement('canvas');

                        imageResize.width = imageWidth;
                        imageResize.height = imageHeight;
                        imageResize.getContext('2d').drawImage(map.image, 0, 0, imageWidth, imageHeight);

                        imageUrl = imageResize.toDataURL();

                        model.traverse(function (child) {
                            if (child instanceof THREE.Mesh && child.material.envMap) {
                                var urls = [
                                    imageUrl,
                                    imageUrl,
                                    imageUrl,
                                    imageUrl,
                                    imageUrl,
                                    imageUrl
                                ];

                                var reflectionCube = THREE.ImageUtils.loadTextureCube(urls);
                                reflectionCube.format = THREE.RGBFormat;

                                child.material.envMap = reflectionCube;
                                child.material.needsUpdate = true;
                            }
                        });
                    }
                });
            };

            reader.readAsDataURL(input.files[0]);
        }
    }

    function readExif(input, callback, state) {
        reader = new FileReader();

        reader.onload = function (e) {
            exif = new ExifReader();
            exif.load(e.target.result);

            gps = {};
            data = {};
            data.focalLength = Number(exif.getTagDescription('FocalLengthIn35mmFilm'));
            data.width = exif.getTagDescription("PixelXDimension");
            data.height = exif.getTagDescription("PixelYDimension");
            data.latitudeRef = exif.getTagDescription('GPSLatitudeRef');
            data.latitude = state != 'scene' ? Number(exif.getTagDescription('GPSLatitude')) : Number(exif.getTagDescription('GPSLatitude')) || 51.502322;
            data.longitudeRef = exif.getTagDescription('GPSLongitudeRef');
            data.longitude = state != 'scene' ? Number(exif.getTagDescription('GPSLongitude')) : Number(exif.getTagDescription('GPSLongitude')) || -0.12299;
            data.altitudeRef = exif.getTagDescription('GPSAltitudeRef');
            data.dateTime = exif.getTagDescription('DateTimeOriginal') || exif.getTagDescription('DateTime');

            if (exif.getTagDescription('GPSAltitude')) data.altitude = Number(exif.getTagDescription('GPSAltitude').slice(0, -1));
            data.rotationRef = exif.getTagDescription('GPSImgDirectionRef');
            data.rotation = Number(exif.getTagDescription('GPSImgDirection')) * (Math.PI / 180);

            console.log(exif.getAllTags());

            callback(gps);
            callback(data);
        };

        if (input.files.length > 0) {
            reader.readAsArrayBuffer(input.files[0].slice(0, 128 * 1024));
        }
    }

    //------Global threejs Variables---------------------

    var camera, scene, renderer, dirLight, hemiLight;
    var watermark;

    var cameraPos = new THREE.Vector3(0, 0, 0);
    var bgPos = new THREE.Vector3(0, 0, -2);

    var startingModelPos = new THREE.Vector3(0, 0, 0);
    var startingModelRot = new THREE.Euler(Math.PI, 0, 0);

    var modelLoader = {};

    var windowHalfX = window.innerWidth / 2;
    var windowHalfYo = window.innerHeight / 2;

    var viewerPosition = null;
    var placementPosition = null;
    var viewerRotation = null;
    var placementRotation = null;

    var model;

    function loadBackground(filename, input) {
        var map = THREE.ImageUtils.loadTexture(filename, THREE.UVMapping, function () {
            var background = scene.getObjectByName('background');

            if (!background) {
                var distance = camera.far - 0.01 * (camera.far - camera.near);
                var height = 2 * distance * Math.tan(THREE.Math.degToRad(camera.fov / 2));
                var width = map.image.width * height / map.image.height;
                var background = new THREE.Mesh(new THREE.PlaneBufferGeometry(width, height));
                background.position.z = -distance;
                background.name = 'background';
                camera.add(background);
            }

            var maxSide = 2048;

            if ((map.image.width > maxSide) || (map.image.height > maxSide)) {
                var w = Math.min(map.image.width, maxSide);
                var h = Math.min(map.image.height, maxSide);
                var image2 = document.createElement('canvas');
                image2.width = w;
                image2.height = h;
                image2.getContext('2d').drawImage(map.image, 0, 0, w, h);
                map.image = image2;
            }

            THREE.ShaderLib["basic"].fragmentShader = basicFragmentShader(true);

            map.wrapS = map.wrapT = THREE.ClampToEdgeWrapping;
            map.minFilter = THREE.NearestFilter;

            background.material = new THREE.MeshBasicMaterial({
                map: map,
                side: THREE.DoubleSide
            });

            var reader = new FileReader();
            reader.onload = function (e) {
                var exif = new ExifReader();
                exif.load(e.target.result);

                var orientation = exif.getTagDescription('Orientation');

                switch (orientation) {
                    case "bottom-right":
                        background.rotation.z = Math.PI;
                        break;
                    case "right-top":
                        background.rotation.z = -(Math.PI / 2);
                        break;
                }
            };

            if (input.files.length > 0) {
                reader.readAsArrayBuffer(input.files[0].slice(0, 128 * 1024));
            }
        });
    }

    var loadPhoto = false;

    function updateScenePlacement(position, rotation, p, agent) {
        resizeFact = true;
        if (agent == "viewer") {
            viewerRotation = new THREE.Vector3(0, rotation, 0);
            viewerPosition = position;

            viewerp = p
        }
        if (agent == "placement") {
            placementRotation = new THREE.Vector3(0, rotation, 0);
            placementPosition = position;

            placementp = p
        }

        //Calculates relative location of scene elements
        if (viewerPosition !== null && placementPosition !== null) {
            console.log(viewerPosition, placementPosition);
            var vectorDiff = placementPosition.sub(viewerPosition);

            //latlon-spherical script
            var d = viewerp.distanceTo(placementp);

            //$(".distance").show().find("span").text(d.toFixed(1));

            placementPosition.setY(0);
            placementPosition.multiplyScalar(100000);

            // normalise vector so it can manipulated by the latlon-spherical script
            placementPosition.normalize();

            // make the length of the vector equal to d
            placementPosition.multiplyScalar(d);

            // latlon-spherical d is slightly too long
            placementPosition.multiplyScalar(0.85);

            loadPhoto = true;

            moveModel(vectorDiff, "GPS", null, "update", rotation);

            rotateModel(new THREE.Vector3(0, 0, 0), "GPS");
        }
    }

    var last = {};
    var stepVal = {};
    var modelPos = new THREE.Vector3();

    function moveModel(vector, movementSource, dimension, flag, rotation) {
        //Movement source is GPS component, or tweak component
        model = scene.getObjectByName("model");

        if (movementSource == "GPS") {
            model.userData.gpsPos = vector;
        }
        if (movementSource == "tweak") {
            cIdx = ["x", "y", "z"].indexOf(dimension);
            if (cIdx < 0) {
                throw new Error("Dimension must be x, y, or z")
            }
            dimVal = vector.getComponent(cIdx);
            model.userData.tweakPos.setComponent(cIdx, dimVal);
        }

        if (loadPhoto) {
            if (flag == "update") {
                bfHolder.position.addVectors(model.userData.gpsPos, model.userData.tweakPos);
                //            bfHolder.position.z = model.userData.gpsPos.z;//(model.userData.gpsPos, model.userData.tweakPos);

                if (!(model.userData.gpsPos.x == 0 && model.userData.gpsPos.y == 0 && model.userData.gpsPos.z == 0 )) {
                    //                bfHolder.lookAt(camera.position);
                    stepVal = {
                        x: bfHolder.position.x / 50,
                        z: bfHolder.position.z / 50
                    };
                } else {
                    bfHolder.position.x += 1;
                    bfHolder.position.z += 1;
                    stepVal = {
                        x: 0.025,
                        z: 0.025
                    };
                }

                //            if (movementSource != "tweak") camera.lookAt(new THREE.Vector3(bfHolder.position.x, objCenter, bfHolder.position.z));
                modelPos.copy(bfHolder.position);

                //            camera.lookAt(new THREE.Vector3(bfHolder.position.x, objCenter, bfHolder.position.z));
                //            if((model.userData.gpsPos.x == 0 && model.userData.gpsPos.y == 0 && model.userData.gpsPos.z == 0 )){
                //                bfHolder.lookAt(camera.position);
                //            }came
                rotateModel(new THREE.Vector3(0, -Math.abs(rotation + bfHolder.rotation.y), 0), "fix");
                var eObj1 = new THREE.Object3D();

                sceneHolder.add(eObj1);
                //bfHolder.add(new THREE.AxisHelper(100));

                eObj1.lookAt(bfHolder.position);
                sceneHolder.rotation.y += eObj1.rotation.y; //-7.454
                if (eObj1.rotation.z > -3.14 && eObj1.rotation.z < 3.14) {
                    sceneHolder.rotation.y -= eObj1.rotation.y;
                    sceneHolder.rotation.y -= eObj1.rotation.y;
                    sceneHolder.rotation.y += Math.PI;
                }
                //            x*Math.PI/180

            } else {
                var bfPosition = bfHolder.position.clone();

                if (model.userData.tweakPos.x != last.x) {
                    var moveVal = model.userData.tweakPos.x != 0 ? model.userData.tweakPos.x : 1;

                    bfPosition.x = modelPos.x - moveVal * stepVal.x;
                    bfPosition.z = modelPos.z - moveVal * stepVal.z;

                    if (new THREE.Vector3(0, 0, 0).distanceTo(bfPosition) <= 40) {
                        bfHolder.position.copy(bfPosition);
                    }

                    if (movementSource != "tweak") {
                        camera.lookAt(new THREE.Vector3(bfHolder.position.x, objCenter, bfHolder.position.z));
                    }
                }

                last.x = model.userData.tweakPos.x;
                model.position.y = model.userData.tweakPos.y;

                if (model.userData.tweakPos.z != last.z) {
                    bfHolder2.position.x = model.userData.tweakPos.z;
                }

                last.z = model.userData.tweakPos.z;
            }
        } else {
            if (flag == "update") {
                bfHolder.position.set(0, 0, -10);
            } else {
                var bfPosition = bfHolder.position.clone();

                bfPosition.z = model.userData.tweakPos.x - 10;
                model.position.y = model.userData.tweakPos.y;
                model.position.x = model.userData.tweakPos.z;
                //            camera.lookAt(new THREE.Vector3(bfHolder.position.x, objCenter, bfHolder.position.z));

                if (new THREE.Vector3(0, 0, 0).distanceTo(bfPosition) <= 40) {
                    bfHolder.position.copy(bfPosition);
                }
            }
        }

        if (controls.enabled !== false) {
            controls.target = new THREE.Vector3(bfHolder.position.x, 1, bfHolder.position.z);
        }

        var d = new THREE.Vector3(0, 0, 0).distanceTo(bfHolder.position);
        $(".distance").show().find("span").text((d <= 40 ? d : 40).toFixed(1));
    }

    function rotateModel(vector, rotationSource, axis) {
        //source is fix component, GPS component, or tweak component
        model = scene.getObjectByName("model");
        if (rotationSource == "fix") {
            model.userData.fixRot = vector;
        }
        if (rotationSource == "GPS") {
            model.userData.gpsRot = vector;
        }

        if (rotationSource == "tweak") {
            cIdx = ["pitch", "yaw", "roll"].indexOf(axis);
            if (cIdx < 0) {
                throw new Error("Axis must be pitch, yaw, roll")
            }
            dimVal = vector.getComponent(cIdx);
            model.userData.tweakRot.setComponent(cIdx, dimVal);
        }

        var rotationSum = new THREE.Vector3();
        rotationSum.addVectors(model.userData.gpsRot, model.userData.tweakRot);
        rotationSum.add(model.userData.fixRot);

        model.rotation.setFromVector3(rotationSum);
    }

    var bfHolder2;

    function loadModel(modelName) {
        var model = scene.getObjectByName("model");

        if (model) {
            var gpsPos = model.userData.gpsPos;
            var tweakPos = model.userData.tweakPos;

            var gpsRot = model.userData.gpsRot;
            var tweakRot = model.userData.tweakRot;
            var fixRot = new THREE.Vector3(Math.PI, 0, 0);
            var fixRot = new THREE.Vector3(0, 0, 0);
            scene.remove(model);
        } else {
            var gpsPos = startingModelPos;
            var tweakPos = new THREE.Vector3();

            var gpsRot = startingModelRot;
            var tweakRot = new THREE.Vector3();
            var fixRot = new THREE.Vector3(Math.PI, 0, 0);
            var fixRot = new THREE.Vector3(0, 0, 0);
        }

        console.log(model);
        //var loader = new THREE.JSONLoader();
        //loader.load( 'monster.json', function ( geometry, materials ) {
        //    var mesh = new THREE.Mesh( geometry, new THREE.MeshFaceMaterial( materials ) );
        //    scene.add( mesh );
        //});
        // modelLoader.loader.load('models/' + modelName + '/' + modelName + '.json', function (object) {

        modelLoader.loader.load('models/' + modelName + '.obj', 'models/' + modelName + '.mtl', function (object) {
            if (model) {
                object.name = "model";
                object.userData = model.userData;
                object.position.copy(model.position);
                object.rotation.copy(model.rotation);

                console.log("Load new model");

                bfHolder2.remove(model);
                bfHolder2.add(object);
            } else {
                if (bfHolder) {
                    sceneHolder.remove(bfHolder);
                }

                object.name = "model";

                bfHolder = new THREE.Object3D();
                bfHolder2 = new THREE.Object3D();

                sceneHolder.add(bfHolder);
                bfHolder.add(bfHolder2);
                bfHolder2.add(object);

                object.userData.gpsPos = new THREE.Vector3();
                object.userData.tweakPos = new THREE.Vector3();

                moveModel(gpsPos, "GPS", null, "update");
                moveModel(tweakPos, "tweak", "x", "update");
                moveModel(tweakPos, "tweak", "y", "update");
                moveModel(tweakPos, "tweak", "z", "update");

                object.userData.gpsRot = new THREE.Vector3();
                object.userData.tweakRot = new THREE.Vector3();
                object.userData.fixRot = new THREE.Vector3();

                var box = new THREE.Box3().setFromObject(object);
                var axis = new THREE.AxisHelper(11);

                axis.visible = true;
                objCenter = box.size().y / 2;

                //object.add(axis);

                camera.lookAt(new THREE.Vector3(bfHolder.position.x, objCenter, bfHolder.position.z));

                rotateModel(fixRot, "fix");
            }

            function findTextureUrl(find, json) {
                var url = null;

                $.each(json.textures, function (key, texture) {
                    if (texture.uuid == find) {
                        $.each(json.images, function (key, image) {
                            if (image.uuid == texture.image) {
                                url = image.url;

                                return false;
                            }
                        });

                        return false;
                    }
                });

                return url;
            }

            $.getJSON('models/' + modelName + '.json', function (json) {
                console.log(modelName);

                $.each(json.materials, function (key, material) {
                    object.traverse(function (child) {
                        if (child instanceof THREE.Mesh && material.name == child.material.name) {
                            child.material.color = new THREE.Color(material.color);
                            child.material.specular = new THREE.Color(material.specular); // or #111111
                            child.material.emissive = new THREE.Color(material.emissive);
                            child.material.ambient = new THREE.Color(material.ambient);
                            child.material.shininess = material.shininess;
                            child.material.shading = THREE.SmoothShading;

                            if (material.map) {
                                var url = findTextureUrl(material.map, json);
                                var texture = THREE.ImageUtils.loadTexture("models/" + url);

                                if (texture) {
                                    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                                    texture.format = THREE.RGBFormat;
                                    texture.repeat.set(1, 1);
                                    texture.needsUpdate = true;

                                    child.material.map = texture;
                                    child.material.map.anisotropy = maxAnisotropy;
                                    child.material.needsUpdate = true;
                                }
                            }

                            if (material.bumpMap) {
                                var url = findTextureUrl(material.bumpMap, json);
                                var texture = THREE.ImageUtils.loadTexture("models/" + url);

                                if (texture) {
                                    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                                    texture.format = THREE.RGBFormat;
                                    texture.repeat.set(1, 1);
                                    texture.needsUpdate = true;

                                    child.material.bumpMap = texture;
                                    child.material.bumpScale = material.bumpScale / 10;
                                    child.material.needsUpdate = true;
                                }
                            }

                            if (material.name.indexOf('mt-metal') === 0) {
                                var url = "mt_Metal_Aluminum_Anodized.jpg";
                                var texture = THREE.ImageUtils.loadTexture("models/" + url);

                                if (texture) {
                                    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                                    texture.format = THREE.RGBFormat;
                                    texture.repeat.set(1, 1);
                                    texture.needsUpdate = true;

                                    child.material.color = new THREE.Color("#222222");
                                    child.material.map = texture;
                                    child.material.bumpMap = texture;
                                    child.material.bumpScale = 0.001;
                                    child.material.needsUpdate = true;
                                }
                            }

                            if (material.name.indexOf('tg-') === 0) {
                                var path = "textures/";
                                var format = '.jpg';
                                var urls = [
                                    path + 'posx' + format, path + 'negx' + format,
                                    path + 'posy' + format, path + 'negy' + format,
                                    path + 'posz' + format, path + 'negz' + format
                                ];

                                var texture = THREE.ImageUtils.loadTextureCube(urls);

                                if (texture) {
                                    texture.format = THREE.RGBFormat;
                                    texture.needsUpdate = true;

                                    child.material.envMap = texture;
                                    child.material.color = new THREE.Color("#444444");
                                    child.material.specular = new THREE.Color("#777777");
                                    child.material.transparent = true;
                                    child.material.opacity = 0.5;
                                    child.material.reflectivity = 0.25;
                                    child.material.shininess = 100;
                                    child.material.needsUpdate = true;
                                }
                            }
                        }
                    });
                });
            });

            var light = new THREE.DirectionalLight(0xffffff, 1);
            light.name = "light";
            light.position.set(0, 25, 0);
            light.target = object;

            light.castShadow = true;
            light.onlyShadow = true;
            light.shadowMapHeight = light.shadowMapWidth = 4096;
            light.shadowMapDarkness = 1;
            light.shadowBias = 0.0;
            light.shadowCameraVisible = false;
            light.shadowCameraNear = 1;
            light.shadowCameraFar = 100;

            var d = 100;

            light.shadowCameraLeft = -d;
            light.shadowCameraRight = d;
            light.shadowCameraTop = d;
            light.shadowCameraBottom = -d;

            object.add(light);

            THREE.ShaderLib["basic"].fragmentShader = basicFragmentShader(isMobile);

            var geometry = new THREE.PlaneBufferGeometry(100, 100);
            var material = new THREE.MeshBasicMaterial({
                color: 0x000000,
                transparent: true,
                opacity: 0
            });

            var plane = new THREE.Mesh(geometry, material);

            plane.name = "shadow";
            plane.position.y = -0.035;
            plane.rotation.x = -Math.PI / 2;
            plane.castShadow = false;
            plane.receiveShadow = true;

            object.traverse(function (child) {
                if (child instanceof THREE.Mesh) {
                    child.castShadow = true;
                    child.receiveShadow = false;

                    if (child.name != "light" && child.name != "shadow") {
                        objects.push(child);
                    }

                    //console.log(child.material.name + " : " + child.material.shading + " = " + THREE.SmoothShading + " : THREE.SmoothShading");
                    //console.log("-------------------------------------------------------------");
                }
            });

            object.add(plane);
            rotateObject = object;
        }, modelLoader.onProgress, modelLoader.onError);
    }

    function init(modelName) {
        container = $("#glCanvas");
        scene = new THREE.Scene();

        // set up a global camera. then just update it's properties when needed
        camera = new THREE.PerspectiveCamera(45, container.width() / container.height(), .1, 2000);
        camera.target = new THREE.Vector3(0, 0, 0);
        camera.position.y = 1.6764;
        scene.add(camera);
        scene.add(sceneHolder);
        //Lighting
        //  var ambient = new THREE.AmbientLight( 0xffffff, 1.0 );
        //scene.add( ambient );
        var directionalLight = new THREE.DirectionalLight(0xffffff);
        directionalLight.position.set(-0.55, 2, 4);

        hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
        hemiLight.color.setHSL(0.5, 0.1, 1);
        hemiLight.groundColor.setHSL(0.095, 1, 0.75);
        hemiLight.position.set(0, 500, 0);
        scene.add(hemiLight);

        dirLight = new THREE.DirectionalLight(0xffffff, 1);
        //dirLight.color.setHSL(1, 1, 1);
        dirLight.position.set(-1, 0.25, 1);
        dirLight.position.multiplyScalar(50);

        dirLight.castShadow = true;
        dirLight.shadowCameraVisible = false;

        dirLight.shadowMapWidth = 2048;
        dirLight.shadowMapHeight = 2048;

        var d = 200;

        dirLight.shadowCameraLeft = -d;
        dirLight.shadowCameraRight = d;
        dirLight.shadowCameraTop = d;
        dirLight.shadowCameraBottom = -d;

        dirLight.shadowCameraFar = 10000;
        dirLight.shadowDarkness = 2;
        dirLight.shadowBias = 0.0;

        scene.add(dirLight);

        watermark = new THREE.Mesh(
            new THREE.PlaneBufferGeometry(1, 1),
            new THREE.ShaderMaterial({
                vertexShader: [
                    "varying vec4 pos;",
                    "void main () {",
                    "   gl_Position = projectionMatrix * (modelViewMatrix * vec4 (position, 1.0));",
                    "   pos = gl_Position;",
                    "}"
                ].join("\n"),
                fragmentShader: [
                    "uniform float iWidth;",
                    "uniform float iHeight;",
                    "uniform float cWidth;",
                    "uniform float cHeight;",
                    "uniform float z;",
                    "uniform sampler2D watermark;",
                    "varying vec4 pos;",
                    "void main () {",
                    "   float dx = 0.5 * (cWidth  / iWidth)  * (1.0 + pos.x / z);",
                    "   float dy = 0.5 * (cHeight / iHeight) * (1.0 - pos.y / z);",
                    "   gl_FragColor = texture2D (watermark, vec2 (1.0 - dx, dy));",
                    "}"
                ].join("\n"),
                transparent: true,
                uniforms: {
                    iWidth: {type: 'f', value: 1}, iHeight: {type: 'f', value: 1},
                    cWidth: {type: 'f', value: 1000}, cHeight: {type: 'f', value: 1000},
                    z: {type: 'f', value: 0.1},
                    watermark: {
                        type: 't',
                        value: THREE.ImageUtils.loadTexture('textures/watermark.png', THREE.UVMapping, function (texture) {
                            texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
                            watermark.material.uniforms.iWidth.value = texture.image.width;
                            watermark.material.uniforms.iHeight.value = texture.image.height;
                        })
                    }
                }
            })
        );
        watermark.updateMatrixWorld = function (force) {
            THREE.Object3D.prototype.updateMatrixWorld.call(this, force);
            watermark.material.uniforms.z.value = watermark.position.z;
            watermark.material.uniforms.cWidth.value = renderer.domElement.width;
            watermark.material.uniforms.cHeight.value = renderer.domElement.height;
        };
        watermark.position.z = -1.01 * camera.near;
        watermark.visible = false;
        camera.add(watermark);

        //Aux Loading for Model
        modelLoader.onProgress = function (xhr) {
            if (xhr.lengthComputable) {
                var $placeholder = $("#placeholder");
                var $progressbar = $placeholder.find(".progress > .progress-bar");

                var percentComplete = parseInt(xhr.loaded / xhr.total * 100);
                var percentString = percentComplete + "%";

                if (percentComplete < 100) {
                    $placeholder.show();
                    $progressbar.removeClass("active").css({
                        width: percentString
                    }).text(percentString);
                } else {
                    $placeholder.addClass("active").hide();
                }

            }
        };

        modelLoader.onError = function (xhr) {
        };

        THREE.Loader.Handlers.add(/\.dds$/i, new THREE.DDSLoader());

        modelLoader.loader = /*new THREE.ObjectLoader();*/ new THREE.OBJMTLLoader();

        loadModel(modelName);

        //loadBackground("samplePhotos/IMG_1915.JPG");

        window.addEventListener("resize", resizeListener, false);

        renderer = new THREE.WebGLRenderer({antialias: !isMobile, alpha: true});
        renderer.setSize(container.width(), container.height());
        //renderer.setClearColor(0xff0000);
        container.append(renderer.domElement);
        renderer.domElement.setAttribute('id', 'mCanvas');

        renderer.shadowMapEnabled = !isMobile;
        renderer.shadowMapSoft = false;
        renderer.shadowMapType = THREE.PCFSoftShadowMap;

        renderer.context.getShaderInfoLog = function () {
            return '';
        };

        renderer.context.getProgramInfoLog = function () {
            return '';
        };

        maxAnisotropy = renderer.getMaxAnisotropy();

        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enabled = true;

        animate();

        // GLOBAL DEBUG
        window.camera = camera;
    }

    function resizeListener() {
        //resizeViewport(window.innerWidth, window.innerHeight);
        resizeViewport(window.innerWidth);
    }

    var speed = 0;

    function animate() {
        if (rotateAnimation && rotateObject) {
            speed += 0.008;
            rotateModel(new THREE.Vector3(0, speed, 0), "fix");
        }

        requestAnimationFrame(animate);
        render();
    }

    function render(showWatermark) {
        watermark.visible = !!showWatermark;

        if (controls.enabled !== false) {
            controls.update();
        }

        renderer.render(scene, camera);
    }

    function showCallToAction(type) {
        $('#old-bar').hide();
        $('#button1').hide();
        $('.iconMove').show();

        $(".ui-bottom").show();
        $(".ui-top .btn-play").hide();
        rotateAnimation = false;

        var d = 0;
        var count = 0;
        var originPos = new THREE.Vector3().copy(modelPos);

        while (d < 40) {
            originPos.x += stepVal.x;
            originPos.z += stepVal.z;

            d = new THREE.Vector3(0, 0, 0).distanceTo(originPos);

            count++;
        }

        var min = (count == 0) ? count : count - 1;
        var max = ((modelPos.x / stepVal.x) + (modelPos.z / stepVal.z)) / 2;

        console.log("max: ", d, max);
        console.log("min: ", d, min);

        $("#x-slider").slider('option', {
            min: -min, max: max, isRTL: true
        });

        if (d > 40) {
            $('#openNoCoordsLengthDialogBtn').click();
            return;
        }

        switch (type) {
            case 'checkSceneCoords':
                if (sceneLL && locationLL) {
                    $('#openExistCoordsDialogBtn').click();
                } else {
                    $('#openNoCoordsDialogBtn').click();
                }
                break;
        }
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

    /////////////////////////////////////////

    function fullscreenToggle() {
        if (THREEx.FullScreen.activated()) {
            THREEx.FullScreen.cancel();
        } else {
            THREEx.FullScreen.request(document.body);
        }
    }

    function rotationToggle() {
        rotateAnimation = !rotateAnimation;

        if (rotateAnimation) {
            $(".ui-top .btn-play").addClass("pause");
        } else {
            $(".ui-top .btn-play").removeClass("pause");
        }
    }

    $(document).ready(function () {
        $(document).on("click", ".ui-top .btn-home", function () {
            location.reload();
        });

        $(document).on("click", ".ui-top .btn-move", function () {
            $("#controlsModalBtn").click();
        });

        $(document).on("click", ".ui-bottom .btn-model", function () {
            $('#selectModelDialogBtn').click();
        });

        $(document).on('webkitfullscreenchange mozfullscreenchange fullscreenchange MSFullscreenChange', function () {
            if (!THREEx.FullScreen.activated()) {
                $(".ui-top .btn-fullscreen").removeClass("open");
            } else {
                $(".ui-top .btn-fullscreen").addClass("open");
            }
        });
    });

    /////////////////////////////////////////

    exports.init = init;
    exports.loadModel = loadModel;
    exports.getCanvasImg = getCanvasImg;
    exports.setSceneFormDropbox = setSceneFormDropbox;
    exports.setLocationFormDropbox = setLocationFormDropbox;
    exports.showCallToAction = showCallToAction;
    exports.fullscreenToggle = fullscreenToggle;
    exports.rotationToggle = rotationToggle;
})(window.glMain || (window.glMain = {}));