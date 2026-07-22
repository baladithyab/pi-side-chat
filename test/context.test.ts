import { describe,expect,test } from 'bun:test';
import { buildConversationSnapshot,SIDE_SYSTEM_PROMPT } from '../src/context.js';
describe('snapshot',()=>{
 test('keeps user assistant and tool results but excludes thinking and custom entries',()=>{
  const text=buildConversationSnapshot([
   {type:'message',message:{role:'user',content:'Build Atlas'}},
   {type:'message',message:{role:'assistant',content:[{type:'thinking',thinking:'secret'},{type:'text',text:'Using config.json'},{type:'toolCall',name:'read',arguments:{path:'config.json'}}]}},
   {type:'message',message:{role:'toolResult',toolName:'read',content:[{type:'text',text:'enabled=true'}]}},
   {type:'custom',message:{role:'user',content:'ignore'}}
  ]);
  expect(text).toContain('User: Build Atlas');expect(text).toContain('Using config.json');expect(text).toContain('Called read');expect(text).toContain('enabled=true');expect(text).not.toContain('secret');expect(text).not.toContain('ignore');
 });
 test('retains the newest tail under a cap',()=>{const text=buildConversationSnapshot([{type:'message',message:{role:'user',content:'old'.repeat(100)}},{type:'message',message:{role:'assistant',content:'new fact'}}],30);expect(text).toStartWith('[Earlier');expect(text).toContain('new fact');});
 test('system contract forbids tools and main-thread steering',()=>{expect(SIDE_SYSTEM_PROMPT).toContain('no tools');expect(SIDE_SYSTEM_PROMPT).toContain('Never instruct or steer');});
});
