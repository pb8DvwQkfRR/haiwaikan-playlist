// ==UserScript==
// @name         Haiwaikan Playlist
// @namespace    http://tampermonkey.net/
// @version      0.4.4
// @description  Add playlist
// @author       pb8DvwQkfRR
// @license      MIT
// @match        https://haiwaikan.com/index.php/vod/play/id/*
// @match        https://haiwaikan.com/index.php/vod/detail/id/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=haiwaikan.com
// @grant        GM_xmlhttpRequest
// @grant        GM_setClipboard
// ==/UserScript==

(function() {
    'use strict';
    var titleEl = document.querySelector('.stui-content__detail .title, .stui-player__detail .title');
    var m3utitle = titleEl.innerHTML.replace(/<[^>].*>/g, '');
    var m3uheader = `#EXTM3U\n#EXT-X-PLAYLIST-TYPE:VOD\n#EXT-X-VERSION:4\n`;
    var m3uinfo = `#EXTALB:${m3utitle}`;
    var m3uep = `#EXTINF:-1, ${m3utitle}`;
    var ct = Array.from(document.querySelectorAll('.copy_text'));
    var m3ulinks = ct.map(el => {
        var m3ulink = el.querySelector('.hidden-xs').textContent.replace('$', '');
        var desp = el.textContent.split('$')[0];
        return `${m3uep}${desp}\n${m3ulink}`;
    });
    var m3uoutput = `${m3uheader}${m3uinfo}\n${m3ulinks.join('\n')}\n#EXT-X-ENDLIST`;
    var eps = `(${ct[0].textContent.split('$')[0]}${ct.length > 1 ? `-${ct[ct.length-1].textContent.split('$')[0]}` : ''})`;
    var fileName = `${m3utitle}${eps}.m3u`;

    var isMobile = window.matchMedia("(any-pointer:coarse)").matches;
    var playlistDiv = document.querySelector('#playlist');
    var stateDiv = document.createElement("div");
    stateDiv.id = "stateDiv";
    stateDiv.style.textAlignLast = "center";
    stateDiv.style.marginTop = "30px";
    var footDiv = document.querySelector('.stui-foot');
    var m3uDiv = document.createElement("pre");
    m3uDiv.textContent = m3uoutput;
    m3uDiv.style.whiteSpace = "pre-wrap";
    m3uDiv.style.wordBreak = "break-word";
    m3uDiv.style.display = "flex";
    m3uDiv.style.flexDirection = "column";
    m3uDiv.style.alignItems = "center";
    m3uDiv.style.marginTop = "10px";

    var buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";

    function updateButtonContainer() {
        var isLandscape = window.innerWidth >= 768;
        buttonContainer.appendChild(copyButton);
        buttonContainer.appendChild(downloadButton);
        buttonContainer.appendChild(sendButton);
        buttonContainer.style.transform = isLandscape ? "translateY(50%)" : "";
        buttonContainer.style.position = isLandscape ? "fixed" : "";
        buttonContainer.style.flexDirection = isLandscape ? "column" : "";
        buttonContainer.style.right = isLandscape ? `${window.innerWidth * 0.03}px` : "";
        buttonContainer.style.minWidth = isLandscape ? "150px" : "";
        buttonContainer.style.maxWidth = isLandscape ? "150px" : "";
        buttonContainer.style.bottom = isLandscape ? "50%" : "";
        buttonContainer.style.transition = isLandscape ? "all 0.3s" : "";
        buttonContainer.style.opacity = isLandscape ? "0.8" : "";
        buttonContainer.style.backgroundColor = isLandscape ? "rgba(255, 255, 255, 0.4)" : "";
        buttonContainer.style.border = isLandscape ? "1px solid rgba(204, 204, 204, 0.4)" : "";
        buttonContainer.style.borderRadius = isLandscape ? "5px" : "";
        buttonContainer.addEventListener("mouseout", function(){
            this.style.opacity = isLandscape ? "0.8" : "";
        });
        buttonContainer.addEventListener("mouseover", function(){
            this.style.opacity = isLandscape ? "1" : "";
        });
    }

    window.addEventListener("resize", updateButtonContainer);
    window.addEventListener("load", updateButtonContainer);

    var downloadButton = document.createElement("button");
    downloadButton.id = "downloadButton";
    downloadButton.textContent = "下载列表";
    downloadButton.style.backgroundColor = "#4CAF50";
    downloadButton.style.color = "white";
    downloadButton.style.margin = "10px";
    downloadButton.style.padding = "10px 15px";
    downloadButton.style.borderRadius = "4px";

    downloadButton.onclick = function() {
        var m3uContent = m3uoutput;
        var blob = new Blob([m3uContent], {type: "text/plain"});
        var link = document.createElement("a");
        link.download = fileName;
        link.href = URL.createObjectURL(blob);
        link.click();
        downloadButton.textContent = "已下载!";
        setTimeout(function(){
            downloadButton.textContent = "下载列表";
        }, 3000);
    }

    var copyButton = document.createElement("button");
    copyButton.id = "copyButton";
    copyButton.textContent = "复制";
    copyButton.style.backgroundColor = "#4CAF50";
    copyButton.style.color = "white";
    copyButton.style.margin = "10px";
    copyButton.style.padding = "10px 15px";
    copyButton.style.borderRadius = "4px";

    copyButton.addEventListener("click", function() {
        if(isMobile) {
            var textArea = document.createElement("textarea");
            textArea.value = m3uoutput;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand("copy");
            document.body.removeChild(textArea);
        } else {
            GM_setClipboard(m3uoutput);
        }
        copyButton.textContent = "已复制!";
        setTimeout(function(){
            copyButton.textContent = "复制";
        }, 3000);
    });

    var sendButton = document.createElement("button");
    sendButton.id = "sendButton";
    sendButton.textContent = "发送 transfer.sh";
    sendButton.style.backgroundColor = "#4CAF50";
    sendButton.style.color = "white";
    sendButton.style.margin = "10px";
    sendButton.style.padding = "10px 15px";
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
                sendButton.textContent = "请求超时";
            },
            onload: function(response) {
                var sendId = new URL(response.responseText).pathname.match(/\/([^/]+)\//)[1];
                var sendUrl = `https://transfer.sh/get/${sendId}/${fileName}`
                stateDiv.innerHTML = `<a href=${sendUrl}>${sendUrl}</a>`;
                document.getElementById("stateDiv").scrollIntoView({
                    behavior: 'smooth',
                    block: "center"
                });
                GM_setClipboard(sendUrl);
            },
            onreadystatechange: function() {
                switch (this.readyState) {
                    case (XMLHttpRequest.DONE):
                        sendButton.textContent = "已复制 URL!";
                        break;
                    case (XMLHttpRequest.OPENED || XMLHttpRequest.HEADERS_RECEIVED || XMLHttpRequest.LOADING):
                        sendButton.textContent = "发送中...";
                        break;
                }
            },
            onloadend: function() {
                setTimeout(function(){
                    sendButton.textContent = "发送 transfer.sh";
                }, 3000);
            }
        })
    });
    footDiv.parentNode.insertBefore(m3uDiv, footDiv);
    m3uDiv.insertBefore(buttonContainer, m3uDiv.firstChild);
    playlistDiv.parentNode.insertBefore(stateDiv, playlistDiv);
})();

