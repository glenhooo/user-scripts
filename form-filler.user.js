// ==UserScript==
// @name         通用一键填表助手 (Form Filler)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  在网页右上角提供一个浮层，支持自定义 CSS 选择器和值，一键回填表单。支持 Vue/React 等现代框架。
// @author       Gemini
// @match        *://*/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';

    // --- 1. 配置与样式 ---
    const STORAGE_KEY = 'gm_form_filler_config_' + window.location.hostname; // 按域名隔离配置

    // 注入 CSS
    const css = `
        #gm-form-filler-container {
            position: fixed;
            top: 20px;
            right: 20px;
            width: 300px;
            background: #ffffff;
            border: 1px solid #ddd;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 999999;
            border-radius: 8px;
            font-family: sans-serif;
            font-size: 14px;
            color: #333;
        }
        #gm-filler-header {
            padding: 10px 15px;
            background: #f0f2f5;
            border-bottom: 1px solid #ddd;
            border-radius: 8px 8px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            user-select: none;
        }
        #gm-filler-header h3 { margin: 0; font-size: 14px; font-weight: bold; }
        #gm-filler-body { padding: 15px; display: block; }
        #gm-filler-body.hidden { display: none; }
        textarea#gm-config-input {
            width: 100%;
            height: 150px;
            box-sizing: border-box;
            border: 1px solid #ccc;
            border-radius: 4px;
            padding: 8px;
            font-family: monospace;
            font-size: 12px;
            resize: vertical;
            margin-bottom: 10px;
        }
        .gm-btn-group { display: flex; gap: 10px; }
        button.gm-btn {
            flex: 1;
            padding: 8px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            transition: background 0.2s;
        }
        #gm-btn-fill { background: #1890ff; color: white; }
        #gm-btn-fill:hover { background: #40a9ff; }
        #gm-btn-save { background: #52c41a; color: white; }
        #gm-btn-save:hover { background: #73d13d; }
        .gm-tip { font-size: 12px; color: #999; margin-bottom: 5px; }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    // --- 2. 创建 UI ---
    const container = document.createElement('div');
    container.id = 'gm-form-filler-container';

    // 默认配置示例
    const defaultConfig = {
        "#username": "MyName",
        "input[name='email']": "test@example.com",
        "#password": "123456",
        "textarea.bio": "这是自动填写的简介"
    };

    // 读取保存的配置
    const savedConfigStr = localStorage.getItem(STORAGE_KEY);
    const initialConfig = savedConfigStr ? savedConfigStr : JSON.stringify(defaultConfig, null, 4);

    container.innerHTML = `
        <div id="gm-filler-header">
            <h3>📝 一键填表助手</h3>
            <span id="gm-toggle">▼</span>
        </div>
        <div id="gm-filler-body">
            <div class="gm-tip">格式: "CSS选择器": "填入值" (JSON)</div>
            <textarea id="gm-config-input" spellcheck="false">${initialConfig}</textarea>
            <div class="gm-btn-group">
                <button id="gm-btn-save" class="gm-btn">保存配置</button>
                <button id="gm-btn-fill" class="gm-btn">一键填入</button>
            </div>
        </div>
    `;
    document.body.appendChild(container);

    // --- 3. 核心逻辑 ---

    // 切换折叠/展开
    const header = container.querySelector('#gm-filler-header');
    const body = container.querySelector('#gm-filler-body');
    const toggleBtn = container.querySelector('#gm-toggle');

    header.addEventListener('click', () => {
        const isHidden = body.classList.toggle('hidden');
        toggleBtn.textContent = isHidden ? '▲' : '▼';
    });

    // 保存配置到 LocalStorage
    const configInput = container.querySelector('#gm-config-input');
    const saveBtn = container.querySelector('#gm-btn-save');

    saveBtn.addEventListener('click', () => {
        try {
            const configStr = configInput.value;
            JSON.parse(configStr); // 校验 JSON 格式
            localStorage.setItem(STORAGE_KEY, configStr);
            saveBtn.textContent = '已保存!';
            setTimeout(() => saveBtn.textContent = '保存配置', 1000);
        } catch (e) {
            alert('配置格式错误！请确保是合法的 JSON 格式。');
        }
    });

    // 核心：设置值并触发事件 (兼容 React/Vue/Angular)
    function setNativeValue(element, value) {
        // 获取原本的 value 属性描述符
        const valueSetter = Object.getOwnPropertyDescriptor(element, 'value').set;
        const prototype = Object.getPrototypeOf(element);
        const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;

        // 如果有 setter 且不等于当前的 valueSetter (说明被框架劫持了)，则调用原型的 setter
        if (valueSetter && valueSetter !== prototypeValueSetter) {
            prototypeValueSetter.call(element, value);
        } else {
            // 普通 HTML 元素
            element.value = value;
        }

        // 触发一系列事件，确保前端框架能感知到变化
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        element.dispatchEvent(new Event('blur', { bubbles: true })); // 有些校验是在 blur 时触发
    }

    // 处理不同类型的输入框
    function fillField(selector, value) {
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) {
            console.warn(`[FormFiller] 未找到元素: ${selector}`);
            return;
        }

        elements.forEach(el => {
            // 处理 Checkbox 和 Radio
            if (el.type === 'checkbox' || el.type === 'radio') {
                if (el.checked !== value) {
                    el.click(); // 点击通常比设置 checked 属性更有效触发逻辑
                }
            }
            // 处理 Select 下拉框
            else if (el.tagName === 'SELECT') {
                el.value = value;
                el.dispatchEvent(new Event('change', { bubbles: true }));
            }
            // 处理普通 Input / Textarea
            else {
                setNativeValue(el, value);
            }
        });
    }

    // 执行填入
    const fillBtn = container.querySelector('#gm-btn-fill');

    fillBtn.addEventListener('click', () => {
        try {
            const config = JSON.parse(configInput.value);
            let count = 0;
            for (const selector in config) {
                fillField(selector, config[selector]);
                count++;
            }
            fillBtn.textContent = `已填 ${count} 项`;
            setTimeout(() => fillBtn.textContent = '一键填入', 1000);
        } catch (e) {
            alert('JSON 配置格式有误，请检查！');
            console.error(e);
        }
    });

})();
