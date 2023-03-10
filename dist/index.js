"use strict";
exports.__esModule = true;
var ponconjs_1 = require("ponconjs");
var querystring = require("querystring");
var hlsClass = require("hls.js");
var bootstrap_1 = require("bootstrap");
var Clipboard = require("clipboard");
var Hls = hlsClass;
new Clipboard('.copy-text');
/** 加载搜索模态框 */
function loadSearchModal() {
    /** 搜索模态框 */
    var searchModalEle = document.querySelector('#search-modal');
    if (!searchModalEle)
        return;
    /** 搜索模态框对象 */
    var searchModal = new bootstrap_1.Modal(searchModalEle);
    /** 点击弹出模态框 */
    var searchItemEle = document.querySelectorAll('.item-search');
    /** 搜索按钮 */
    var searchBtn = searchModalEle.querySelector('.search');
    /** 搜索输入框 */
    var keywordEle = document.querySelector('#search-modal .keyword');
    searchItemEle[0].addEventListener('click', show);
    searchItemEle[1].addEventListener('click', show);
    searchBtn === null || searchBtn === void 0 ? void 0 : searchBtn.addEventListener('click', search);
    /** 显示模态框 */
    function show() {
        searchModal.show();
    }
    searchModalEle.addEventListener('shown.bs.modal', function () {
        keywordEle === null || keywordEle === void 0 ? void 0 : keywordEle.focus();
    });
    keywordEle === null || keywordEle === void 0 ? void 0 : keywordEle.addEventListener('keyup', function (event) {
        if (event.key == 'Enter')
            search();
    });
    /** 搜索 */
    function search() {
        var keyword = keywordEle === null || keywordEle === void 0 ? void 0 : keywordEle.value;
        if (keyword === null || keyword === void 0 ? void 0 : keyword.match(/^\s*$/))
            return;
        loadVideoList('', 0, 24, keyword, function () { searchModal.hide(); });
        config.searching = true;
        location.hash = '';
    }
    window.addEventListener('keydown', function (event) {
        if (event.key == 's' && event.ctrlKey)
            event.preventDefault();
    });
    window.addEventListener('keyup', function (event) {
        if (event.key == 's' && event.ctrlKey)
            show();
        else if (event.key == '/') {
            var modalIsHide = !(searchBtn === null || searchBtn === void 0 ? void 0 : searchBtn.offsetParent);
            if (modalIsHide)
                show();
        }
    });
}
loadSearchModal();
/** 配置信息 */
var config = {
    api: 'https://9db16d0067c744feb0edef5e5b5bd6ec.apig.cn-south-1.huaweicloudapis.com',
    siteName: 'AVIN 视频',
    canPlay: false,
    searching: false
};
/** 缓存数据 */
var dataCache = {};
var poncon = new ponconjs_1["default"]();
poncon.setPageList(['home', 'video', 'about', 'female', 'type', 'play']);
poncon.pages.home.data.types = [
    { typeId: '', name: '全部' },
    { typeId: '1043', name: '国产自拍' },
    { typeId: '1901', name: '亚洲有码' },
    { typeId: '1042', name: '亚洲无码' },
    { typeId: '1029', name: '成人动漫' },
    { typeId: '1045', name: '欧美情色' },
    { typeId: '1912', name: '国产 AV' },
    { typeId: '1891', name: '经典三级' },
];
changeActiveMenu();
window.onhashchange = function (event) {
    changeActiveMenu();
    bodyToTop();
};
window.onclick = function () {
    config.canPlay = true;
};
request('/login/api/login', {
    channel_id: 3000,
    device_id: 'apee'
}, function (data) {
    config.userInfo = data.data;
}, false);
poncon.setPage('home', function (dom, args, pageData) {
    var _a, _b;
    /** 此时，可能是由其他页面，通过搜索事件进入本页面，则直接忽略原来的事件 */
    if (config.searching) {
        config.searching = false;
        return;
    }
    var eleTypeList = dom === null || dom === void 0 ? void 0 : dom.querySelector('.type-list');
    if (!pageData.load) {
        eleTypeList.innerHTML = (function () {
            var html = '<div class="d-inline-block head-type"></div>';
            pageData.types.forEach(function (type) {
                html += "<a class=\"btn btn-outline-secondary\" data-type-id=\"".concat(type.typeId, "\" href=\"#/home/").concat(type.typeId, "\">").concat(type.name, "</a>");
            });
            return html;
        })();
    }
    var eles = eleTypeList === null || eleTypeList === void 0 ? void 0 : eleTypeList.querySelectorAll('[data-type-id]');
    eles.forEach(function (ele) {
        ele.classList.remove('btn-secondary');
        ele.classList.add('btn-outline-secondary');
    });
    eleTypeList.onwheel = function (event) {
        event.preventDefault();
        animateScrollLeft(eleTypeList, eleTypeList.scrollLeft + 200 * (event.deltaY > 0 ? 1 : -1), 600);
    };
    var nowTypeId = args[0] || '';
    var page = parseInt(args[1]) || 0;
    var argsTypeName = args[2] || '';
    pageData.argsTypeName = argsTypeName;
    var nowEle = eleTypeList === null || eleTypeList === void 0 ? void 0 : eleTypeList.querySelector("[data-type-id=\"".concat(nowTypeId, "\"]"));
    /** 开头的分类选项卡，用于放置非主页原有分类标签 */
    var headTypeEle = eleTypeList.querySelector('.head-type');
    if (argsTypeName) {
        document.title = decodeURIComponent(argsTypeName) + ' - ' + config.siteName;
        if (headTypeEle)
            headTypeEle.innerHTML = "<a class=\"btn btn-secondary\" data-type-id=\"".concat(nowTypeId, "\" href=\"#/home/").concat(nowTypeId, "/0/").concat(decodeURIComponent(argsTypeName), "\">").concat(decodeURIComponent(argsTypeName), "</a>");
    }
    else {
        document.title = (nowEle === null || nowEle === void 0 ? void 0 : nowEle.innerText) + ' - ' + config.siteName;
    }
    (_a = nowEle === null || nowEle === void 0 ? void 0 : nowEle.classList) === null || _a === void 0 ? void 0 : _a.remove('btn-outline-secondary');
    (_b = nowEle === null || nowEle === void 0 ? void 0 : nowEle.classList) === null || _b === void 0 ? void 0 : _b.add('btn-secondary');
    pageData.load = true;
    loadVideoList(nowTypeId, page, 24);
});
poncon.setPage('play', function (dom, args, pageData) {
    if (pageData.load) {
        return;
    }
    var videoId = args[0];
    var videoEle = dom === null || dom === void 0 ? void 0 : dom.querySelector('video');
    var postData = {
        uid: config.userInfo.user_id,
        session: config.userInfo.session,
        video_id: videoId
    };
    var dataCacheName = JSON.stringify({
        path: '/video/view/info',
        postData: postData
    });
    if (dataCache[dataCacheName]) {
        runData(dataCache[dataCacheName]);
    }
    else {
        request('/video/view/info', postData, function (data) {
            dataCache[dataCacheName] = data;
            runData(data);
        });
    }
    function runData(data) {
        pageData.load = true;
        var videoUrl = data.data.video.href;
        var videoTitle = data.data.video.name;
        var videoTitleEle = dom === null || dom === void 0 ? void 0 : dom.querySelector('.videoTitle');
        videoTitleEle.innerHTML = videoTitle;
        playVideo(videoUrl, videoEle, dom);
    }
});
poncon.setPage('type', function (dom, args, pageData) {
    var page = parseInt((args && args[0])) || 0;
    loadSubTypeList(page, 24);
});
poncon.setPage('female', function (dom, args, pageData) {
    var page = parseInt((args && args[0])) || 0;
    loadSubTypeList(page, 24, 'female');
});
poncon.start();
function playVideo(videoUrl, videoEle, dom) {
    var _a;
    console.log('播放器载入');
    var hls = new Hls();
    if (Hls.isSupported()) {
        hls.loadSource(videoUrl);
        hls.attachMedia(videoEle);
    }
    else if (videoEle === null || videoEle === void 0 ? void 0 : videoEle.canPlayType('application/vnd.apple.mpegurl')) {
        videoEle.src = videoUrl;
    }
    if (config.canPlay) {
        videoEle === null || videoEle === void 0 ? void 0 : videoEle.play();
    }
    (_a = dom === null || dom === void 0 ? void 0 : dom.querySelector('.m3u8-url')) === null || _a === void 0 ? void 0 : _a.setAttribute('data-clipboard-text', videoUrl);
    var reloadEle = dom === null || dom === void 0 ? void 0 : dom.querySelector('.reload');
    reloadEle.onclick = function () {
        playVideo(videoUrl, videoEle, dom);
    };
}
/**
 * 加载子类列表
 * @param page 页码 初始值为 0
 * @param pageSize 每页加载数量
 * @param listType 列表类型，`type`: 子类，`female`：女优
 */
function loadSubTypeList(page, pageSize, listType) {
    if (page === void 0) { page = 0; }
    if (pageSize === void 0) { pageSize = 24; }
    if (listType === void 0) { listType = 'type'; }
    var postData = {
        uid: config.userInfo.user_id,
        session: config.userInfo.session,
        page: page + 1,
        page_size: pageSize
    };
    var path = { type: '/video/label/type_list', female: '/video/label/performer_list' }[listType];
    var dataCacheName = JSON.stringify({
        path: path,
        postData: postData
    });
    var pageDom = {
        type: document.querySelector('.poncon-type'),
        female: document.querySelector('.poncon-female')
    }[listType];
    var listEle = pageDom.querySelector('.sub-type-list');
    listEle.innerHTML = '';
    if (dataCache[dataCacheName]) {
        runData(dataCache[dataCacheName]);
    }
    else {
        loading(false);
        request(path, postData, function (data) {
            dataCache[dataCacheName] = data;
            runData(data);
            loading(true);
        });
    }
    function runData(data) {
        var listEle = pageDom.querySelector('.sub-type-list');
        var dataList = data.data;
        /** 是否允许加载下一页 */
        var loadNext = (dataList && dataList.length == pageSize);
        /** 是否允许加载上一页 */
        var loadLast = page > 0;
        changePageLink(loadLast, loadNext);
        listEle.innerHTML = (function (dataList) {
            var html = '';
            dataList.forEach(function (item) {
                html += "\n                <div class=\"col-xl-3 col-lg-4 col-sm-6 mb-4\">\n                    <a class=\"card hover-shadow card-body text-center ls-1\" data-type-id=\"".concat(item.id, "\" href=\"#/home/").concat(item.id, "/0/").concat(item.name, "\">\n                        <div class=\"h5 single-line\">").concat(item.name, "</div>\n                        <div class=\"text-primary\">\u5171 ").concat(item.video_num, " \u4E2A\u89C6\u9891</div>\n                    </a>\n                </div>");
            });
            return html;
        })(dataList);
    }
    /**
     * 加载中
     * @param ifEnd 是否加载完成
     */
    function loading(ifEnd) {
        var pageChangeToolEle = pageDom.querySelector('.page-change-tool');
        pageChangeToolEle.style.display = ifEnd ? 'block' : 'none';
        var loadingEle = pageDom.querySelector('.spinner-grow');
        loadingEle.style.display = ifEnd ? 'none' : 'block';
    }
    /**
     * 更新翻页按钮
     * @param loadLast 是否允许上一页
     * @param loadNext 是否允许下一页
     */
    function changePageLink(loadLast, loadNext) {
        var lastPage = page == 0 ? 0 : page - 1;
        var nextPage = page + 1;
        var lastPageEle = pageDom.querySelector('.last-page');
        var nextPageEle = pageDom.querySelector('.next-page');
        if (loadLast) {
            lastPageEle.href = "#/".concat(listType, "/").concat(lastPage);
            lastPageEle.classList.remove('disabled');
        }
        else
            lastPageEle.classList.add('disabled');
        if (loadNext) {
            nextPageEle.href = "#/".concat(listType, "/").concat(nextPage);
            nextPageEle.classList.remove('disabled');
        }
        else
            nextPageEle.classList.add('disabled');
    }
}
/**
 * 加载视频列表
 * @param typeId 分类 ID
 * @param page 页码 初始值为 0
 * @param pageSize 每页加载数量
 * @param keyword 搜索关键词
 * @param callback Ajax 结束时的回调函数
 */
function loadVideoList(typeId, page, pageSize, keyword, callback) {
    if (page === void 0) { page = 0; }
    if (pageSize === void 0) { pageSize = 24; }
    if (keyword === void 0) { keyword = ''; }
    var listEle = document.querySelector('.poncon-home .video-list');
    listEle.innerHTML = '';
    var postData = {
        uid: config.userInfo.user_id,
        session: config.userInfo.session,
        is_review: 0,
        is_new: 1,
        v: 0,
        search: keyword,
        label_id: typeId,
        page: page + 1,
        page_size: pageSize
    };
    /** 数据缓存键 */
    var dataCacheName = JSON.stringify({
        path: '/video/view/list',
        postData: postData
    });
    if (dataCache[dataCacheName]) {
        // 使用缓存数据
        runData(dataCache[dataCacheName]);
    }
    else {
        // 重新请求数据
        loading(false);
        request('/video/view/list', postData, function (data) {
            runData(data);
            loading(true);
        });
    }
    /**
     * 加载中
     * @param ifEnd 加载是否完成
     */
    function loading(ifEnd) {
        var changPageToolEle = document.querySelector('.poncon-home .page-change-tool');
        changPageToolEle.style.display = ifEnd ? 'block' : 'none';
        var loadingEle = document.querySelector('.poncon-home .spinner-grow');
        loadingEle.style.display = ifEnd ? 'none' : 'block';
    }
    /** 数据获取成功后操作 */
    function runData(data) {
        dataCache[dataCacheName] = data; // 缓存数据
        var list = data.data.list;
        if (!list) {
            return;
        }
        var html = (function (list) {
            var html = '';
            list.forEach(function (item) {
                if (!item.href)
                    return;
                html += "\n                <div class=\"col-xxl-3 col-xl-3 col-lg-4 col-sm-6 mb-4\">\n                    <a class=\"card hover-shadow h-100 list-item overflow-hidden\" href=\"#/play/".concat(item.id, "\">\n                        <div class=\"ratio ratio-16x9\">\n                            <div class=\"img-box overflow-hidden\">\n                                <img src=\"").concat(changeToHttp(item.href_image), "\" alt=\"").concat(item.name, "\" class=\"card-img-top\">\n                            </div>\n                        </div>\n                        <div class=\"card-body d-flex flex-column ls-1\">\n                            <div class=\"h5 card-title multi-line videoTitle\">").concat(item.name, "</div>\n                            <div class=\"card-text small text-muted d-flex mb-2 mt-auto\">\n                                <span class=\"me-auto\"><span class=\"text-success\">").concat(parseDuration(item.duration), "</span></span>\n                                <span>").concat(item.performer, "</span>\n                            </div>\n                            <div class=\"publish-time small text-muted\">").concat(item.update_time, "</div>\n                        </div>\n                    </a>\n                </div>");
            });
            return html;
        })(list);
        listEle.innerHTML = html;
        listEle.querySelectorAll('.list-item').forEach(function (ele) {
            ele.onclick = function () {
                poncon.pages.play.data.load = false;
            };
        });
        var listLength = listEle.querySelectorAll('.list-item').length;
        /** 是否允许加载下一页 */
        var loadNext = (list && listLength == pageSize);
        /** 是否允许加载上一页 */
        var loadLast = page > 0;
        changePageLink(loadLast, loadNext);
        callback && callback();
    }
    /**
     * 更新翻页按钮
     * @param loadLast 是否允许上一页
     * @param loadNext 是否允许下一页
     */
    function changePageLink(loadLast, loadNext) {
        var lastPage = page == 0 ? 0 : page - 1;
        var nextPage = page + 1;
        var lastPageEle = document.querySelector('.poncon-home .last-page');
        var nextPageEle = document.querySelector('.poncon-home .next-page');
        if (loadLast) {
            lastPageEle.href = "#/home/".concat(typeId, "/").concat(lastPage, "/").concat(poncon.pages.home.data.argsTypeName);
            lastPageEle.classList.remove('disabled');
        }
        else
            lastPageEle.classList.add('disabled');
        if (loadNext) {
            nextPageEle.href = "#/home/".concat(typeId, "/").concat(nextPage, "/").concat(poncon.pages.home.data.argsTypeName);
            nextPageEle.classList.remove('disabled');
        }
        else
            nextPageEle.classList.add('disabled');
    }
}
/**
 * 发送 POST 请求
 * @param path 接口路径
 * @param data 请求数据
 * @param success 回调函数
 * @param async 是否异步
 */
function request(path, data, success, async) {
    if (async === void 0) { async = true; }
    var xhr = new XMLHttpRequest();
    var content = querystring.stringify(data);
    xhr.open('POST', config.api + path, async);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send(content);
    /** 判断请求是否完成 */
    function response() {
        if (xhr.status == 200 && xhr.readyState == 4) {
            success(JSON.parse(xhr.responseText));
        }
    }
    if (!async)
        return response();
    xhr.onreadystatechange = function () {
        response();
    };
}
/** 修改导航栏激活状态 */
function changeActiveMenu() {
    var target = location.hash.split('/')[1] || 'home';
    /** 侧边导航选项 */
    var eles = document.querySelectorAll('.sidebar .menu .item');
    eles.forEach(function (ele) {
        ele.classList.remove('active');
    });
    /** 底部导航选项 */
    var elesBottom = document.querySelectorAll('.bottom-menu .item');
    elesBottom.forEach(function (ele) {
        ele.classList.remove('active');
    });
    /** 侧边导航选项 */
    var activeEle = document.querySelector(".sidebar .menu .item-".concat(target));
    /** 底部导航选项 */
    var activeBottomEle = document.querySelector(".bottom-menu .item-".concat(target));
    activeEle === null || activeEle === void 0 ? void 0 : activeEle.classList.add('active');
    activeBottomEle === null || activeBottomEle === void 0 ? void 0 : activeBottomEle.classList.add('active');
}
/** 将秒数转换为文本 */
function parseDuration(duration) {
    var hour = Math.floor(duration / 3600);
    var min = Math.floor((duration - hour * 3600) / 60);
    var sec = duration - hour * 3600 - min * 60;
    var str = '';
    str += hour > 0 ? "".concat(hour, "\u65F6") : '';
    str += min > 0 ? "".concat(min, "\u5206") : '';
    str += sec > 0 ? "".concat(sec, "\u79D2") : '';
    return str;
}
/** 将 URL 的协议改成 HTTP */
function changeToHttp(url) {
    return url.replace(/^https?:/, 'http:');
}
/** 水平滚动条 */
function animateScrollLeft(element, to, duration) {
    var start = element.scrollLeft;
    var change = to - start;
    var currentTime = 0;
    var increment = 20;
    function animate() {
        currentTime += increment;
        var val = easeInOutQuad(currentTime, start, change, duration);
        element.scrollLeft = val;
        if (currentTime < duration) {
            requestAnimationFrame(animate);
        }
    }
    function easeInOutQuad(t, b, c, d) {
        t /= d / 2;
        if (t < 1)
            return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    }
    animate();
}
/**
 * `.body` 元素回到顶部
 */
function bodyToTop() {
    var _a;
    (_a = document.querySelector('.body')) === null || _a === void 0 ? void 0 : _a.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}
