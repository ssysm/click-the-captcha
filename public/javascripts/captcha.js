var selection = [];

function refresh() {
    document.querySelector('#captchaText').innerHTML = null;
    document.querySelector('#captchaImg').innerHTML = null;
    selection = [];
    axios.get('/api/captcha')
        .then(res=>res.data)
        .then(data => {
            renderSvg(data.svg);
            renderImage(data.requestTotal)
        })
}

function renderSvg(svg) {
    document.querySelector('#captchaText').innerHTML = `请点击所有的${svg}`;
}

function renderImage(totalNumber) {
    var imgElem = document.querySelector('#captchaImg');
    for (var i = 0; i < totalNumber; i++) {
        imgElem.innerHTML += `
            <img src="/api/captcha/images/${i}.jpg?cache=${Date.now()}" alt="Captcha Image" index="${i}" onClick="handleClick(event)"></img>  
            `
    }
}

function handleClick(event) {
    var target = event.target;
    var index = parseInt(event.target.getAttribute('index'));
    var arrIndex = selection.findIndex(item => item == index);
    if (arrIndex > -1) {
        selection.splice(arrIndex, 1);
        target.style.opacity = 0.6;
    } else {
        selection.push(index)
        target.style.opacity = 1;
    }
}

function handleSubmit(event) {
    if (selection.length == 0) {
        M.toast({
            html: '请选择至少一个图片'
        })
    } else {
        axios.post('/api/captcha/verify',{
            index: selection
        })
            .then(res => res.data)
            .then(response => {
                if (response.status) {
                    M.toast({
                        html: '验证成功'
                    })
                    refresh();
                } else {
                    M.toast({
                        html: '验证失败'
                    })
                    refresh();
                }
            })
            .catch(error => M.toast({
                html: '验证失败'
            }));
    }
}
refresh();