// file chooser
let input = document.getElementById("load_image")
input.addEventListener("change", readHDR)

// file saver
let output = document.getElementById("save_scene_picture")
/* save canvas to ppm file when button is pressed
*/
output.onclick = () => {
	if (hdrData != null) {
		var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
		var ppmData = "P3\n" + canvas.width + " " + canvas.height + "\n255\n";
		for (var i = 0; i < imgData.length; i += 4) {
			ppmData += imgData[i + 0] + " " + imgData[i + 1] + " " + imgData[i + 2] + " ";
		}
		var ppmBlob = new Blob([ppmData], {type: "image/x-portable-pixmap"});
		saveAs(ppmBlob, "rendered.ppm");
	}
}

// parameters
let gamma = 1.0
let filterSize = 11
let methodType = 1
let compression = 5
let kernelType = 0

// sliders
let gm = document.getElementById("gammaID")
gm.addEventListener("input", (e) => {
    gamma = Number(gm.value);
    let gmLabel = document.getElementById("gammaLabelID")
    gmLabel.innerHTML = gamma
    gm.label = "Gamma: " + gm.value; // refresh gamma text
}, false);
let cm = document.getElementById("compressionID")
cm.addEventListener("input", (e) => {
    compression = Number(cm.value);
    let cmLabel = document.getElementById("compressionLabelID")
    cmLabel.innerHTML = compression
    cm.label = "Compression Factor: " + cm.value;
}, false);
let fi = document.getElementById("filterID")
fi.addEventListener("input", (e) => {
    filterSize = Number(fi.value);
    let fiLabel = document.getElementById("filterLabelID")
    fiLabel.innerHTML = filterSize
    fi.label = "Filter Size: " + fi.value; // refresh filter text
}, false);
let mt = document.getElementById("methodID")
mt.addEventListener("input", (e) => {
    methodType = Number(mt.value);
    let mtLabel = document.getElementById("methodIDlabel")
    if (methodType) {
        mtLabel.innerHTML = "Method: Bilateral Filters"
    } else {
        mtLabel.innerHTML = "Method: Basic Tone Mapping"
    }
}, false);
let kt = document.getElementById("kernelID")
kt.addEventListener("input", (e) => {
    kernelType = Number(kt.value);
    let ktLabel = document.getElementById("kernelIDlabel")
    if (kernelType) {
        ktLabel.innerHTML = "Kernel Type: Weighted"
    } else {
        ktLabel.innerHTML = "Kernel Type: Box"
    }
}, false);

// canvas
let canvas = document.getElementById("canvas")
let ctx = canvas.getContext("2d")

let hdrData = null

// parse HDR file
function readHDR() {
    for (let i = 0; i < input.files.length; i++) {
        let file = input.files[i]
        let reader = new FileReader()
        reader.onload = ((f, index) => {
            return (e) => {
                // get file name
                let filename = f.name;
                // parse hdr
                let fileData = e.target.result;
                hdrData = parseHdr(fileData)
            }
        })(file, i)
        reader.readAsArrayBuffer(file)
    }
}

function render() {
    if (hdrData != null) {
        let width = hdrData.shape[0]
        let height = hdrData.shape[1]
        let data = hdrData.data
        let imgData = null
        if (methodType == 0) {
            imgData = basicToneMap(data, width, height) // part 2
        } else {
            imgData = bilateralFilter(data, width, height) // part 3
        }
        document.getElementById("lastRendered").innerHTML = "Last Rendered: "+ Date.now()
        
        // draw to canvas
        canvas.width = width
        canvas.height = height
        ctx.putImageData(imgData, canvas.width/2 - width/2, canvas.height/2 - height/2)
    }
    setTimeout(render, 100); // render again after 100ms delay
}

function clamp01(val) {
    if (val > 1.0) return 1.0
    if (val < 0.0) return 0.0
    return val
}

// part 2 of assignment
function basicToneMap(data, width, height) {
    // employ a simple gamma correct method, in the log space of its luminance
    // computing a scale value that you will multiply each channel with separately
    let out = ctx.createImageData(width, height)
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            let baseIndex = (row * width * 4) + (col * 4)
            let oldR = data[baseIndex + 0]
            let oldG = data[baseIndex + 1]
            let oldB = data[baseIndex + 2]
            // 1. calculate luminance of pixel
            let L = (1.0 / 61.0) * (20.0 * oldR + 40.0 * oldG + oldB)
            // 2. calculate L'
            let Lprime = Math.pow(L, gamma)
            // 3. compute scale value and multiply each channel by it
            let scale = Lprime / L
            let newR = clamp01(oldR * scale)
            let newG = clamp01(oldG * scale)
            let newB = clamp01(oldB * scale)
            // save rgb
            out.data[baseIndex + 0] = newR * 255;
            out.data[baseIndex + 1] = newG * 255;
            out.data[baseIndex + 2] = newB * 255;
            out.data[baseIndex + 3] = 255; // alpha channel always 255
        }
    }
    return out
}

// part 3 of assignment
function bilateralFilter(data, width, height) {
    // extends basic tone mapping by begin feature dependent
    let out = ctx.createImageData(width, height)
    let Bvals = Array(width * height).fill(0);
    let minB = null
    let maxB = null
    let k = 0;
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            let baseIndex = (row * width * 4) + (col * 4)
            let oldR = data[baseIndex + 0]
            let oldG = data[baseIndex + 1]
            let oldB = data[baseIndex + 2]
            let oldL = (1.0 / 61.0) * (20.0 * oldR + 40.0 * oldG + oldB)
            // 1. first compute low-pass B with convolution
            let negOff = Math.ceil(-filterSize/2)
            let posOff = Math.floor(filterSize/2)
            let B = 0.0;
            let count = 0
            for (let i = negOff; i < posOff; i++) {
                for (let j = negOff; j < posOff; j++) {
                    // check if pixel in bounds
                    if (row + i < 0 || row + i >= height ||
                        col + j < 0 || col + j >= width) continue;
                    let baseIndex2 = ((row + i) * width * 4) + ((col + j) * 4)
                    let r = data[baseIndex2 + 0]
                    let g = data[baseIndex2 + 1]
                    let b = data[baseIndex2 + 2]
                    let L = (1.0 / 61.0) * (20.0 * r + 40.0 * g + b)
                    // bilateral filter weight
                    if (kernelType == 1) {
                        // bilateral filer
                        let d = Math.log10(L) - Math.log10(oldL)
                        let w = Math.pow(10, -clamp01(d * d))
                        B += w * Math.log10(L)
                        count += w * 1
                    } else {
                        // box filter
                        B += Math.log10(L)
                        count += 1
                    }
                }
            }
            B = B / count // normalize
            // store B val
            Bvals[k] = B;
            if (minB == null || B < minB) minB = B;
            if (maxB == null || B > maxB) maxB = B;
            k++;
        }
    }
    k = 0;
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            let baseIndex = (row * width * 4) + (col * 4)
            let oldR = data[baseIndex + 0]
            let oldG = data[baseIndex + 1]
            let oldB = data[baseIndex + 2]
            let B = Bvals[k];
            k++;
            // 2. next, separate log(L) into high-pass S and low-pass B
            let L = (1.0 / 61.0) * (20.0 * oldR + 40.0 * oldG + oldB)
            let S = Math.log10(L) - B;
            // 3. gamma correct B and recombine with S
            let newGamma = Math.log10(compression) / (maxB - minB)
            let logLprime = newGamma * B + S
            // 4. convert back from log space to original
            let Lprime = Math.pow(10, logLprime)
            // 5. produce scale value
            let scale = Lprime / L
            let newR = clamp01(oldR * scale)
            let newG = clamp01(oldG * scale)
            let newB = clamp01(oldB * scale)
            // save rgb
            out.data[baseIndex + 0] = newR * 255;
            out.data[baseIndex + 1] = newG * 255;
            out.data[baseIndex + 2] = newB * 255;
            out.data[baseIndex + 3] = 255; // alpha channel always 255
        }
    }
    return out
}



render() // start infinite rendering loop
