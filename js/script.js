"use strict";

var imageData;
var img_u8, count, corners;
var featureContext, triangleContext;

var imageLoader = document.getElementById('imageLoader');
var featureCanvas = document.getElementById('features');
var triangleCanvas = document.getElementById('triangles');


var input = document.getElementById('imageLoader');
input.addEventListener('change', handleFiles);

function handleFiles(e) {
    var upload = document.getElementById('imageLoader');

    if (upload.files[0].type == "image/png" || 
        upload.files[0].type == "image/jpeg" ||
        upload.files[0].name.split(".")[1].toUpperCase() == "PNG" ||
        upload.files[0].name.split(".")[1].toUpperCase() == "JPEG" ||
        upload.files[0].name.split(".")[1].toUpperCase() == "JPG")
    {

        $(".alert").hide();
        
        var imageLoader = new Image;
        var file = e.target.files[0];
        imageLoader.src = URL.createObjectURL(file);
        imageLoader.onload = function() {

            var imageWidth = this.width,
                imageHeight = this.height,
                imageType = file.type,
                imageName = file.name,
                imageSize = ~~(file.size / 1024) + 'KB',
                eigen_value = 30;

            function init() {

                featureContext = featureCanvas.getContext('2d');
                triangleContext = triangleCanvas.getContext('2d');

                img_u8 = new jsfeat.matrix_t(640, 480, jsfeat.U8_t | jsfeat.C1_t);
                corners = [];
                var i = 640 * 480;
                while(--i >= 0) corners[i] = new jsfeat.point2d_t(0,0,0,0);

            	$(window).bind('resize', resize);
            	resize();
                animate();
            }

            function animate() {

            	featureContext.drawImage(imageLoader, 0, 0, 640, 480);
                imageData = featureContext.getImageData(0, 0, 640, 480);

                //Detection of remarkable points (“corners”) in the image using Laplacian matrix
                //with detector by CVLab (Ecole Polytechnique Federale de Lausanne (EPFL), Switzerland).
                //To ease corner detection, the frame has first to be converted to a grayscale image.
                //jsFeat : http://inspirit.github.io/jsfeat/#features2d
                jsfeat.imgproc.grayscale(imageData.data, img_u8.data);
                jsfeat.yape06.min_eigen_value_threshold = eigen_value;
                count = jsfeat.yape06.detect(img_u8, corners);
                drawTriangles();
            }

            function drawTriangles() {

                var triangleCanvas = document.getElementById("triangles"),
                    triangleContext = triangleCanvas.getContext("2d")
                    triangleContext.clearRect(0, 0, triangleCanvas.width, triangleCanvas.height);

                triangleContext.drawImage(imageLoader, 0, 0, 640, 480);

                //Applying Delaunay Triangulation, based on an array of triangles'vertices objects
                var vertices = [
                    {x: 0, y: 0},
                    {x: triangleCanvas.width, y: 0},
                    {x: triangleCanvas.width, y: triangleCanvas.height},
                    {x: 0,y: triangleCanvas.height}
                ];
                    for(var i = 0; i < count; i++) {
                        vertices.push(corners[i]);
                    }

                var triangles = triangulate(vertices);

                //Color the triangles, based on 3 pixels inside the triangle
                var i = triangles.length
                while(i) {
                    --i;
                    var pixel = (triangles[i].centroid().y * triangleCanvas.width + triangles[i].centroid().x) * 4;

                    var r = imageData.data[pixel];
                    var g = imageData.data[pixel + 1];
                    var b = imageData.data[pixel + 2];
                    
                    var hsv = rgb2hsl(r,g,b);

            		triangleContext.fillStyle= 'hsl(' + ((hsv.h * 360 ) % 360) + ',' + hsv.s * 100 + '%,' + hsv.l * 100 + '%)';

                    triangles[i].draw(triangleContext);
                    triangleContext.fill();
                }

            }

            function resize (event) {

            	var newWidth = imageWidth;
            	var newHeight = imageHeight;

            	if (newHeight > window.innerHeight) {
            		newHeight = window.innerHeight - 100;
            		newWidth = 'auto';
            	}

                if (newWidth > window.innerWidth) {
                    newWidth = window.innerWidth;
                    newHeight = 'auto';
                }

            	$("#triangles").width(newWidth);
            	$("#triangles").height(newHeight);
            }

            // http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript

            function rgb2hsl(r, g, b){
                r /= 255, g /= 255, b /= 255;
                var max = Math.max(r, g, b), min = Math.min(r, g, b);
                var h, s, l = (max + min) / 2;

                if(max == min){
                    h = s = 0; // achromatic
                }else{
                    var d = max - min;
                    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                    switch(max){
                        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                        case g: h = (b - r) / d + 2; break;
                        case b: h = (r - g) / d + 4; break;
                    }
                    h /= 6;
                }

                return {h:h,s: s,l: l};
            }
            //Blob.js + canvas-toBlob + FileSaver.js (saveAs)
            function saveImage() {
                triangleCanvas.toBlob(function(blob) {
                    saveAs(blob, "trime.png");
                }, "image/png");
            }

            $( "#value_slider" ).change(function() {
                    eigen_value = $(this).val();
                    animate();
            });

            $( "#save" ).click(function() {
                    saveImage();
            });

            init();
        }

        return true;
    }
    else {
        document.getElementById('imageLoader').value='';
        $(".alert").show();
        return false;
    }
    
}


