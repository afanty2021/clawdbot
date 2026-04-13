#!/usr/bin/env tsx

/**
 * UI 结构诊断工具
 * 帮助理解 ima.copilot 的界面结构
 */

import { execSync } from 'child_process';

function delay(ms: number): void {
  execSync(`sleep ${ms / 1000}`, { encoding: 'utf-8' });
}

console.log('🔍 IMA Copilot UI 结构诊断工具\n');
console.log('='.repeat(60));

// 激活应用
console.log('🎯 激活 ima.copilot...');
execSync(`osascript -e 'tell application "ima.copilot" to activate'`, { encoding: 'utf-8' });
delay(2000);

// 获取详细的 UI 结构
console.log('\n📊 分析 UI 结构...\n');

const script = `
  tell application "System Events"
    tell process "ima.copilot"
      set frontmost to true
      delay 1

      tell window 1
        -- 获取窗口边界
        try
          set b to bounds
          set x to item 1 of b
          set y to item 2 of b
          set w to item 3 of b - item 1 of b
          set h to item 4 of b - item 2 of b

          log "窗口位置: (" & x & ", " & y & ")"
          log "窗口大小: " & w & " x " & h
        on error
          log "无法获取窗口边界"
        end try

        -- 获取所有按钮
        log "\n--- 按钮 ---"
        try
          set allButtons to every button
          repeat with btn in allButtons
            try
              set btnName to name of btn
              set btnPos to position of btn
              set btnX to item 1 of btnPos
              set btnY to item 2 of btnPos
              log "按钮: " & btnName & " at (" & btnX & ", " & btnY & ")"
            on error errMsg
              -- 忽略无法访问的按钮
            end try
          end repeat
        end try

        -- 获取所有静态文本
        log "\n--- 文本 ---"
        try
          set allTexts to every static text
          set textCount to 0
          repeat with txt in allTexts
            try
              set txtValue to value of txt
              set txtPos to position of txt
              set txtX to item 1 of txtPos
              set txtY to item 2 of txtPos

              -- 只显示前 30 个文本元素
              if textCount < 30 then
                log "文本: " & txtValue & " at (" & txtX & ", " & txtY & ")"
                set textCount to textCount + 1
              end if
            on error errMsg
              -- 忽略无法访问的文本
            end try
          end repeat
          log "共 " & (count of allTexts) & " 个文本元素"
        end try

        -- 获取所有文本框
        log "\n--- 文本框 ---"
        try
          set allTextFields to every text field
          repeat with tf in allTextFields
            try
              set tfValue to value of tf
              set tfPos to position of tf
              set tfX to item 1 of tfPos
              set tfY to item 2 of tfPos
              log "文本框: " & tfValue & " at (" & tfX & ", " & tfY & ")"
            on error errMsg
              -- 忽略
            end try
          end repeat
        end try

        -- 获取所有菜单按钮
        log "\n--- 菜单按钮 ---"
        try
          set allMenuButtons to every menu button
          repeat with mb in allMenuButtons
            try
              set mbName to name of mb
              set mbPos to position of mb
              set mbX to item 1 of mbPos
              set mbY to item 2 of mbPos
              log "菜单按钮: " & mbName & " at (" & mbX & ", " & mbY & ")"
            on error errMsg
              -- 忽略
            end try
          end repeat
        end try

      end tell
    end tell
  end tell
`;

console.log('执行 AppleScript 分析...\n');

try {
  const result = execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });
  console.log(result);
} catch (error) {
  console.log('诊断完成');
}

console.log('\n' + '='.repeat(60));
console.log('✅ 诊断完成！');
console.log('='.repeat(60));
console.log('\n💡 根据上述信息，您可以：');
console.log('   1. 找到"知识库"按钮的位置');
console.log('   2. 找到"AI"知识库的文本位置');
console.log('   3. 找到"微信公众号"文章标题的位置');
console.log('   4. 确定地址栏的位置和特征\n');
