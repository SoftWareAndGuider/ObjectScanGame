const URL = "./model/";
let model, webcam, labelContainer, maxPredictions, last = '없음', lock = false;

async function init() {
    document.getElementById('start').style.display = 'none'
    document.getElementById('loading').style.display = ''
    const loadmsg = document.getElementById('loading-msg')

    loadmsg.innerText = '전처리 중입니다...'
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    loadmsg.innerText = '모델을 불러오고 있습니다...'
    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    const flip = true;
    webcam = new tmImage.Webcam(300, 300, flip);
    
    loadmsg.innerText = '웹켐을 요청했습니다'
    await webcam.setup();
    
    loadmsg.innerText = '웹켐을 준비중입니다...'
    await webcam.play();
    window.requestAnimationFrame(loop);

    loadmsg.innerText = '웹켐을 그리고 있습니다...'
    document.getElementById("webcam-container").appendChild(webcam.canvas);
    labelContainer = document.getElementById("label-container");
    for (let i = 0; i < 5; i++) {
        labelContainer.appendChild(document.createElement("div"));
    }

    document.getElementById('loading').style.display = 'none'
}

async function loop() {
    webcam.update();
    await predict();
    window.requestAnimationFrame(loop);
}

async function predict() {
    if (lock) return

    let prediction = await model.predict(webcam.canvas);
    prediction.sort((a, b) => a.probability - b.probability).reverse()
    prediction = prediction.filter((pred) => !['형광등 스위치', '팬타블렛'].includes(pred.className))

    for (let i = 0; i < 5; i++) {
        if (i < 1) {
            if (prediction[i].probability.toFixed(2) < 0.3) {
                document.getElementById('top').innerHTML = `
            
                    <h1 style="color: red">검색중...</h1>
                    <h5>최근 검색됨: <span style="color: green">${last}</span></h5>

                `
            } else {
                last = prediction[i].className
                lock = true
                setTimeout(() => {
                    lock = false
                }, 1000)
                document.getElementById('top').innerHTML =  `

                    <h1>
                        검색 완료: 
                        <span style="color: green">${prediction[i].className}</span>
                    </h1> 

                `
            }
        }

        const classPrediction = `
            ${i + 1}위. ${prediction[i].className}
            <div class="progress" style="height: 20px;">
                <div
                    class="progress-bar"
                    role="progressbar"
                    style="width: ${prediction[i].probability.toFixed(2) * 100}%;"
                >
                    ${prediction[i].probability.toFixed(2) * 100}%
                </div>
            </div>
        `

        labelContainer.childNodes[i].innerHTML = classPrediction;
    }
}
