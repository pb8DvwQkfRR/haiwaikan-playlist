// ==UserScript==
// @name         Haiwaikan Playlist
// @namespace    http://tampermonkey.net/
// @version      0.3.3
// @description  Add playlist
// @author       pb8DvwQkfRR
// @license      MIT
// @match        https://haiwaikan.com/index.php/vod/play/id/*
// @match        https://haiwaikan.com/index.php/vod/detail/id/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=haiwaikan.com
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';
    var m3utitle = document.querySelector('.stui-content__detail .title, .stui-player__detail .title').innerHTML.replace(/<[^>].*>/g, '');
    var m3uheader = "#EXTM3U\n";
    var m3uinfo = "#EXTALB:" + m3utitle;
    var m3uep = "#EXTINF:-1, ";
    var m3uoutput = m3uheader + m3uinfo + '\n';
    var ct = document.querySelectorAll(".copy_text");
    ct.forEach(el => {
        var m3ulink = el.querySelector(".hidden-xs").innerText.replace('$', '');
        var desp = el.innerText.split('$')[0];
        m3uoutput += m3uep + desp + '\n' + m3ulink + '\n';
    });
    var eps = '(' + ct[0].innerText.split('$')[0] + (ct.length > 1 ? '-' + ct[ct.length-1].innerText.split('$')[0] : '') + ')';
    var fileName = m3utitle + eps + ".m3u";
    var footDiv = document.querySelector('.stui-foot');
    var stateDiv = document.createElement("div");
    stateDiv.id = "stateDiv";

    var m3uDiv = document.createElement("div");
    m3uDiv.innerHTML = "<pre>" + m3uoutput + "</pre>";
    m3uDiv.style.display = "flex";
    m3uDiv.style.flexDirection = "column";
    m3uDiv.style.alignItems = "center";
    m3uDiv.style.marginTop = "10px";

    var buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.justifyContent = "space-between";

    var downloadButton = document.createElement("button");
    downloadButton.innerHTML = "下载列表"
    downloadButton.style.backgroundColor = "#4CAF50";
    downloadButton.style.color = "white";
    downloadButton.style.margin = "10px";
    downloadButton.style.padding = "10px 20px";
    downloadButton.style.borderRadius = "4px";

    downloadButton.onclick = function() {
        var m3uContent = m3uoutput;
        var blob = new Blob([m3uContent], {type: "text/plain"});
        var link = document.createElement("a");
        link.download = fileName;
        link.href = URL.createObjectURL(blob);
        link.click();
        document.querySelector('#stateDiv').innerHTML = "完成！"
    }

    var copyButton = document.createElement("button");
    copyButton.innerHTML = "复制"
    copyButton.style.backgroundColor = "#4CAF50";
    copyButton.style.color = "white";
    copyButton.style.margin = "10px";
    copyButton.style.padding = "10px 20px";
    copyButton.style.borderRadius = "4px";

    copyButton.addEventListener("click", function() {
        var textArea = document.createElement("textarea");
        textArea.value = m3uoutput;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.querySelector('#stateDiv').innerHTML = "已复制！"
        document.body.removeChild(textArea);
    });

    var sendButton = document.createElement("button");
    sendButton.innerHTML = "发送至 transfer.sh"
    sendButton.style.backgroundColor = "#4CAF50";
    sendButton.style.color = "white";
    sendButton.style.margin = "10px";
    sendButton.style.padding = "10px 20px";
    sendButton.style.borderRadius = "4px";

    sendButton.addEventListener("click", function() {
        GM_xmlhttpRequest({
            method: "PUT",
            url: "https://transfer.sh/" + fileName,
            data: m3uoutput,
            headers: {
                "Content-Type": "application/octet-stream"
            },
            timeout: 5000,
            ontimeout: function () {
                document.querySelector('#stateDiv').innerHTML = "请求超时"
            },
            onload: function(response) {
                var url = response.responseText.replace("transfer.sh/", "transfer.sh/get/");
                var textArea = document.createElement("textarea");
                textArea.value = url;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand("copy");
                document.body.removeChild(textArea);
            },
            onreadystatechange: function(response) {
                switch (this.readyState) {
                    case (XMLHttpRequest.DONE):
                        document.querySelector('#stateDiv').innerHTML = "已复制 URL！"
                        break;
                    case (XMLHttpRequest.OPENED || XMLHttpRequest.HEADERS_RECEIVED || XMLHttpRequest.LOADING):
                        document.querySelector('#stateDiv').innerHTML = "发送中..."
                        break;
                }
            }
        })
    });

    footDiv.parentNode.insertBefore(m3uDiv, footDiv);
    buttonContainer.appendChild(copyButton);
    buttonContainer.appendChild(downloadButton);
    buttonContainer.appendChild(sendButton);
    m3uDiv.insertBefore(buttonContainer, m3uDiv.firstChild);
    buttonContainer.parentNode.insertBefore(stateDiv, buttonContainer);
})();

