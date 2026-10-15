import './raf-shim';
import { createRoot } from 'react-dom/client';
import '../design-system/tokens.css';
import './report.css';
import './report-pro.css';
import './report-quick.css';
import './report-batch.css';
import './vendor/doc-page.js';
import sprite from '../design-system/icons.svg?raw';
import { ReportController } from './ReportController';
import { enableCapture, isCapture } from './capture';

const holder = document.createElement('div');
holder.id = 'hdi-sprite';
holder.innerHTML = sprite;
document.body.insertBefore(holder, document.body.firstChild);

if (isCapture()) enableCapture();

createRoot(document.getElementById('root')!).render(<ReportController />);
