import { Plugin } from 'ckeditor5/src/core';

import Editing from './editing';
import Toolbar from './toolbar';
import UI from './ui';
import { g_plugin_name, g_model_name, g_css_name } from './utils';

import '../theme/math.css';


export default class MathWidget extends Plugin {
	static get requires() {
		return [Editing, Toolbar, UI];
	}

	static get pluginName() {
		return `${g_plugin_name}`;//'MathWidget';
	}
}
