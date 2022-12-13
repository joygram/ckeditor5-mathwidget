import { Plugin } from 'ckeditor5/src/core';
import { WidgetToolbarRepository } from 'ckeditor5/src/widget';

import { g_plugin_name, g_model_name, g_css_name } from './utils';

var plugin

export default class Toolbar extends Plugin {
	static get requires() {
		return [WidgetToolbarRepository];
	}

	static get pluginName() {
		return `${g_plugin_name}Toolbar`;
	}

	afterInit() {
		const editor = this.editor;
		const t = editor.t;

		const widgetToolbarRepository = editor.plugins.get(WidgetToolbarRepository);
		const toolbar_items = [`SourceView${g_plugin_name}`, `SplitView${g_plugin_name}`, `Preview${g_plugin_name}`, '|', `Info${g_plugin_name}`]; //_registerCommands, _addMathInfoButton

		if (toolbar_items) {
			widgetToolbarRepository.register(`${g_plugin_name}Toolbar`, {
				ariaLabel: t(`${g_plugin_name} Toolbar`),
				items: toolbar_items,
				getRelatedElement: selection => getSelectedElement(selection)
			});
		}
	}
}

function getSelectedElement(selection) {
	const viewElement = selection.getSelectedElement();

	if (viewElement && viewElement.hasClass(`${g_css_name}__wrapper`)) {
		return viewElement;
	}

	return null;
}
