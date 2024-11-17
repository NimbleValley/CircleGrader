var socket = io();
socket.on('send-circle-points', handleValues);

const imageUpload = document.getElementById('image-upload');
const imageUploadContainer = document.getElementById('image-upload-container');
const canvas = document.getElementById('circle-canvas');
var ctx = canvas.getContext('2d');
var uploadedImage;

imageUpload.addEventListener('change', function () {
    const reader = new FileReader();
    reader.onload = function () {
        uploadedImage = this.result;
        const base64 = this.result.replace(/.*base64,/, '');
        socket.emit('analyze_image', base64);
    };
    reader.readAsDataURL(this.files[0]);
}, false);

async function handleValues(data) {
    console.log(data);

    canvas.width = data.image.width;
    canvas.height = data.image.height;

    await loadImage(uploadedImage).then(image =>
        canvasImage = image
    );
    ctx.drawImage(canvasImage, 0, 0);

    for (let circle = 0; circle < data.predictions.length; circle++) {

        let xValues = 0;
        let yValues = 0;

        let points = data.predictions[circle].points;

        // Merge by distance
        let mergeDistance = canvas.width / 250;
        for (let i = 0; i < points.length; i++) {
            for (let p = i + 1; p < points.length; p++) {
                if (getDistance(points[i], points[p]) < mergeDistance) {
                    points[i].x = getMiddleValue(points[p].x, points[i].x);
                    points[i].y = getMiddleValue(points[p].y, points[i].y);
                    points.splice(p, 1);
                    p--;
                }
            }
            xValues += points[i].x;
            yValues += points[i].y;
        }

        xValues /= points.length;
        yValues /= points.length;

        ctx.fillStyle = 'lime';
        points.forEach(element => {
            //ctx.fillRect(element.x - 5, element.y - 5, 10, 10);
        });

        ctx.fillStyle = 'red';
        //ctx.fillRect(xValues - 5, yValues - 5, 10, 10);

        let averageDistance = 0;
        for (let i = 0; i < points.length; i++) {
            averageDistance += getDistance(points[i], { x: xValues, y: yValues });
        }
        averageDistance /= points.length;

        let cumulativeError = 0;
        let hypotheticalArea = Math.PI * Math.pow(averageDistance, 2);
        for (let i = 1; i < points.length; i++) {
            const segment1 = { x1: xValues, y1: yValues, x2: points[i - 1].x, y2: points[i - 1].y };
            const segment2 = { x1: xValues, y1: yValues, x2: points[i].x, y2: points[i].y };
            let angle = angleBetweenLines(segment1, segment2);

            cumulativeError += Math.abs(getArea(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y, xValues, yValues) - ((1/2) * Math.pow(averageDistance, 2) * Math.sin(angle/180*Math.PI)));
        }

        let accuracy = 1 - Math.abs(cumulativeError) / (hypotheticalArea);
        console.log(cumulativeError - hypotheticalArea)

        ctx.font = `${canvas.width / 20}px serif`;
        ctx.fillText(`${Math.round(accuracy * 1000) / 10}%`, xValues - (canvas.width / 15), yValues);
    }
}

function getDistance(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

function getMiddleValue(v1, v2) {
    return (v1 + v2) / 2;
}

function getArea(x1, y1, x2, y2, x3, y3) {
    return Math.abs((x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2)) / 2);
}

function angleBetweenLines(line1, line2) {
    const m1 = (line1.y2 - line1.y1) / (line1.x2 - line1.x1);
    const m2 = (line2.y2 - line2.y1) / (line2.x2 - line2.x1);

    const angleRad = Math.atan2(m2 - m1, 1 + m1 * m2);
    const angleDeg = angleRad * (180 / Math.PI);

    return Math.abs(angleDeg); // Return the absolute value for the acute angle
}

const loadImage = src =>
    new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });