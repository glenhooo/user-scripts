// ==UserScript==
// @name         Cock.li 注册辅助工具 (带显示框版)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  在注册页面右上角生成并显示随机用户名和密码
// @author       Gemini
// @match        https://cock.li/register.php
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // --- 工具函数 ---
    const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    // --- 生成逻辑 ---
    function generateUser() {
        const letters = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        let res = '';
        for (let i = 0; i < getRandomInt(3, 5); i++) res += letters[getRandomInt(0, letters.length - 1)];
        for (let i = 0; i < getRandomInt(3, 5); i++) res += numbers[getRandomInt(0, numbers.length - 1)];

        // 填充表单
        const input = document.querySelector('input[name="username"]');
        if (input) input.value = res;
        // 更新显示
        document.getElementById('display-user').innerText = res;
    }

    function generatePass() {
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const len = getRandomInt(8, 12);
        let res = '';
        res += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[getRandomInt(0, 25)];
        res += 'abcdefghijklmnopqrstuvwxyz'[getRandomInt(0, 25)];
        res += '0123456789'[getRandomInt(0, 9)];

        for (let i = res.length; i < len; i++) {
            res += charset[getRandomInt(0, charset.length - 1)];
        }
        res = res.split('').sort(() => 0.5 - Math.random()).join('');

        // 填充表单
        const p1 = document.querySelector('input[name="password"]');
        const p2 = document.querySelector('input[name="password_confirmation"]');
        if (p1) p1.value = res;
        if (p2) p2.value = res;
        // 更新显示
        document.getElementById('display-pass').innerText = res;
    }

    // --- UI 创建 ---
    const panel = document.createElement('div');
    panel.id = 'helper-panel';
    panel.style = `
        position: fixed; top: 15px; right: 15px; z-index: 10000;
        padding: 12px; background: #222; color: #eee;
        border: 1px solid #444; border-radius: 8px;
        display: flex; flex-direction: column; gap: 10px;
        box-shadow: 0 8px 16px rgba(0,0,0,0.5); font-family: monospace; width: 160px;
    `;

    const btnStyle = `
        padding: 6px; cursor: pointer; background: #444; color: #fff;
        border: 1px solid #666; border-radius: 4px; font-size: 12px;
    `;

    const displayStyle = `
        font-size: 11px; color: #00ff00; word-break: break-all;
        background: #000; padding: 4px; border-radius: 3px; min-height: 14px;
        text-align: center; border: 1px inset #333;
    `;

    // 内部结构构建
    panel.innerHTML = `
        <div style="font-size: 10px; color: #aaa; text-align: center;">Cock.li Helper</div>
        <button id="gen-user-btn" style="${btnStyle}">生成用户名</button>
        <div id="display-user" style="${displayStyle}">---</div>
        <button id="gen-pass-btn" style="${btnStyle}">生成密码</button>
        <div id="display-pass" style="${displayStyle}">---</div>
    `;

    document.body.appendChild(panel);

    // 绑定事件
    document.getElementById('gen-user-btn').onclick = generateUser;
    document.getElementById('gen-pass-btn').onclick = generatePass;

})();
