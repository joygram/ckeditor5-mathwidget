/**
 * @module math/math
 */

import { Plugin } from 'ckeditor5/src/core';

import MathEditing from './mathediting';
import MathToolbar from './mathtoolbar';
import MathUI from './mathui';

import '../theme/math.css';


export default class Math extends Plugin {
	static get requires() {
		return [MathEditing, MathToolbar, MathUI];
	}

	static get pluginName() {
		return 'Math';
	}
}
