import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // 关键修复：引入样式文件

const rootElement = document.getElementById('root');
console.log('测试')
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}
console.log('测试')
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);