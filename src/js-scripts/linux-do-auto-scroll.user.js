// ==UserScript==
// @name         LinuxDO自动翻页滚动
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  在网页右上角添加一个按钮，点击后自动向下滚动一屏，每2.5秒滚动一次，直到页面底部停止。
// @author       Gemini
// @match        https://linux.do/t/topic/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 创建按钮元素
    const btn = document.createElement('button');
    btn.textContent = '开始滚动';

    // 设置按钮样式（悬浮在右上角）
    Object.assign(btn.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: '999999',
        padding: '10px 15px',
        backgroundColor: '#4CAF50', // 绿色
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        fontSize: '14px',
        fontWeight: 'bold'
    });

    // 将按钮添加到页面中
    document.body.appendChild(btn);

    // 状态控制变量
    let isScrolling = false;

    // 延迟函数 (Promise)
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // 停止滚动的逻辑
    function stopScrolling() {
        isScrolling = false;
        btn.textContent = '开始滚动';
        btn.style.backgroundColor = '#4CAF50'; // 恢复绿色
    }

    // 开始滚动的核心逻辑
    async function startScrolling() {
        isScrolling = true;
        btn.textContent = '停止滚动';
        btn.style.backgroundColor = '#f44336'; // 变成红色提示停止

        while (isScrolling) {
            // 向下滚动一个屏幕的高度
            window.scrollBy({
                top: window.innerHeight,
                left: 0,
                behavior: 'smooth' // 平滑滚动，如果想要瞬间跳转可以改成 'auto'
            });

            // 等待 2.5 秒 (2500 毫秒)
            await sleep(2500);

            // 检查是否已经滚动到了页面底部
            // 加上一个 10px 的容错值，防止由于部分页面布局问题导致无法精确匹配
            if ((window.innerHeight + Math.ceil(window.scrollY)) >= document.body.offsetHeight - 10) {
                stopScrolling();
                break;
            }
        }
    }

    // 绑定点击事件
    btn.addEventListener('click', () => {
        if (isScrolling) {
            stopScrolling(); // 如果正在滚动，则停止
        } else {
            startScrolling(); // 如果没有滚动，则开始
        }
    });

})();
