import Poncon from 'ponconjs'
import * as querystring from 'querystring'
import hlsClass = require('hls.js')
import { Modal } from 'bootstrap'
import Clipboard = require('clipboard')
const Hls: any = hlsClass
new Clipboard('.copy-text')
/** 加载搜索模态框 */
function loadSearchModal() {
    /** 搜索模态框 */
    const searchModalEle = document.querySelector<HTMLDivElement>('#search-modal')
    if (!searchModalEle) return
    /** 搜索模态框对象 */
    const searchModal = new Modal(searchModalEle)
    /** 点击弹出模态框 */
    const searchItemEle = document.querySelectorAll<HTMLButtonElement>('.item-search')
    /** 搜索按钮 */
    const searchBtn = searchModalEle.querySelector<HTMLButtonElement>('.search')
    /** 搜索输入框 */
    const keywordEle = document.querySelector<HTMLInputElement>('#search-modal .keyword')
    searchItemEle[0].addEventListener('click', show)
    searchItemEle[1].addEventListener('click', show)
    searchBtn?.addEventListener('click', search)
    /** 显示模态框 */
    function show() {
        searchModal.show()
    }
    searchModalEle.addEventListener('shown.bs.modal', () => {
        keywordEle?.focus()
    })
    keywordEle?.addEventListener('keyup', (event) => {
        if (event.key == 'Enter') search()
    })
    /** 搜索 */
    function search() {
        let keyword = keywordEle?.value
        if (keyword?.match(/^\s*$/)) return
        loadVideoList('', 0, 24, keyword, () => { searchModal.hide() })
        config.searching = true
        location.hash = ''
    }
    window.addEventListener('keydown', (event) => {
        if (event.key == 's' && event.ctrlKey) event.preventDefault()
    })
    window.addEventListener('keyup', (event) => {
        if (event.key == 's' && event.ctrlKey) show()
        else if (event.key == '/') {
            let modalIsHide = !searchBtn?.offsetParent
            if (modalIsHide) show()
        }
    })
}
loadSearchModal()
/** 配置信息 */
const config: {
    /** 后端请求接口地址 */
    api: string,
    /** 身份信息 */
    userInfo?: any,
    /** 站点名称 */
    siteName: string,
    /** 用户是否已经和页面交互，该值可判断是否自动播放视频 */
    canPlay: boolean,
    /** 是否正在搜索 */
    searching: boolean
} = {
    api: 'https://9db16d0067c744feb0edef5e5b5bd6ec.apig.cn-south-1.huaweicloudapis.com',
    siteName: 'AVIN 视频',
    canPlay: false,
    searching: false
}
/** 缓存数据 */
const dataCache: {
    [key: string]: any
} = {}

const poncon = new Poncon()
poncon.setPageList(['home', 'video', 'about', 'female', 'type', 'play'])
poncon.pages.home.data.types = [
    { typeId: '', name: '全部' },
    { typeId: '1043', name: '国产自拍' },
    { typeId: '1901', name: '亚洲有码' },
    { typeId: '1042', name: '亚洲无码' },
    { typeId: '1029', name: '成人动漫' },
    { typeId: '1045', name: '欧美情色' },
    { typeId: '1912', name: '国产 AV' },
    { typeId: '1891', name: '经典三级' },
]

changeActiveMenu()
window.onhashchange = (event) => {
    changeActiveMenu()
    bodyToTop()
}

window.onclick = () => {
    config.canPlay = true
}

request('/login/api/login', {
    channel_id: 3000,
    device_id: 'apee'
}, (data) => {
    config.userInfo = data.data
}, false)

poncon.setPage('home', (dom, args, pageData) => {
    /** 此时，可能是由其他页面，通过搜索事件进入本页面，则直接忽略原来的事件 */
    if (config.searching) {
        config.searching = false
        return
    }
    const eleTypeList = dom?.querySelector('.type-list') as HTMLElement
    if (!pageData.load) {
        eleTypeList.innerHTML = ((): string => {
            let html = '<div class="d-inline-block head-type"></div>'
            pageData.types.forEach((type: { typeId: number | null, name: string }) => {
                html += `<a class="btn btn-outline-secondary" data-type-id="${type.typeId}" href="#/home/${type.typeId}">${type.name}</a>`
            })
            return html
        })()
    }

    const eles = eleTypeList?.querySelectorAll<HTMLElement>('[data-type-id]')
    eles.forEach(ele => {
        ele.classList.remove('btn-secondary')
        ele.classList.add('btn-outline-secondary')
    })
    eleTypeList.onwheel = function (event) {
        event.preventDefault()
        animateScrollLeft(eleTypeList, eleTypeList.scrollLeft + 200 * (event.deltaY > 0 ? 1 : -1), 600)
    }
    const nowTypeId = (args as string[])[0] || ''
    const page = parseInt((args as string[])[1]) || 0
    const argsTypeName = (args as string[])[2] || ''
    pageData.argsTypeName = argsTypeName
    const nowEle = eleTypeList?.querySelector(`[data-type-id="${nowTypeId}"]`) as HTMLDivElement
    /** 开头的分类选项卡，用于放置非主页原有分类标签 */
    const headTypeEle = eleTypeList.querySelector('.head-type')
    if (argsTypeName) {
        document.title = decodeURIComponent(argsTypeName) + ' - ' + config.siteName
        if (headTypeEle) headTypeEle.innerHTML = `<a class="btn btn-secondary" data-type-id="${nowTypeId}" href="#/home/${nowTypeId}/0/${decodeURIComponent(argsTypeName)}">${decodeURIComponent(argsTypeName)}</a>`
    } else {
        document.title = nowEle?.innerText + ' - ' + config.siteName
    }
    nowEle?.classList?.remove('btn-outline-secondary')
    nowEle?.classList?.add('btn-secondary')
    pageData.load = true
    loadVideoList(nowTypeId, page, 24)
})
poncon.setPage('play', (dom, args, pageData) => {
    if (pageData.load) {
        return
    }
    const videoId = (args as string[])[0]
    const videoEle = dom?.querySelector('video') as HTMLVideoElement
    const postData = {
        uid: config.userInfo.user_id,
        session: config.userInfo.session,
        video_id: videoId
    }
    const dataCacheName = JSON.stringify({
        path: '/video/view/info',
        postData: postData
    })
    if (dataCache[dataCacheName]) {
        runData(dataCache[dataCacheName])
    } else {
        request('/video/view/info', postData, (data) => {
            dataCache[dataCacheName] = data
            runData(data)
        })
    }
    function runData(data: any) {
        pageData.load = true
        const videoUrl: string = data.data.video.href
        const videoTitle: string = data.data.video.name
        const videoTitleEle = dom?.querySelector('.videoTitle') as HTMLDivElement
        videoTitleEle.innerHTML = videoTitle
        playVideo(videoUrl, videoEle, dom as HTMLDivElement)
    }
})

poncon.setPage('type', (dom, args, pageData) => {
    const page = parseInt((args && args[0]) as string) || 0
    loadSubTypeList(page, 24)
})
poncon.setPage('female', (dom, args, pageData) => {
    const page = parseInt((args && args[0]) as string) || 0
    loadSubTypeList(page, 24, 'female')
})

poncon.start()
function playVideo(videoUrl: string, videoEle: HTMLVideoElement, dom: HTMLDivElement) {
    console.log('播放器载入')
    const hls = new Hls()
    if (Hls.isSupported()) {
        hls.loadSource(videoUrl)
        hls.attachMedia(videoEle)
    } else if (videoEle?.canPlayType('application/vnd.apple.mpegurl')) {
        videoEle.src = videoUrl
    }
    if (config.canPlay) {
        videoEle?.play()
    }
    dom?.querySelector('.m3u8-url')?.setAttribute('data-clipboard-text', videoUrl)
    const reloadEle = <HTMLButtonElement>dom?.querySelector('.reload')
    
    reloadEle.onclick = () => {
        playVideo(videoUrl, videoEle, dom)
    }
}

/**
 * 加载子类列表
 * @param page 页码 初始值为 0
 * @param pageSize 每页加载数量
 * @param listType 列表类型，`type`: 子类，`female`：女优
 */
function loadSubTypeList(page: number = 0, pageSize: number = 24, listType: string = 'type') {
    const postData = {
        uid: config.userInfo.user_id,
        session: config.userInfo.session,
        page: page + 1,
        page_size: pageSize
    }
    const path = { type: '/video/label/type_list', female: '/video/label/performer_list' }[listType] as string
    const dataCacheName = JSON.stringify({
        path: path,
        postData: postData
    })
    const pageDom = {
        type: document.querySelector('.poncon-type') as HTMLElement,
        female: document.querySelector('.poncon-female') as HTMLElement
    }[listType] as HTMLElement
    const listEle = pageDom.querySelector('.sub-type-list') as HTMLElement
    listEle.innerHTML = ''
    if (dataCache[dataCacheName]) {
        runData(dataCache[dataCacheName])
    } else {
        loading(false)
        request(path, postData, (data) => {
            dataCache[dataCacheName] = data
            runData(data)
            loading(true)
        })
    }

    function runData(data: any) {
        const listEle = pageDom.querySelector('.sub-type-list') as HTMLElement
        const dataList = data.data
        /** 是否允许加载下一页 */
        const loadNext = (dataList && dataList.length == pageSize)
        /** 是否允许加载上一页 */
        const loadLast = page > 0
        changePageLink(loadLast, loadNext)
        listEle.innerHTML = ((dataList) => {
            let html = ''
            dataList.forEach((item: {
                /** 子类 ID */
                id: number,
                /** 子类名称 */
                name: string,
                /** 子类视频数量 */
                video_num: number
            }) => {
                html += `
                <div class="col-xl-3 col-lg-4 col-sm-6 mb-4">
                    <a class="card hover-shadow card-body text-center ls-1" data-type-id="${item.id}" href="#/home/${item.id}/0/${item.name}">
                        <div class="h5 single-line">${item.name}</div>
                        <div class="text-primary">共 ${item.video_num} 个视频</div>
                    </a>
                </div>`
            })
            return html
        })(dataList)
    }

    /**
     * 加载中
     * @param ifEnd 是否加载完成
     */
    function loading(ifEnd: boolean) {
        const pageChangeToolEle = pageDom.querySelector('.page-change-tool') as HTMLElement
        pageChangeToolEle.style.display = ifEnd ? 'block' : 'none'
        const loadingEle = pageDom.querySelector('.spinner-grow') as HTMLElement
        loadingEle.style.display = ifEnd ? 'none' : 'block'
    }

    /**
     * 更新翻页按钮
     * @param loadLast 是否允许上一页
     * @param loadNext 是否允许下一页
     */
    function changePageLink(loadLast: boolean, loadNext: boolean) {
        const lastPage = page == 0 ? 0 : page - 1
        const nextPage = page + 1
        const lastPageEle = pageDom.querySelector('.last-page') as HTMLLinkElement
        const nextPageEle = pageDom.querySelector('.next-page') as HTMLLinkElement

        if (loadLast) {
            lastPageEle.href = `#/${listType}/${lastPage}`
            lastPageEle.classList.remove('disabled')
        }
        else lastPageEle.classList.add('disabled')
        if (loadNext) {
            nextPageEle.href = `#/${listType}/${nextPage}`
            nextPageEle.classList.remove('disabled')
        } else nextPageEle.classList.add('disabled')
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
function loadVideoList(typeId: string, page: number = 0, pageSize: number = 24, keyword: string = '', callback?: () => void) {
    const listEle = document.querySelector('.poncon-home .video-list') as HTMLElement
    listEle.innerHTML = ''
    const postData = {
        uid: config.userInfo.user_id,
        session: config.userInfo.session,
        is_review: 0,
        is_new: 1,
        v: 0,
        search: keyword,
        label_id: typeId,
        page: page + 1,
        page_size: pageSize,
    }
    /** 数据缓存键 */
    const dataCacheName = JSON.stringify({
        path: '/video/view/list',
        postData: postData
    })
    if (dataCache[dataCacheName]) {
        // 使用缓存数据
        runData(dataCache[dataCacheName])
    } else {
        // 重新请求数据
        loading(false)
        request('/video/view/list', postData, (data) => {
            runData(data)
            loading(true)
        })
    }
    /**
     * 加载中
     * @param ifEnd 加载是否完成
     */
    function loading(ifEnd: boolean) {
        const changPageToolEle = document.querySelector('.poncon-home .page-change-tool') as HTMLElement
        changPageToolEle.style.display = ifEnd ? 'block' : 'none'
        const loadingEle = document.querySelector('.poncon-home .spinner-grow') as HTMLElement
        loadingEle.style.display = ifEnd ? 'none' : 'block'
    }
    /** 数据获取成功后操作 */
    function runData(data: any) {
        dataCache[dataCacheName] = data // 缓存数据
        const list = data.data.list as any[]
        if (!list) {
            return
        }
        const html = ((list) => {
            let html = ''
            list.forEach((item: {
                /** 封片图片 */
                href_image: string,
                /** 视频标题 */
                name: string,
                /** 时长 */
                duration: number,
                /** 类型 */
                performer: string,
                /** 发布时间 */
                update_time: string,
                /** 视频文件地址 */
                href: string,
                /** 视频 ID */
                id: number
            }) => {
                if (!item.href) return
                html += `
                <div class="col-xxl-3 col-xl-3 col-lg-4 col-sm-6 mb-4">
                    <a class="card hover-shadow h-100 list-item overflow-hidden" href="#/play/${item.id}">
                        <div class="ratio ratio-16x9">
                            <div class="img-box overflow-hidden">
                                <img src="${changeToHttp(item.href_image)}" alt="${item.name}" class="card-img-top">
                            </div>
                        </div>
                        <div class="card-body d-flex flex-column ls-1">
                            <div class="h5 card-title multi-line videoTitle">${item.name}</div>
                            <div class="card-text small text-muted d-flex mb-2 mt-auto">
                                <span class="me-auto"><span class="text-success">${parseDuration(item.duration)}</span></span>
                                <span>${item.performer}</span>
                            </div>
                            <div class="publish-time small text-muted">${item.update_time}</div>
                        </div>
                    </a>
                </div>`
            })
            return html
        })(list)
        listEle.innerHTML = html
        listEle.querySelectorAll<HTMLElement>('.list-item').forEach(ele => {
            ele.onclick = () => {
                poncon.pages.play.data.load = false
            }
        })
        const listLength = listEle.querySelectorAll<HTMLElement>('.list-item').length
        /** 是否允许加载下一页 */
        const loadNext = (list && listLength == pageSize)
        /** 是否允许加载上一页 */
        const loadLast = page > 0
        changePageLink(loadLast, loadNext)
        callback && callback()
    }

    /**
     * 更新翻页按钮
     * @param loadLast 是否允许上一页
     * @param loadNext 是否允许下一页
     */
    function changePageLink(loadLast: boolean, loadNext: boolean) {
        const lastPage = page == 0 ? 0 : page - 1
        const nextPage = page + 1
        const lastPageEle = document.querySelector('.poncon-home .last-page') as HTMLLinkElement
        const nextPageEle = document.querySelector('.poncon-home .next-page') as HTMLLinkElement
        if (loadLast) {
            lastPageEle.href = `#/home/${typeId}/${lastPage}/${poncon.pages.home.data.argsTypeName}`
            lastPageEle.classList.remove('disabled')
        }
        else lastPageEle.classList.add('disabled')
        if (loadNext) {
            nextPageEle.href = `#/home/${typeId}/${nextPage}/${poncon.pages.home.data.argsTypeName}`
            nextPageEle.classList.remove('disabled')
        } else nextPageEle.classList.add('disabled')
    }
}

/**
 * 发送 POST 请求
 * @param path 接口路径
 * @param data 请求数据
 * @param success 回调函数
 * @param async 是否异步
 */
function request(
    path: string,
    data: any,
    success: (
        /** 响应数据 */
        data: any
    ) => void,
    async: boolean = true
) {
    const xhr = new XMLHttpRequest()
    const content = querystring.stringify(data)
    xhr.open('POST', config.api + path, async)
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
    xhr.send(content)
    /** 判断请求是否完成 */
    function response() {
        if (xhr.status == 200 && xhr.readyState == 4) {
            success(JSON.parse(xhr.responseText))
        }
    }
    if (!async) return response()
    xhr.onreadystatechange = () => {
        response()
    }
}


/** 修改导航栏激活状态 */
function changeActiveMenu() {
    const target = location.hash.split('/')[1] || 'home'
    /** 侧边导航选项 */
    const eles = document.querySelectorAll<HTMLElement>('.sidebar .menu .item')
    eles.forEach(ele => {
        ele.classList.remove('active')
    })
    /** 底部导航选项 */
    const elesBottom = document.querySelectorAll<HTMLElement>('.bottom-menu .item')
    elesBottom.forEach(ele => {
        ele.classList.remove('active')
    })
    /** 侧边导航选项 */
    const activeEle = document.querySelector(`.sidebar .menu .item-${target}`)
    /** 底部导航选项 */
    const activeBottomEle = document.querySelector(`.bottom-menu .item-${target}`)
    activeEle?.classList.add('active')
    activeBottomEle?.classList.add('active')
}

/** 将秒数转换为文本 */
function parseDuration(duration: number) {
    const hour = Math.floor(duration / 3600)
    const min = Math.floor((duration - hour * 3600) / 60)
    const sec = duration - hour * 3600 - min * 60
    let str = ''
    str += hour > 0 ? `${hour}时` : ''
    str += min > 0 ? `${min}分` : ''
    str += sec > 0 ? `${sec}秒` : ''
    return str
}



/** 将 URL 的协议改成 HTTP */
function changeToHttp(url: string) {
    return url.replace(/^https?:/, 'http:')
}

/** 水平滚动条 */
function animateScrollLeft(element: HTMLElement, to: number, duration: number) {
    const start = element.scrollLeft
    const change = to - start
    let currentTime = 0
    const increment = 20

    function animate() {
        currentTime += increment
        var val = easeInOutQuad(currentTime, start, change, duration)
        element.scrollLeft = val
        if (currentTime < duration) {
            requestAnimationFrame(animate)
        }
    }
    function easeInOutQuad(t: number, b: number, c: number, d: number) {
        t /= d / 2
        if (t < 1) return c / 2 * t * t + b
        t--
        return -c / 2 * (t * (t - 2) - 1) + b
    }
    animate()
}

/**
 * `.body` 元素回到顶部
 */
function bodyToTop() {
    document.querySelector('.body')?.scrollTo({
        top: 0,
        behavior: "smooth"
    })
}