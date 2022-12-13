/**
 * @module math/mathtoolbar
 */

import { Plugin } from 'ckeditor5/src/core';
import { WidgetToolbarRepository } from 'ckeditor5/src/widget';

export default class MathToolbar extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [WidgetToolbarRepository];
	}

	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'MathToolbar';
	}

	/**
	 * @inheritDoc
	 */
	afterInit() {
		const editor = this.editor;
		const t = editor.t;

		const widgetToolbarRepository = editor.plugins.get(WidgetToolbarRepository);
		const mathToolbarItems = ['mathSourceView', 'mathSplitView', 'mathPreview', '|', 'mathInfo']; //_registerCommands, _addMathInfoButton

		if (mathToolbarItems) {
			widgetToolbarRepository.register('mathToolbar', {
				ariaLabel: t('Math toolbar'),
				items: mathToolbarItems,
				getRelatedElement: selection => getSelectedElement(selection)
			});
		}
	}
}

function getSelectedElement(selection) {
	const viewElement = selection.getSelectedElement();

	if (viewElement && viewElement.hasClass('ck-math__wrapper')) {
		return viewElement;
	}

	return null;
}
