/**
 * Created by Ninad - SweetShot on 13-06-2016.
 */

'use strict';
init2();
function init2() {




    // Globals
    var camera, scene, renderer;
    var effect;
    var element, container;

    var cardboard = false, forceCardboard = false;
    var video, videoImage, videoImageContext;
    var clock = new THREE.Clock();


    var isUserInteracting = false,
        lon = 0,
        lat = 0,
        phi = 0, theta = 0,
        oldTheta = 0, oldPhi = 0,
        distance = 500;
    var onPointerDownPointerX, onPointerDownPointerY, onPointerDownLon, onPointerDownLat;

    var gyroOn = false;
    var controls;

    var autoHideDelay = 5.0;
    var hideClock;
    
    // End Globals

    // Scale page properly for mobile devices
    /*
    var viewportmeta = document.querySelector('meta[name="viewport"]');
    var viewPortScale = 1 / window.devicePixelRatio;
    viewportmeta.content = "user-scalable=no, initial-scale="+ viewPortScale +", maximum-scale=1, minimum-scale=1, " +
        "width=device-width";
    */
    // End Scale


    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio );
    element = renderer.domElement;
    container = document.getElementById('example');
    container.appendChild(element);

    effect = new THREE.StereoEffect(renderer);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(60, 1, 1, 1100);
    //camera.target = new THREE.Vector3( 0, 0, 0 );
    scene.add(camera);

    //var axisHelper = new THREE.AxisHelper( 5 );
    //scene.add( axisHelper );

    // motion
    function setOrientationControls(e) {
        if (!e.alpha) {
            return;
        }

        controls = new THREE.DeviceOrientationControls(camera, true);
        controls.connect();
        controls.update();

        //container.addEventListener('click', fullscreen, false);
        fullscreen();
        gyroOn = true;
        window.removeEventListener('deviceorientation', setOrientationControls, true);
    }
    window.addEventListener('deviceorientation', setOrientationControls, true);


    var light = new THREE.HemisphereLight(0x777777, 0x000000, 0.6);
    scene.add(light);

    // Video texture

    video = document.createElement("video");
    video.autoplay = true;
    video.width = 3840;
    video.height = 1920;
    video.src = "textures/video.webm";

    videoImage = document.createElement("canvas");

    videoImageContext = videoImage.getContext("2d");
    videoImageContext.fillStyle = "#000000";

    video.addEventListener("loadedmetadata", setVideoDim, false);
    function setVideoDim() {
        video.width = video.videoWidth;
        video.height = video.videoHeight;
        videoImage.width  = video.width;
        videoImage.height = video.height;
        videoImageContext.fillRect(0 ,0, videoImage.width, videoImage.height);
    }
    video.play();


    var texture = new THREE.VideoTexture( video );
    texture.minFilter = THREE.LinearFilter;
    texture.format = THREE.RGBFormat;

    var material   = new THREE.MeshBasicMaterial( { map : texture} );

    var geometry = new THREE.SphereBufferGeometry( 500, 60, 40 );
    geometry.scale( - 1, 1, 1 );


    var mesh = new THREE.Mesh(geometry, material);

    scene.add(mesh);

    window.addEventListener('resize', resize, false);
    setTimeout(resize, 1);

    // Controls
    var s = "<img id='canvasPlayImg' src='textures/pause.png'>" +
        "<img id='canvasCardboard' src='textures/cardboard.png'>" +
        "<div id='canvasTimeText' class='textContainer tx' style='font-weight: 700; color: azure; " +
        "vertical-align: middle; display:table-cell;text-align: center; '>??</div>" +
        "<input type='file' id='openfile'></input>";

    var child = document.createElement("div");
    child.className += "controlsClass";
    var buttons = htmlToElement(s);
    child.appendChild(buttons);
    container.appendChild(child);


    function htmlToElement(html) {
        var template = document.createElement('template');
        template.innerHTML = html;
        return template.content;
    }

    document.getElementById('canvasPlayImg').addEventListener('click', function (event) {
        videoControls(video, "pp");
        if (video.paused){
            document.getElementById("canvasPlayImg").src = "textures/play.png";
        } else {
            document.getElementById("canvasPlayImg").src = "textures/pause.png";
        }
    });

    document.getElementById('canvasCardboard').addEventListener('click', function (event) {
        if (cardboard){
            forceCardboard = false;
        } else {
            forceCardboard = true;
        }
        resize();
    });
    document.getElementById("openfile").addEventListener('change', function (event) {
       playFile(this.files[0]);
    });

    element.addEventListener( 'mousedown', onDocumentMouseDown, false );
    element.addEventListener( 'mousemove', onDocumentMouseMove, false );
    element.addEventListener( 'mouseup', onDocumentMouseUp, false );
    element.addEventListener( 'mousewheel', onDocumentMouseWheel, false );
    element.addEventListener( 'MozMousePixelScroll', onDocumentMouseWheel, false);
    element.addEventListener("touchstart", touchHandler, true);
    element.addEventListener("touchmove", touchHandler, true);
    element.addEventListener("touchend", touchHandler, true);
    element.addEventListener("touchcancel", touchHandler, true);

    // Init target
    /*lat = Math.max( - 85, Math.min( 85, lat ) );
    phi = THREE.Math.degToRad( 90 - lat );
    theta = THREE.Math.degToRad( lon );*/

    //window.addEventListener( 'resize', onWindowResize, false );
    animate();

    // controls animate
    hideClock = new THREE.Clock();
    hideClock.start();
    child.style.opacity = 0.7;

    // Everything Else

    function onWindowResize() {
        resize();
    }

    function onDocumentMouseDown( event ) {

        event.preventDefault();

        isUserInteracting = true;
        onPointerDownPointerX = event.clientX;
        onPointerDownPointerY = event.clientY;

        onPointerDownLon = lon;
        onPointerDownLat = lat;

        // controls animate
        hideClock = new THREE.Clock();
        hideClock.start();
        child.style.opacity = 0.7;
    }

    function onDocumentMouseMove( event ) {

        if ( isUserInteracting === true ) {

            lon = ( onPointerDownPointerX - event.clientX ) * 0.1 + onPointerDownLon;
            lat = ( event.clientY - onPointerDownPointerY ) * 0.1 + onPointerDownLat;

        }
    }

    function onDocumentMouseUp( event ) {
        isUserInteracting = false;
    }

    function onDocumentMouseWheel( event ) {
        return;
    }

    function resize() {

        if (window.innerWidth > window.innerHeight){ // i.e. landscape mode
            cardboard = forceCardboard;
        } else {
            cardboard = false;
        }
        camera.aspect = window.innerWidth / (window.innerHeight);
        camera.updateProjectionMatrix();

        renderer.setSize( window.innerWidth, window.innerHeight );
        effect.setSize(window.innerWidth, window.innerHeight );
    }

    function update(dt) {

        if (hideClock){
            if(hideClock.getElapsedTime() > autoHideDelay){
                child.style.opacity = 0;
            }
        }

        if ( video.readyState === video.HAVE_ENOUGH_DATA )
        {
            //videoImageContext.drawImage( video, 0, 0 );
            if ( texture )
                texture.needsUpdate = true;
        }
        //resize();

        document.getElementById("canvasTimeText").innerHTML = toHHMMSS(video.currentTime.toString());
        if (isUserInteracting){
            lat = Math.max( - 85, Math.min( 85, lat ) );
            phi =  THREE.Math.degToRad(lat);
            theta = THREE.Math.degToRad(lon);
            if (gyroOn){
                controls.updateGammaOffsetAngle(-phi);
            } else {
                var q = new THREE.Quaternion().setFromEuler(new THREE.Euler(
                    phi - oldPhi,
                    0,
                    0,
                    'XYZ'
                ));
                camera.quaternion.multiplyQuaternions(q, camera.quaternion);
            }
            oldTheta = theta;
            oldPhi = phi;

            console.log(camera.rotation.x + " " + camera.rotation.y + " " + camera.rotation.z);

            //mesh.rotation.x = phi;
            mesh.rotation.y = theta;

        }
        if (gyroOn){
            controls.update(dt);
            camera.position.x = 0;
            camera.position.y = 0;
            camera.position.z = 0;
        }

    }

    function render(dt) {
        if (cardboard) {
            effect.render(scene, camera);
        } else {
            renderer.render(scene, camera);
        }
    }

    function animate(t) {
        requestAnimationFrame(animate);

        update(clock.getDelta());
        render(clock.getDelta());
    }

    function fullscreen() {
        if (container.requestFullscreen) {
            container.requestFullscreen();
        } else if (container.msRequestFullscreen) {
            container.msRequestFullscreen();
        } else if (container.mozRequestFullScreen) {
            container.mozRequestFullScreen();
        } else if (container.webkitRequestFullscreen) {
            container.webkitRequestFullscreen();
        }
    }

    function videoControls(video, command, value) {
        if (command == "pp") {
            if (video.paused) {
                video.play();
            } else {
                video.pause();
            }
        } else if (command == "restart"){
            video.currentTime = 0;
        } else if (command == "seek") {
            video.currentTime += value;
        }
    }

    function toHHMMSS(string) {
        var sec_num = parseInt(string, 10); // don't forget the second param
        var hours   = Math.floor(sec_num / 3600);
        var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
        var seconds = sec_num - (hours * 3600) - (minutes * 60);

        if (hours   < 10) {hours   = "0"+hours;}
        if (minutes < 10) {minutes = "0"+minutes;}
        if (seconds < 10) {seconds = "0"+seconds;}
        return hours+':'+minutes+':'+seconds;
    }

    // Drag drop change video
    container.addEventListener( 'dragover', function ( event ) {

        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';

    }, false );

    container.addEventListener( 'dragenter', function ( event ) {

        document.body.style.opacity = 0.5;

    }, false );

    container.addEventListener( 'dragleave', function ( event ) {

        document.body.style.opacity = 1;

    }, false );

    container.addEventListener( 'drop', function ( event ) {

        event.preventDefault();
        playFile(event.dataTransfer.files[ 0 ]);
    }, false );

    function playFile(file) {
        var type = file.type;
        var canPlay = video.canPlayType(type);
        if (canPlay === '') {
            console.log("cant play the provided video file");
            return;
        }
        video.src = URL.createObjectURL(file);
        document.body.style.opacity = 1;
    }
    
    function touchHandler(event)
    {
        var touches = event.changedTouches,
            first = touches[0];
        switch(event.type)
        {
            case "touchstart":

                isUserInteracting = true;
                onPointerDownPointerX = first.clientX;
                onPointerDownPointerY = first.clientY;

                onPointerDownLon = lon;
                onPointerDownLat = lat;

                // controls animate
                hideClock = new THREE.Clock();
                hideClock.start();
                child.style.opacity = 0.7;
                 break;
            case "touchmove":
                lon = ( onPointerDownPointerX - first.clientX ) * 0.1 + onPointerDownLon;
                lat = ( first.clientY - onPointerDownPointerY ) * 0.1 + onPointerDownLat;
                break;
            case "touchend":
                isUserInteracting = false;
                break;
            default:
                return;
        }
        event.preventDefault();
    }


    function rotateTargetAroundOrigin(deltaAlpha, deltaBeta, deltaGamma, position) {
        var loc = [position.x, position.y, position.z];
        var sinA = Math.sin(deltaAlpha), sinB = Math.sin(deltaBeta), sinC = Math.sin(deltaGamma);
        var cosA = Math.cos(deltaAlpha), cosB = Math.cos(deltaBeta), cosC = Math.cos(deltaGamma);
        var newPos = [0, 0, 0];
        newPos[0] = loc[0] * cosA * cosB + loc[1] * sinA * cosB +
            loc[2] * (-sinB);
        newPos[1] = loc[0] * (cosA * sinB * sinC - sinA * cosC) +
                loc[1] * (sinA * sinB * sinC + cosA * cosC) +
                loc[2] * cosB * sinC;
        newPos[2] = loc[0] * (cosA * sinB * cosC + sinA * sinC) +
                loc[1] * (sinA * sinB * cosC - cosA * sinC) +
                loc[2] * cosB * cosC;
        return newPos;
    }

    
}

